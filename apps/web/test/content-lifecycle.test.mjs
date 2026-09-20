import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
function load(status, failure=false) {
 const code=ts.transpileModule(readFileSync(new URL('../src/app/workspace/submit/actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const calls=[], invalidations=[];const mod={exports:{}};
 const imports={'@/lib/user-error':{userError:()=> 'failed'},'@/lib/auth':{authenticatedApiHeaders:async()=>({Authorization:'Bearer test'})},'@/lib/api':{serverApiFetch:async(path,init)=>{calls.push({path,init});if(failure)throw Error('failure');return {status};}},'./attachment-actions':{},'next/navigation':{redirect:path=>{throw Error('REDIRECT:'+path);}},'next/cache':{revalidatePath:(...args)=>invalidations.push(args)}};
 runInNewContext(code,{module:mod,exports:mod.exports,require:name=>{assert.ok(name in imports);return imports[name];}});
 return {action:mod.exports.contentLifecycleAction,calls,invalidations};
}
function form(operation,id='content-1'){const f=new FormData();f.set('id',id);f.set('operation',operation);return f;}
for(const [operation,status] of [['archive','ARCHIVED'],['unpublish','UNPUBLISHED']])test(`${operation} confirms state and invalidates before redirect`,async()=>{const t=load(status);await assert.rejects(t.action({},form(operation)),/REDIRECT:\/workspace\/contributions/);assert.equal(t.calls.length,1);assert.equal(t.calls[0].path,`/api/content-drafts/content-1/${operation}`);assert.equal(t.calls[0].init.method,'POST');assert.equal(t.invalidations[0][0],'/workspace');assert.equal(t.invalidations[0][1],'layout');});
test('unchanged state and failed request never redirect',async()=>{for(const t of [load('PUBLISHED'),load('ARCHIVED',true)]){assert.ok((await t.action({},form('archive'))).error);assert.equal(t.invalidations.length,0);}});
test('invalid input never calls API',async()=>{for(const f of [form('delete'),form('archive','')]){const t=load('ARCHIVED');assert.ok((await t.action({},f)).error);assert.equal(t.calls.length,0);}});
