/* @layer tooling-scripts @kind test */
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { afterEach, describe, expect, it } from 'vitest';
import { standardsEslint, LOCAL_RULES, RAW_CONTROLS } from '../eslint/index.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

const HEADER = '/* @layer tooling-scripts @kind logic */\n';

const lint = async (root, file, code, options = {}) => {
  const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: standardsEslint({ rootDir: root, typed: false, ...options }) });
  const [result] = await eslint.lintText(code, { filePath: join(root, file) });
  return result.messages.map((message) => `${message.ruleId}: ${message.message}`);
};

afterEach(removeTempTrees);

describe('rule ids', () => {
  it('keeps every local rule id', () => {
    expect(Object.keys(LOCAL_RULES)).toEqual(expect.arrayContaining(['no-raw-html', 'no-em-dash', 'no-slop-prose', 'no-comments', 'one-export-per-file', 'no-generic-folder-names', 'file-header']));
  });
});

describe('local/file-header', () => {
  it('reports a file without the header', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    expect(await lint(root, 'a.mjs', 'const a = 1;\n\nexport { a };\n')).toEqual([
      'local/file-header: Missing file header. The first line of the file is /* @layer <layer> @kind <kind> */, for example /* @layer tooling-scripts @kind logic */.',
    ]);
  });

  it('passes a file that opens with the header, after a shebang too', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    expect(await lint(root, 'a.mjs', `#!/usr/bin/env node\n${HEADER}const a = 1;\n\nexport { a };\n`)).toEqual([]);
  });

  it('reports a header that comes after code', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const messages = await lint(root, 'a.mjs', `const a = 1;\n${HEADER}\nexport { a };\n`);
    expect(messages.filter((m) => m.startsWith('local/file-header'))).toHaveLength(1);
  });
});

describe('extension options', () => {
  it('uses the raw-control messages an extension gives', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const rawControls = [{ selector: "JSXOpeningElement[name.name='input']", message: 'Use TextInput.' }];
    const messages = await lint(root, 'src/A.tsx', `${HEADER}const A = () => <input />;\n\nexport { A };\n`, { extensions: [{ id: 'kit', eslint: { options: { rawControls } } }] });
    expect(messages).toContain('no-restricted-syntax: Use TextInput.');
    expect(messages.some((m) => m.includes(RAW_CONTROLS[0].message))).toBe(false);
  });

  it('applies the banned words of a prose facet', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const messages = await lint(root, 'a.mjs', `${HEADER}const a = 'we frobnicate it';\n\nexport { a };\n`, { extensions: [{ id: 'words', prose: { banned: ['frobnicate'] } }] });
    expect(messages).toEqual(['local/no-slop-prose: "frobnicate": This repo bans the word. Use a plain word, or delete it.']);
  });

  it('adds the rules and configs of an eslint facet', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const extension = { id: 'strict', eslint: { rules: { 'no-warning-comments': 'off' }, configs: [{ files: ['**/*.mjs'], rules: { 'no-magic-numbers': 'error' } }] } };
    const messages = await lint(root, 'a.mjs', `${HEADER}const a = (n) => n * 7;\n\nexport { a };\n`, { extensions: [extension] });
    expect(messages).toEqual(['no-magic-numbers: No magic number: 7.']);
  });

  it('exempts the file kinds an extension declares from one export per file', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const code = `${HEADER}const a = 1;\nconst b = 2;\n\nexport { a, b };\n`;
    const options = { extensions: [{ id: 'kinds', eslint: { options: { fileKinds: { screen: '\\.page\\.ts$' }, oneExportExempt: ['screen'] } } }] };
    expect((await lint(root, 'src/home.page.ts', code, options)).filter((m) => m.startsWith('local/one-export'))).toEqual([]);
    expect((await lint(root, 'src/home.ts', code, options)).filter((m) => m.startsWith('local/one-export'))).toHaveLength(1);
  });

  it('computes the options of a facet from the repo root', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const roots = [];
    const extension = { id: 'parts', eslint: { options: ({ rootDir }) => { roots.push(rootDir); return { primitivesGlobs: ['ui/**/*.tsx'] }; } } };
    const code = `${HEADER}const A = () => <div />;\n\nexport { A };\n`;
    expect((await lint(root, 'ui/A.tsx', code, { extensions: [extension] })).filter((m) => m.startsWith('local/no-raw-html'))).toEqual([]);
    expect((await lint(root, 'src/A.tsx', code, { extensions: [extension] })).filter((m) => m.startsWith('local/no-raw-html'))).toHaveLength(1);
    expect(roots).toEqual([root, root]);
  });

  it('allows raw HTML nowhere with the design-system preset alone', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const code = `${HEADER}const A = () => <div />;\n\nexport { A };\n`;
    expect((await lint(root, 'src/primitives/A/A.tsx', code, { presets: ['design-system'] })).filter((m) => m.startsWith('local/no-raw-html'))).toHaveLength(1);
  });

  it('turns on the rules of hooks with the react-app preset', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const code = `${HEADER}import { useState } from 'react';\n\nconst f = (on: boolean) => { if (on) useState(0); };\n\nexport { f };\n`;
    const messages = await lint(root, 'src/f.ts', code, { presets: ['react-app'] });
    expect(messages.some((m) => m.startsWith('react-hooks/rules-of-hooks'))).toBe(true);
  });
});
