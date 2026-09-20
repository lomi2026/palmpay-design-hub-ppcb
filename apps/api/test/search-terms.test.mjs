import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {searchTerms,containsPattern}=require('../dist/engagement/search-terms.js');
test('Chinese and spaced queries support word fragments',()=>{
 assert.ok(searchTerms('web端设计组件库').length>1);
 assert.deepEqual(searchTerms('WEB 组件 web'),['web','组件']);
 assert.deepEqual(searchTerms('  '),[]);
});
test('SQL contains patterns treat wildcards as literal text',()=>{
 assert.equal(containsPattern('100%_'),'%100\\%\\_%');
 assert.equal(containsPattern('abc'),' %abc%'.trim());
});
