import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

test('confirmed feedback dispatches distinct results for repeated operations', () => {
  const events = [];
  const target = { exports: {} };
  const source = readFileSync(new URL('../src/components/workspace/action-feedback.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { module: target, exports: target.exports, require: () => ({}), window: { dispatchEvent: event => events.push(event) }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } } });
  target.exports.showActionFeedback('success', '保存成功');
  target.exports.showActionFeedback('success', '保存成功');
  target.exports.showActionFeedback('error', '连接中断，结果暂未确认');
  assert.equal(events.length, 3);
  assert.notEqual(events[0].detail.id, events[1].detail.id);
  assert.equal(events[2].detail.status, 'error');
  assert.equal(events[2].detail.message, '连接中断，结果暂未确认');
});
