import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { editorSections, readableValue, contentBody, missingEditorFields } from '../src/lib/content-editor-schema.ts';
test('every required publication field has exactly one editor and reader definition',()=>{
 const source=readFileSync(new URL('../../api/src/content/content-completeness.ts',import.meta.url),'utf8');
 for(const [type,sections] of Object.entries(editorSections)){
  const fields=sections.flatMap(s=>s.fields);assert.equal(new Set(fields.map(f=>f.name)).size,fields.length);
  const block=source.split(`  ${type}: [`)[1].split('\n  ],')[0];
  const required=[...block.matchAll(/\['([^']+)', '[^']+', '(?:text|list|value)'\]/g)].map(m=>m[1]).sort();
  assert.deepEqual(fields.filter(f=>f.required).map(f=>f.name).sort(),required,type);
 }
});
test('legacy description objects become readable content without source metadata',()=>{
 assert.equal(readableValue({description:'使用指引'}),'使用指引');
 const body=contentBody({assetDetail:{usageGuide:{description:'说明'},platforms:['Web']},currentVersion:{body:{source:{commit:'internal'},problem:'问题'}}});
 assert.equal(readableValue(body.usageGuide),'说明');assert.equal(body.problemStatement,'问题');
});
test('explicit draft blanks are preserved instead of replaced by published values',()=>{
 const body=contentBody({skillDetail:{promptTemplate:'old'},currentVersion:{body:{promptTemplate:''}}});
 assert.equal(body.promptTemplate,'');
});
test('publish validation requires common and type-specific fields but allows optional references',()=>{
 const data=new FormData();data.set('title','工具');data.set('summary','描述');
 for(const field of editorSections.AI_TOOL.flatMap(s=>s.fields))data.set(field.name,'value');
 assert.deepEqual(missingEditorFields('AI_TOOL',data),[]);data.delete('websiteUrl');
 assert.deepEqual(missingEditorFields('AI_TOOL',data),[{name:'websiteUrl',label:'官网链接'}]);
});

test('historical effort metadata does not masquerade as execution instructions',()=>{
 const body=contentBody({skillDetail:{executionSteps:{duration:'5 min',complexity:'low'}}});
 assert.equal(body.executionSteps,'');
 const real=contentBody({currentVersion:{body:{executionSteps:'Open the editor and check output'}}});
 assert.equal(real.executionSteps,'Open the editor and check output');
});
