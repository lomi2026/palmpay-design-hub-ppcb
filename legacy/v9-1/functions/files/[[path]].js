// 文件访问代理：把上传到 GitHub 仓库 uploads/ 目录的文件，通过 palmpay-ux.cn/files/ 提供访问
// 绑定要求：环境变量 GITHUB_TOKEN（Secret）、GITHUB_OWNER、GITHUB_REPO（普通文本）

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function guessContentType(path) {
  const ext = path.split(".").pop().toLowerCase();
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    mov: "video/quicktime",
    zip: "application/zip",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    md: "text/markdown; charset=utf-8",
    txt: "text/plain",
    csv: "text/csv; charset=utf-8",
    json: "application/json",
  };
  return map[ext] || "application/octet-stream";
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function readInlineFile(env, id) {
  if (!env.DB) return null;
  try {
    return await env.DB.prepare(
      "SELECT name, content_base64, content_type FROM uploaded_files WHERE id = ?"
    )
      .bind(id)
      .first();
  } catch (error) {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  const path = decodeURIComponent(url.pathname.replace(/^\/files\//, ""));

  if (path.startsWith("d1/")) {
    const inlineFile = await readInlineFile(env, path.slice(3));
    if (!inlineFile) return new Response("File not found", { status: 404, headers: corsHeaders() });
    return new Response(base64ToBytes(inlineFile.content_base64), {
      headers: {
        "Content-Type": inlineFile.content_type || guessContentType(inlineFile.name),
        "Cache-Control": "public, max-age=31536000",
        ...corsHeaders(),
      },
    });
  }

  const ghResponse = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
    {
      headers: {
        Authorization: `token ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "palmpay-pages-fn",
      },
    }
  );

  if (!ghResponse.ok) {
    return new Response("File not found", { status: 404, headers: corsHeaders() });
  }

  return new Response(ghResponse.body, {
    headers: {
      "Content-Type": guessContentType(path),
      "Cache-Control": "public, max-age=31536000",
      ...corsHeaders(),
    },
  });
}
