import assert from 'node:assert/strict';
import test from 'node:test';
import { ContentService } from '../dist/content/content.service.js';
test('detail starts attachments and view recording together only after access succeeds', async () => {
  const calls=[];let release;
  const recorded=new Promise(resolve=>{release=resolve;});
  const service=new ContentService({content:{findFirst:async()=>({id:'c',currentVersionId:'v',coverFile:null})},attachmentRelation:{findMany:async()=>{calls.push('attachments');return [];}}},{recordContentView:async()=>{calls.push('view');await recorded;}});
  const result=service.getBySlug('slug',{id:'u',organizationId:'org',permissions:[],roles:[]});
  await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(calls,['attachments','view']);release();assert.equal((await result).id,'c');
  const denied=new ContentService({content:{findFirst:async()=>null},attachmentRelation:{findMany:async()=>{throw Error('must not read');}}},{recordContentView:async()=>{throw Error('must not write');}});
  await assert.rejects(denied.getBySlug('hidden',{id:'u',organizationId:'org',permissions:[],roles:[]}));
});
