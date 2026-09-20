import assert from 'node:assert/strict';
import test from 'node:test';
import { DraftsService } from '../dist/content/drafts.service.js';
const user={id:'owner',organizationId:'org',permissions:['content.edit_own']};
function fixture({owner='owner',ready=true,locked=1,existing=false}={}) {
 const calls=[];
 const tx={contentVersion:{updateMany:async()=>({count:locked})},fileAttachment:{findFirst:async()=>ready?{uploadedById:owner}:null},attachmentRelation:{findFirst:async()=>existing?{id:'relation'}:null,create:async args=>calls.push(['create',args]),deleteMany:async args=>calls.push(['delete',args])}};
 const prisma={content:{findFirst:async()=>({id:'content',ownerId:'owner',status:'DRAFT',draftVersion:{id:'version',versionStatus:'DRAFT'}})},$transaction:async fn=>fn(tx)};
 return {service:new DraftsService(prisma,{},{}),calls};
}
test('attachment addition preserves other files and repeat binding is idempotent',async()=>{
 const a=fixture();await a.service.changeAttachment(user,'content','new-file',true);assert.equal(a.calls.length,1);assert.equal(a.calls[0][0],'create');assert.equal(a.calls[0][1].data.fileId,'new-file');
 const b=fixture({existing:true});await b.service.changeAttachment(user,'content','new-file',true);assert.equal(b.calls.length,0);
});
test('attachment removal only deletes the named file in the editable draft version',async()=>{
 const a=fixture();await a.service.changeAttachment(user,'content','remove-file',false);assert.deepEqual(a.calls[0][1].where,{entityType:'VERSION',entityId:'version',usageType:'ATTACHMENT',fileId:'remove-file'});
});
test('unauthorized, unready, or no-longer-draft attachment writes are rejected',async()=>{
 for(const options of [{owner:'other'},{ready:false},{locked:0}]){const a=fixture(options);await assert.rejects(a.service.changeAttachment(user,'content','file',true));assert.equal(a.calls.length,0);}
 const a=fixture();await assert.rejects(a.service.changeAttachment({...user,id:'outsider'},'content','file',false));assert.equal(a.calls.length,0);
});
