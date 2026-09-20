import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('dark theme uses the approved low-glare semantic palette', () => {
  const css = read('../src/app/globals.css');

  for (const declaration of [
    '--background: #181818',
    '--sidebar: #141414',
    '--card: #262626',
    '--secondary: #363636',
    '--muted: #404040',
    '--foreground: #e5e5e5',
    '--text-description: #b8b8b8',
    '--muted-foreground: #b0b0b0',
  ]) {
    assert.match(css, new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('large governance callouts no longer flash pure white in dark mode', () => {
  const calloutFiles = [
    '../src/app/workspace/overview/page.tsx',
    '../src/app/workspace/ai-projects/[slug]/page.tsx',
  ];

  for (const file of calloutFiles) {
    const source = read(file);
    assert.doesNotMatch(source, /bg-white p-6 text-black/);
    assert.doesNotMatch(source, /border-white bg-white py-0 text-\[#090909\]/);
    assert.match(source, /bg-(?:card|\[var\(--v9-panel(?:-2)?\)\])/);
  }
});
