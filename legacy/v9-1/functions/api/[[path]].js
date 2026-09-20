// PalmPay UX - AI Skill Toolkit / 资产上传 后端逻辑
// 作为 Cloudflare Pages Functions 运行，天然共用 palmpay-ux.cn 域名，无需额外域名/DNS配置。
//
// 绑定要求（在 Cloudflare Pages 项目 → Settings → Functions → Bindings 里配置）：
//   D1 数据库绑定名：DB
//   环境变量（Secret，加密存储）：GITHUB_TOKEN（GitHub Personal Access Token，需要 repo 权限）
//   环境变量（普通文本）：GITHUB_OWNER（例如 lomi2026）
//   环境变量（普通文本）：GITHUB_REPO（例如 palmpay-ux）

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024; // 8MB
const INLINE_UPLOAD_MAX_SIZE = 256 * 1024; // Small files avoid the GitHub write path.
const SKILL_ADMIN_USERNAME = "lomi";
let aiCasesSchemaReady = false;
let assetsSchemaReady = false;
let inlineUploadsSchemaReady = false;

async function ensureAiCasesSchema(env) {
  if (aiCasesSchemaReady) return;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ai_cases (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      owner_username TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      link_url TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      file_url TEXT,
      file_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_ai_cases_owner ON ai_cases(owner_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_ai_cases_created_at ON ai_cases(created_at DESC)").run();
  const columns = await env.DB.prepare("PRAGMA table_info(ai_cases)").all();
  if (!columns.results.some((column) => column.name === "link_url")) {
    await env.DB.prepare("ALTER TABLE ai_cases ADD COLUMN link_url TEXT").run();
  }
  if (!columns.results.some((column) => column.name === "featured")) {
    await env.DB.prepare("ALTER TABLE ai_cases ADD COLUMN featured INTEGER NOT NULL DEFAULT 0").run();
  }
  aiCasesSchemaReady = true;
}

async function ensureAssetsSchema(env) {
  if (assetsSchemaReady) return;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      owner_username TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      team TEXT NOT NULL,
      scene TEXT,
      summary TEXT,
      tags TEXT,
      link_url TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      file_url TEXT,
      file_name TEXT,
      status TEXT NOT NULL DEFAULT '待审核',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC)").run();
  const columns = await env.DB.prepare("PRAGMA table_info(assets)").all();
  if (!columns.results.some((column) => column.name === "link_url")) {
    await env.DB.prepare("ALTER TABLE assets ADD COLUMN link_url TEXT").run();
  }
  if (!columns.results.some((column) => column.name === "featured")) {
    await env.DB.prepare("ALTER TABLE assets ADD COLUMN featured INTEGER NOT NULL DEFAULT 0").run();
  }
  assetsSchemaReady = true;
}

async function ensureInlineUploadsSchema(env) {
  if (inlineUploadsSchemaReady) return;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      content_base64 TEXT NOT NULL,
      content_type TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner ON uploaded_files(owner_id)").run();
  inlineUploadsSchemaReady = true;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function generateSalt() {
  const arr = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...arr));
}

function generateToken() {
  const arr = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...arr)).replace(/[^a-zA-Z0-9]/g, "");
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

async function getUserFromRequest(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const session = await env.DB.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > ?"
  )
    .bind(token, Date.now())
    .first();
  if (!session) return null;
  const user = await env.DB.prepare("SELECT id, username FROM users WHERE id = ?")
    .bind(session.user_id)
    .first();
  return user;
}

function canManageSkill(user, skill) {
  return Boolean(user && skill && (skill.owner_id === user.id || user.username === SKILL_ADMIN_USERNAME));
}

function canManageRecord(user, record) {
  return Boolean(user && record && (record.owner_id === user.id || user.username === SKILL_ADMIN_USERNAME));
}

function asFeatured(value) {
  return value === true || value === 1 || value === "1" ? 1 : 0;
}

async function ensureFeaturedCapacity(env, table, currentId = null) {
  const query = currentId
    ? env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE featured = 1 AND id <> ?`).bind(currentId)
    : env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE featured = 1`);
  const result = await query.first();
  if (Number(result?.total || 0) >= 4) {
    throw new Error("首页最多展示 4 条推荐内容，请先取消一条现有推荐。");
  }
}

