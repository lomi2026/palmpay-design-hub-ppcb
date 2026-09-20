import test from 'node:test';
import assert from 'node:assert/strict';
import { userError } from '../src/lib/user-error.ts';
test('validation errors identify fields in Chinese',()=>{
 assert.equal(userError('teamId must be a UUID'),'请重新选择有效的归属团队。');
 assert.equal(userError('title should not be empty'),'请填写标题。');
 assert.equal(userError('email must be an email'),'请输入有效的邮箱地址。');
 assert.match(userError('title must be shorter than or equal to 200 characters'),/200/);
 assert.doesNotMatch(userError('teamId must be a UUID；title should not be empty'),/UUID|must|should/);
});
test('network, permissions, uploads and unknown errors do not leak English',()=>{
 for(const error of ['fetch failed','Failed to fetch','The operation was aborted','You cannot edit this content.','Unsupported file type.','Unexpected backend stack trace'])assert.match(userError(new Error(error)),/[\u4e00-\u9fff]/);
 assert.equal(userError('Unauthorized',undefined,401),'登录状态已失效，请重新登录。');
 assert.equal(userError('Internal Server Error',undefined,500),'服务暂时不可用，请稍后重试。');
 assert.equal(userError('请重新选择分类。'),'请重新选择分类。');
});
