import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
function load(relative, imports, globals = {}) {
  const target = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { exports: target.exports, module: target, AbortSignal, Response, URL, File, Buffer, fetch, ...globals, require: name => { assert.ok(name in imports, name); return imports[name]; } });
  return target.exports;
}
const auth = { authenticatedApiHeaders: async () => ({ Authorization: 'Bearer test' }) };
const form = values => { const data = new FormData(); for (const [key,value] of Object.entries(values)) data.set(key,value); return data; };
test('favorite acknowledges only the write without a redirect or layout refresh; failure is retryable', async () => {
  const calls = []; let fail = false;
  const actions = load('../src/app/workspace/engagement-actions.ts', {
    '@/lib/auth': auth, '@/lib/api': { serverApiFetch: async (path, init) => { if (fail) throw Error(); calls.push([path, init.method]); return {}; } },
    'next/navigation': { redirect: () => { throw Error('must not redirect'); } },
  });
  assert.equal((await actions.favoriteAction(form({contentId:'c',active:'false'}))).active,true);
  assert.equal((await actions.favoriteAction(form({contentId:'c',active:'true'}))).active,false);
  assert.deepEqual(calls,[['/api/contents/c/favorite','POST'],['/api/contents/c/favorite','DELETE']]);
  fail = true; assert.ok((await actions.favoriteAction(form({contentId:'c'}))).error);
});
test('managed publication returns the confirmed record before any catalog read', async () => {
  const calls = [];
  const actions = load('../src/app/workspace/submit/actions.ts', {
    '@/lib/auth': auth, '@/lib/api': { serverApiFetch: async (path) => { calls.push(path); return {contentType:'AI_SKILL',title:'Confirmed',slug:'confirmed',summary:'Real'}; } },
    '@/lib/user-error': { userError:()=> 'failed' }, './attachment-actions': {},
    'next/cache': { revalidatePath:()=>{throw Error('no page read');} }, 'next/navigation': { redirect:()=>{throw Error('no redirect');} },
  });
  const result = await actions.publishDraftAction({},form({id:'c',contentType:'AI_SKILL',title:'Confirmed',__managedCache:'true'}));
  assert.equal(result.publishedHref,'/workspace/ai-skills'); assert.equal(result.publication.title,'Confirmed');
  assert.equal(calls.length,1); assert.equal(calls[0],'/api/content-drafts/c/publish');
});
test('search click endpoint rejects cross-origin and malformed requests before contacting API', async () => {
  let count=0;
  const route = load('../src/app/api/search-click/route.ts', { '@/lib/auth':auth,'@/lib/api':{ApiError:class extends Error {},serverApiFetch:async()=>{count++;}} });
  const request=(origin,data)=>new Request('https://hub.example/api/search-click',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
  assert.equal((await route.POST(request('https://other.example',{contentId:'a',searchLogId:'b'}))).status,403);
  assert.equal((await route.POST(request('https://hub.example',{}))).status,400);
  assert.equal(count,0);
  assert.equal((await route.POST(request('https://hub.example',{contentId:'a',searchLogId:'b'}))).status,204); assert.equal(count,1);
});
test('upload checks draft access first and retains server-authorized file protocol', async () => {
  const calls=[];let deny=true;
  const actions=load('../src/app/workspace/submit/attachment-actions.ts',{
    '@/lib/auth':auth, '@/lib/user-error':{userError:()=> 'failed'}, 'node:crypto':{},
    '@/lib/api':{serverApiFetch:async(path,init)=>{calls.push(path);if(deny)throw Error('denied');if(path.includes('upload-intents'))return {file:{id:'file'},upload:{url:'https://storage.example/signed',method:'PUT',headers:{}}};return {attachments:[],coverFile:null};}},
  });
  const input={id:'draft',name:'file.pdf',type:'application/pdf',size:500,checksum:'checksum',cover:false};
  await assert.rejects(actions.prepareDraftUpload(input));assert.deepEqual(calls,['/api/content-drafts/draft']);
  deny=false;const prepared=await actions.prepareDraftUpload(input);assert.equal(prepared.upload.method,'PUT');
  await assert.rejects(actions.prepareDraftUpload({...input,size:101*1024*1024}));
  const completed=await actions.completeDraftUpload('draft','file',false);assert.ok(completed.savedAt);assert.equal(completed.attachments.length,0);
});
test('managed attachment upload keeps storage creation, transfer, completion and draft binding in one action', async () => {
  const calls=[]; const transfers=[];
  const actions=load('../src/app/workspace/submit/attachment-actions.ts',{
    '@/lib/auth':auth, '@/lib/user-error':{userError:error=>error.message}, 'node:crypto':{createHash},
    '@/lib/api':{serverApiFetch:async(path)=>{
      calls.push(path);
      if(path==='/api/files/upload-intents')return {file:{id:'file-id'},upload:{url:'https://storage.example/signed',method:'PUT',headers:{'content-type':'image/png'}}};
      if(path==='/api/content-drafts/draft-id')return {attachments:[{id:'relation-id',fileId:'file-id',file:{originalName:'中文.png',mimeType:'image/png',sizeBytes:'3'}}],coverFile:null};
      return {};
    }},
  },{fetch:async(url,init)=>{transfers.push([url,init.method,init.headers]);return new Response('',{status:200});}});
  const data=form({id:'draft-id',file:new File([new Uint8Array([1,2,3])],'中文.png',{type:'image/png'})});
  const result=await actions.uploadDraftAttachmentAction({},data);
  assert.ok(result.savedAt); assert.equal(result.attachments.length,1);
  assert.deepEqual(calls,['/api/files/upload-intents','/api/files/file-id/complete','/api/content-drafts/draft-id/attachments/file-id','/api/content-drafts/draft-id']);
  assert.deepEqual(transfers,[['https://storage.example/signed','PUT',{'content-type':'image/png'}]]);
});