async function handleRegister(request, env) {
  const body = await request.json().catch(() => ({}));
  const { username, password } = body;
  if (!username || typeof username !== "string" || username.trim().length < 2) {
    return json({ error: "用户名至少 2 个字符" }, 400);
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return json({ error: "密码至少 6 位" }, 400);
  }
  const uname = username.trim();
  const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(uname).first();
  if (existing) {
    return json({ error: "用户名已被注册" }, 409);
  }
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const now = Date.now();
  const result = await env.DB.prepare(
    "INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)"
  )
    .bind(uname, hash, salt, now)
    .run();
  const userId = result.meta.last_row_id;
  const token = generateToken();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(token, userId, now, expiresAt)
    .run();
  return json({ token, username: uname });
}

async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  const { username, password } = body;
  if (!username || !password) return json({ error: "请输入用户名和密码" }, 400);
  const uname = username.trim();
  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(uname).first();
  if (!user) return json({ error: "用户名或密码错误" }, 401);
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) return json({ error: "用户名或密码错误" }, 401);
  const token = generateToken();
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(token, user.id, now, expiresAt)
    .run();
  return json({ token, username: user.username });
}

async function handleLogout(request, env) {
  const auth = request.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  return json({ ok: true });
}

async function handleMe(request, env) {
  const user = await getUserFromRequest(request, env);
  return json({ user: user || null });
}

async function handleListSkills(request, env) {
  const { results } = await env.DB.prepare("SELECT * FROM skills ORDER BY created_at DESC").all();
  return json({ skills: results });
}

async function handleCreateSkill(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  const body = await request.json().catch(() => ({}));
  const { title, category, stage, team, description, summary, file_url, file_name } = body;
  const resolvedDescription = String(description || summary || "").trim();
  if (!title || !category || !stage || !team || !resolvedDescription) {
    return json({ error: "缺少必填字段" }, 400);
  }
  const id = "skill-" + crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO skills (id, owner_id, owner_username, title, category, stage, team, description, summary, file_url, file_name, detail_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      user.id,
      user.username,
      title,
      category,
      stage,
      team,
      resolvedDescription,
      summary || "",
      file_url || null,
      file_name || null,
      null,
      now,
      now
    )
    .run();
  return json({ id });
}

async function handleUpdateSkill(request, env, id) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  const skill = await env.DB.prepare("SELECT * FROM skills WHERE id = ?").bind(id).first();
  if (!skill) return json({ error: "未找到该 Skill" }, 404);
  if (!canManageSkill(user, skill)) return json({ error: "你没有编辑此 Skill 的权限" }, 403);
  const body = await request.json().catch(() => ({}));
  const { title, category, stage, team, description, summary, file_url, file_name } = body;
  await env.DB.prepare(
    `UPDATE skills SET title=?, category=?, stage=?, team=?, description=?, summary=?, file_url=?, file_name=?, updated_at=? WHERE id=?`
  )
    .bind(
      title ?? skill.title,
      category ?? skill.category,
      stage ?? skill.stage,
      team ?? skill.team,
      description ?? skill.description,
      summary ?? skill.summary,
      file_url ?? skill.file_url,
      file_name ?? skill.file_name,
      Date.now(),
      id
    )
    .run();
  return json({ ok: true });
}

