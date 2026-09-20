import assert from 'node:assert/strict';
import test from 'node:test';
import {DraftsService} from '../dist/content/drafts.service.js';
function setup(status='PUBLISHED'){
 const record={id:'content',organizationId:'org',status,draftVersion:{id:'draft',versionStatus:'DRAFT'},draftVersionId:'draft',currentVersionId:'published'};
 const events=[];const prisma={content:{findFirst:async()=>record,update:async({data})=>Object.assign(record,data)}};
 return {record,events,service:new DraftsService(prisma,{write:async event=>events.push(event)},{})};
}
for(const status of ['PUBLISHED','UNPUBLISHED'])test(`archive ${status} with unpublished draft preserves versions`,async()=>{const {service,record,events}=setup(status);const result=await service.archive({id:'owner',organizationId:'org'},'content');assert.equal(result.status,'ARCHIVED');assert(record.archivedAt instanceof Date);assert.equal(record.draftVersionId,'draft');assert.equal(record.currentVersionId,'published');assert.equal(events[0].action,'content.archive');});
test('draft-only content cannot be archived',async()=>{const {service,record}=setup('DRAFT');await assert.rejects(service.archive({id:'owner',organizationId:'org'},'content'),/Only published or unpublished/);assert.equal(record.status,'DRAFT');});
test('unpublish retains existing active draft guard',async()=>{const {service}=setup();await assert.rejects(service.unpublish({id:'owner',organizationId:'org'},'content'),/active draft/);});
