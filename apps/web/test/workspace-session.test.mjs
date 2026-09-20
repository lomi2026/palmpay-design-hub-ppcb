import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const source=readFileSync(new URL('../src/app/api/workspace-session/route.ts',import.meta.url),'utf8');
async function request(user){
 const routeModule={exports:{}};
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 runInNewContext(code,{module:routeModule,exports:routeModule.exports,Response,require:()=>({loadCurrentUser:async()=>{if(user instanceof Error)throw user;return user;}})});
 return routeModule.exports.GET();
}
test('session scope separates accounts, organizations and permissions without caching',async()=>{
 const a=await request({id:'a',organizationId:'org',permissions:['b','a']});
 assert.equal(a.headers.get('cache-control'),'private, no-store');
 const scope=(await a.json()).scope;
 assert.deepEqual(JSON.parse(scope),['a','org',['a','b']]);
 for(const user of [{id:'b',organizationId:'org',permissions:['a','b']},{id:'a',organizationId:'other',permissions:['a','b']},{id:'a',organizationId:'org',permissions:['a']}])assert.notEqual((await (await request(user)).json()).scope,scope);
});
test('expired session and unavailable identity never supply a valid cache scope',async()=>{
 assert.equal((await request(null)).status,401);
 const unavailable=await request(new Error('offline'));
 assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).scope,undefined);
});