async function handleDeleteSkill(request, env, id) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  const skill = await env.DB.prepare("SELECT * FROM skills WHERE id = ?").bind(id).first();
  if (!skill) return json({ error: "未找到该 Skill" }, 404);
  if (!canManageSkill(user, skill)) return json({ error: "你没有删除此 Skill 的权限" }, 403);
  await env.DB.prepare("DELETE FROM skills WHERE id = ?").bind(id).run();
  if (skill.file_url && skill.file_url.includes("/files/d1/")) {
    try {
      const fileId = decodeURIComponent(skill.file_url.split("/files/d1/")[1]);
      await env.DB.prepare("DELETE FROM uploaded_files WHERE id = ?").bind(fileId).run();
    } catch (e) {}
  } else if (skill.file_url && skill.file_url.includes("/files/")) {
    try {
      const path = decodeURIComponent(skill.file_url.split("/files/")[1]);
      const getRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
        { headers: { Authorization: `token ${env.GITHUB_TOKEN}`, "User-Agent": "palmpay-pages-fn" } }
      );
      if (getRes.ok) {
        const meta = await getRes.json();
        await fetch(
          `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `token ${env.GITHUB_TOKEN}`,
              "Content-Type": "application/json",
              "User-Agent": "palmpay-pages-fn",
            },
            body: JSON.stringify({ message: "Delete skill attachment", sha: meta.sha }),
          }
        );
      }
    } catch (e) {}
  }
  return json({ ok: true });
}

async function handleListAiCases(request, env) {
  await ensureAiCasesSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM ai_cases ORDER BY created_at DESC").all();
  return json({ cases: results });
}

function normalizeAiCaseLink(value) {
  if (value == null || String(value).trim() === "") return null;
  let parsed;
  try {
    parsed = new URL(String(value).trim());
  } catch (error) {
    throw new Error("案例链接格式不正确，请填写完整的 http:// 或 https:// 地址");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("案例链接仅支持 http:// 或 https:// 地址");
  }
  return parsed.href;
}

function normalizeAssetLink(value) {
  if (value == null || String(value).trim() === "") return null;
  let parsed;
  try {
    parsed = new URL(String(value).trim());
  } catch (error) {
    throw new Error("资产链接格式不正确，请填写完整的 http:// 或 https:// 地址");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("资产链接仅支持 http:// 或 https:// 地址");
  }
  return parsed.href;
}

async function handleCreateAiCase(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  const body = await request.json().catch(() => ({}));
  const { title, type, description, link_url, file_url, file_name, featured } = body;
  if (!title || !type || !description) return json({ error: "缺少必填字段" }, 400);

  let linkUrl;
  try {
    linkUrl = normalizeAiCaseLink(link_url);
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  await ensureAiCasesSchema(env);
  const isFeatured = asFeatured(featured);
  if (isFeatured) {
    try {
      await ensureFeaturedCapacity(env, "ai_cases");
    } catch (error) {
      return json({ error: error.message }, 400);
    }
  }
  const id = "case-" + crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO ai_cases (id, owner_id, owner_username, title, type, description, link_url, featured, file_url, file_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, user.username, title.trim(), type.trim(), description.trim(), linkUrl, isFeatured, file_url || null, file_name || null, now, now)
    .run();
  return json({ id });
}

async function handleUpdateAiCase(request, env, id) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  await ensureAiCasesSchema(env);
  const aiCase = await env.DB.prepare("SELECT * FROM ai_cases WHERE id = ?").bind(id).first();
  if (!aiCase) return json({ error: "未找到该案例" }, 404);
  if (!canManageRecord(user, aiCase)) return json({ error: "你没有编辑此案例的权限" }, 403);

  const body = await request.json().catch(() => ({}));
  const { title, type, description, link_url, file_url, file_name, featured } = body;
  let linkUrl = aiCase.link_url;
  if (Object.prototype.hasOwnProperty.call(body, "link_url")) {
    try {
      linkUrl = normalizeAiCaseLink(link_url);
    } catch (error) {
      return json({ error: error.message }, 400);
    }
  }
  const nextFeatured = Object.prototype.hasOwnProperty.call(body, "featured") ? asFeatured(featured) : asFeatured(aiCase.featured);
  if (nextFeatured && !asFeatured(aiCase.featured)) {
    try {
      await ensureFeaturedCapacity(env, "ai_cases", id);
    } catch (error) {
      return json({ error: error.message }, 400);
    }
  }
  await env.DB.prepare(
    `UPDATE ai_cases SET title=?, type=?, description=?, link_url=?, featured=?, file_url=?, file_name=?, updated_at=? WHERE id=?`
  )
    .bind(
      title?.trim() || aiCase.title,
      type?.trim() || aiCase.type,
      description?.trim() || aiCase.description,
      linkUrl,
      nextFeatured,
      file_url ?? aiCase.file_url,
      file_name ?? aiCase.file_name,
      Date.now(),
      id
    )
    .run();
  return json({ ok: true });
}

async function handleDeleteAiCase(request, env, id) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  await ensureAiCasesSchema(env);
  const aiCase = await env.DB.prepare("SELECT * FROM ai_cases WHERE id = ?").bind(id).first();
  if (!aiCase) return json({ error: "未找到该案例" }, 404);
  if (!canManageRecord(user, aiCase)) return json({ error: "你没有删除此案例的权限" }, 403);

  await env.DB.prepare("DELETE FROM ai_cases WHERE id = ?").bind(id).run();
  if (aiCase.file_url && aiCase.file_url.includes("/files/d1/")) {
    try {
      const fileId = decodeURIComponent(aiCase.file_url.split("/files/d1/")[1]);
      await env.DB.prepare("DELETE FROM uploaded_files WHERE id = ?").bind(fileId).run();
    } catch (e) {}
  } else if (aiCase.file_url && aiCase.file_url.includes("/files/")) {
    try {
      const path = decodeURIComponent(aiCase.file_url.split("/files/")[1]);
      const getRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
        { headers: { Authorization: `token ${env.GITHUB_TOKEN}`, "User-Agent": "palmpay-pages-fn" } }
      );
      if (getRes.ok) {
        const meta = await getRes.json();
        await fetch(
          `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `token ${env.GITHUB_TOKEN}`,
              "Content-Type": "application/json",
              "User-Agent": "palmpay-pages-fn",
            },
            body: JSON.stringify({ message: "Delete AI case attachment", sha: meta.sha }),
          }
        );
      }
    } catch (e) {}
  }
  return json({ ok: true });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let binaryChunk = "";
    for (let j = 0; j < chunk.length; j++) {
      binaryChunk += String.fromCharCode(chunk[j]);
    }
    chunks.push(binaryChunk);
  }
  return btoa(chunks.join(""));
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.\-_\u4e00-\u9fa5]/g, "_");
}

function guessContentType(name, fallback = "") {
  if (fallback && fallback !== "application/octet-stream") return fallback;
  const ext = String(name || "").split(".").pop().toLowerCase();
  const types = {
    md: "text/markdown; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    json: "application/json",
    csv: "text/csv; charset=utf-8",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
  };
  return types[ext] || "application/octet-stream";
}

function estimateBase64Bytes(base64) {
  if (!base64) return 0;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function readUploadPayload(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string" || typeof body.contentBase64 !== "string") {
      throw new Error("请求格式错误");
    }

    const rawBase64 = body.contentBase64;
    const contentBase64 =
      rawBase64.startsWith("data:") && rawBase64.includes(",")
        ? rawBase64.slice(rawBase64.indexOf(",") + 1)
        : rawBase64;
    const size = estimateBase64Bytes(contentBase64);

    if (!contentBase64 || !size) {
      throw new Error("未收到文件");
    }
    if (size > MAX_UPLOAD_SIZE) {
      throw new Error(`文件不能超过 ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }

    return {
      originalName: body.name,
      safeName: sanitizeFileName(body.name),
      contentBase64,
      contentType: guessContentType(body.name, body.contentType),
      size,
    };
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    throw new Error("请求格式错误");
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    throw new Error("未收到文件");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(`文件不能超过 ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
  }

  return {
    originalName: file.name,
    safeName: sanitizeFileName(file.name),
    contentBase64: arrayBufferToBase64(await file.arrayBuffer()),
    contentType: guessContentType(file.name, file.type),
    size: file.size,
  };
}

async function handleListAssets(request, env) {
  await ensureAssetsSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM assets ORDER BY created_at DESC").all();
  return json({ assets: results });
}

async function handleCreateAsset(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  const body = await request.json().catch(() => ({}));
  const { title, type, team, scene, summary, tags, link_url, file_url, file_name, featured } = body;
  if (!title || !type || !team) {
    return json({ error: "缺少必填字段" }, 400);
  }
  let linkUrl;
  try {
    linkUrl = normalizeAssetLink(link_url);
  } catch (error) {
    return json({ error: error.message }, 400);
  }
  await ensureAssetsSchema(env);
  const isFeatured = asFeatured(featured);
  if (isFeatured) {
    try {
      await ensureFeaturedCapacity(env, "assets");
    } catch (error) {
      return json({ error: error.message }, 400);
    }
  }
  const id = "asset-" + crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO assets (id, owner_id, owner_username, title, type, team, scene, summary, tags, link_url, featured, file_url, file_name, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      user.id,
      user.username,
      title,
      type,
      team,
      scene || "",
      summary || "",
      JSON.stringify(tags || []),
      linkUrl,
      isFeatured,
      file_url || null,
      file_name || null,
      "待审核",
      now,
      now
    )
    .run();
  return json({ id });
}

async function handleUpdateAsset(request, env, id) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  await ensureAssetsSchema(env);
  const asset = await env.DB.prepare("SELECT * FROM assets WHERE id = ?").bind(id).first();
  if (!asset) return json({ error: "未找到该资产" }, 404);
  if (!canManageRecord(user, asset)) return json({ error: "你没有编辑此资产的权限" }, 403);
  const body = await request.json().catch(() => ({}));
  const { title, type, team, scene, summary, tags, link_url, file_url, file_name, featured } = body;
  let linkUrl = asset.link_url;
  if (Object.prototype.hasOwnProperty.call(body, "link_url")) {
    try {
      linkUrl = normalizeAssetLink(link_url);
    } catch (error) {
      return json({ error: error.message }, 400);
    }
  }
  const nextFeatured = Object.prototype.hasOwnProperty.call(body, "featured") ? asFeatured(featured) : asFeatured(asset.featured);
  if (nextFeatured && !asFeatured(asset.featured)) {
    try {
      await ensureFeaturedCapacity(env, "assets", id);
    } catch (error) {
      return json({ error: error.message }, 400);
    }
  }
  await env.DB.prepare(
    `UPDATE assets SET title=?, type=?, team=?, scene=?, summary=?, tags=?, link_url=?, featured=?, file_url=?, file_name=?, updated_at=? WHERE id=?`
  )
    .bind(
      title ?? asset.title,
      type ?? asset.type,
      team ?? asset.team,
      scene ?? asset.scene,
      summary ?? asset.summary,
      tags ? JSON.stringify(tags) : asset.tags,
      linkUrl,
      nextFeatured,
      file_url ?? asset.file_url,
      file_name ?? asset.file_name,
      Date.now(),
      id
    )
    .run();
  return json({ ok: true });
}

async function handleDeleteAsset(request, env, id) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: "请先登录" }, 401);
  await ensureAssetsSchema(env);
  const asset = await env.DB.prepare("SELECT * FROM assets WHERE id = ?").bind(id).first();
  if (!asset) return json({ error: "未找到该资产" }, 404);
  if (!canManageRecord(user, asset)) return json({ error: "你没有删除此资产的权限" }, 403);
  await env.DB.prepare("DELETE FROM assets WHERE id = ?").bind(id).run();
  if (asset.file_url && asset.file_url.includes("/files/d1/")) {
    try {
      const fileId = decodeURIComponent(asset.file_url.split("/files/d1/")[1]);
      await env.DB.prepare("DELETE FROM uploaded_files WHERE id = ?").bind(fileId).run();
    } catch (e) {}
  } else if (asset.file_url && asset.file_url.includes("/files/")) {
    try {
      const path = decodeURIComponent(asset.file_url.split("/files/")[1]);
      const getRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
        { headers: { Authorization: `token ${env.GITHUB_TOKEN}`, "User-Agent": "palmpay-pages-fn" } }
      );
      if (getRes.ok) {
        const meta = await getRes.json();
        await fetch(
          `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `token ${env.GITHUB_TOKEN}`,
              "Content-Type": "application/json",
              "User-Agent": "palmpay-pages-fn",
            },
            body: JSON.stringify({ message: "Delete asset attachment", sha: meta.sha }),
          }
        );
      }
    } catch (e) {}
  }
  return json({ ok: true });
}

async function handleUpload(request, env) {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: "请先登录" }, 401);

    let payload;
    try {
      payload = await readUploadPayload(request);
    } catch (e) {
      return json({ error: e.message || "请求格式错误", stage: "payload" }, 400);
    }

    const { originalName, safeName, contentBase64, contentType, size } = payload;
    const path = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
    const origin = new URL(request.url).origin;

    // Small working files (especially .md Skills) stay in D1. This avoids the
    // unstable external GitHub write path while keeping the same public file URL shape.
    if (size <= INLINE_UPLOAD_MAX_SIZE) {
      try {
        await ensureInlineUploadsSchema(env);
        const inlineId = "file-" + crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO uploaded_files (id, owner_id, name, content_base64, content_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(inlineId, user.id, originalName, contentBase64, contentType, Date.now())
          .run();
        return json({ url: `${origin}/files/d1/${encodeURIComponent(inlineId)}`, name: originalName, storage: "d1" });
      } catch (error) {
        console.log("Inline upload fallback", error?.message || String(error));
      }
    }

    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
      return json(
        {
          error: "服务端未正确配置 GitHub 相关环境变量",
          stage: "env-check",
          hasToken: !!env.GITHUB_TOKEN,
          hasOwner: !!env.GITHUB_OWNER,
          hasRepo: !!env.GITHUB_REPO,
        },
        500
      );
    }

    let ghResponse;
    try {
      ghResponse = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "palmpay-pages-fn",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({ message: `Upload attachment: ${safeName}`, content: contentBase64 }),
        }
      );
    } catch (e) {
      return json({ error: "调用 GitHub 接口失败：" + e.message, stage: "fetch-github" }, 502);
    }

    if (!ghResponse.ok) {
      let ghErrorText = "";
      try {
        ghErrorText = await ghResponse.text();
      } catch (e) {}
      return json(
        { error: `GitHub 返回错误 (${ghResponse.status})：${ghErrorText.slice(0, 300)}`, stage: "github-response" },
        502
      );
    }

    const publicUrl = `${origin}/files/${encodeURIComponent(path)}`;
    return json({ url: publicUrl, name: originalName });
  } catch (err) {
    return json({ error: "上传处理异常：" + (err.message || String(err)), stage: "outer" }, 500);
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    let response;
    if (path === "/api/register" && method === "POST") response = await handleRegister(request, env);
    else if (path === "/api/login" && method === "POST") response = await handleLogin(request, env);
    else if (path === "/api/logout" && method === "POST") response = await handleLogout(request, env);
    else if (path === "/api/me" && method === "GET") response = await handleMe(request, env);
    else if (path === "/api/skills" && method === "GET") response = await handleListSkills(request, env);
    else if (path === "/api/skills" && method === "POST") response = await handleCreateSkill(request, env);
    else if (path.startsWith("/api/skills/") && method === "PUT") {
      const id = decodeURIComponent(path.split("/").pop());
      response = await handleUpdateSkill(request, env, id);
    } else if (path.startsWith("/api/skills/") && method === "DELETE") {
      const id = decodeURIComponent(path.split("/").pop());
      response = await handleDeleteSkill(request, env, id);
    } else if (path === "/api/ai-cases" && method === "GET") response = await handleListAiCases(request, env);
    else if (path === "/api/ai-cases" && method === "POST") response = await handleCreateAiCase(request, env);
    else if (path.startsWith("/api/ai-cases/") && method === "PUT") {
      const id = decodeURIComponent(path.split("/").pop());
      response = await handleUpdateAiCase(request, env, id);
    } else if (path.startsWith("/api/ai-cases/") && method === "DELETE") {
      const id = decodeURIComponent(path.split("/").pop());
      response = await handleDeleteAiCase(request, env, id);
    } else if (path === "/api/assets" && method === "GET") response = await handleListAssets(request, env);
    else if (path === "/api/assets" && method === "POST") response = await handleCreateAsset(request, env);
    else if (path.startsWith("/api/assets/") && method === "PUT") {
      const id = decodeURIComponent(path.split("/").pop());
      response = await handleUpdateAsset(request, env, id);
    } else if (path.startsWith("/api/assets/") && method === "DELETE") {
      const id = decodeURIComponent(path.split("/").pop());
      response = await handleDeleteAsset(request, env, id);
    } else if (path === "/api/upload" && method === "POST") response = await handleUpload(request, env);
    else response = json({ error: "Not found" }, 404);

    return response;
  } catch (err) {
    return json({ error: err.message || "服务器错误" }, 500);
  }
}
