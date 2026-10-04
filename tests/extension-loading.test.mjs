/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it } from 'vitest';
import { defineExtension, defineStandards, loadStandards } from '../index.mjs';
import { join } from 'node:path';
import { facetOptions, mergeOptions } from '../config/merge.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

const MODULE_EXTENSION = 'export default { id: "from-module", prose: { banned: ["frobnicate"] } };\n';

afterEach(removeTempTrees);

describe('defineExtension', () => {
  it('returns the extension it is given', () => {
    const extension = { id: 'x', prose: { allow: ['harness'] } };
    expect(defineExtension(extension)).toBe(extension);
  });

  it('refuses an extension without an id', () => {
    expect(() => defineExtension({ prose: {} })).toThrow(/needs a non-empty id/);
  });

  it('refuses an unknown facet', () => {
    expect(() => defineExtension({ id: 'x', lint: {} })).toThrow(/unknown key lint/);
  });

  it('takes a knip facet of compilers and entries', () => {
    const extension = { id: 'x', knip: { compilers: { ts: (text) => text }, entry: () => ['a.ts'] } };
    expect(defineExtension(extension)).toBe(extension);
    expect(defineExtension({ id: 'y', knip: { entry: ['a.ts'] } }).knip.entry).toEqual(['a.ts']);
  });

  it('refuses a knip facet of the wrong shape', () => {
    expect(() => defineExtension({ id: 'x', knip: [] })).toThrow(/knip must be an object/);
    expect(() => defineExtension({ id: 'x', knip: { ignore: [] } })).toThrow(/unknown knip key ignore/);
    expect(() => defineExtension({ id: 'x', knip: { compilers: { ts: true } } })).toThrow(/knip\.compilers\.ts must be a function/);
    expect(() => defineExtension({ id: 'x', knip: { entry: 'a.ts' } })).toThrow(/knip\.entry must be a string array or a function/);
  });

  it('refuses an unknown standards.config key', () => {
    expect(() => defineStandards({ preset: [] })).toThrow(/unknown key preset/);
  });
});

describe('loadStandards', () => {
  it('loads presets, then discovered, then config extensions, then the factory ones', () => {
    const root = tempTree({
      'package.json': { name: 'app', devDependencies: { found: '1.0.0' } },
      'node_modules/found/package.json': { name: 'found', standards: { extension: './ext.mjs' } },
      'node_modules/found/ext.mjs': 'export default { id: "found" };\n',
      'tooling/listed.mjs': MODULE_EXTENSION,
      'standards.config.mjs': 'export default { presets: ["design-system"], extensions: ["./tooling/listed.mjs"] };\n',
    });
    const { extensions } = loadStandards({ rootDir: root, presets: ['react-app'], extensions: [{ id: 'inline' }] });
    expect(extensions.map((extension) => extension.id)).toEqual(['preset:react-app', 'preset:design-system', 'found', 'from-module', 'inline']);
  });

  it('keeps the first extension of each id', () => {
    const root = tempTree({ 'package.json': { name: 'app' } });
    const { extensions } = loadStandards({ rootDir: root, extensions: [{ id: 'same', prose: { allow: ['a'] } }, { id: 'same', prose: { allow: ['b'] } }] });
    expect(extensions).toEqual([{ id: 'same', prose: { allow: ['a'] } }]);
  });

  it('resolves a preset by its package path', () => {
    const root = tempTree({ 'package.json': { name: 'app' } });
    const { extensions } = loadStandards({ rootDir: root, extensions: ['@drizztdourden08/standards/presets/library'] });
    expect(extensions[0].id).toBe('preset:library');
  });

  it('ships no usage-files extension and no primitives folder in the design-system preset', () => {
    const root = tempTree({ 'package.json': { name: 'app' } });
    expect(() => loadStandards({ rootDir: root, extensions: ['@drizztdourden08/standards/extensions/usage-files'] })).toThrow(/cannot load extension/);
    const [preset] = loadStandards({ rootDir: root, presets: ['design-system'], discover: false }).extensions;
    expect(preset.eslint.options).toBeUndefined();
  });

  it('reads options from standards.config.mjs', () => {
    const root = tempTree({ 'standards.config.mjs': 'export default { options: { tokens: ["./tokens.css"] } };\n' });
    expect(loadStandards({ rootDir: root }).options).toEqual({ tokens: ['./tokens.css'] });
  });

  it('names the extension that fails to load', () => {
    const root = tempTree({ 'package.json': { name: 'app' } });
    expect(() => loadStandards({ rootDir: root, extensions: ['./missing.mjs'] })).toThrow(/cannot load extension "\.\/missing\.mjs"/);
  });
});

describe('facetOptions', () => {
  it('calls an options function with the context and merges what it returns with plain options', () => {
    const seen = [];
    const extensions = [
      { id: 'plain', eslint: { options: { primitivesGlobs: ['a/**/*.tsx'] } } },
      { id: 'computed', eslint: { options: (ctx) => { seen.push(ctx); return { primitivesGlobs: [`${ctx.packageDir ?? '.'}/b/**/*.tsx`] }; } } },
    ];
    expect(facetOptions(extensions, 'eslint', { rootDir: '/repo', packageDir: 'pkg' })).toEqual({ primitivesGlobs: ['a/**/*.tsx', 'pkg/b/**/*.tsx'] });
    expect(seen).toEqual([{ rootDir: '/repo', packageDir: 'pkg' }]);
  });

  it('gives an options function a rootDir when the caller passes no context', () => {
    const extensions = [{ id: 'computed', stylelint: { options: (ctx) => ({ rootSeen: typeof ctx.rootDir }) } }];
    expect(facetOptions(extensions, 'stylelint')).toEqual({ rootSeen: 'string' });
  });
});

describe('the options context', () => {
  it('holds the root alone when the run starts there', () => {
    const root = tempTree({ 'package.json': { name: 'app' } });
    expect(loadStandards({ rootDir: root }).context).toEqual({ rootDir: root });
  });

  it('holds the package dir it is given', () => {
    const root = tempTree({ 'package.json': { name: 'app' }, 'packages/ui/package.json': { name: 'ui' } });
    expect(loadStandards({ rootDir: root, packageDir: join(root, 'packages/ui') }).context).toEqual({ rootDir: root, packageDir: join(root, 'packages/ui') });
  });

  it('finds the workspace package that holds the working folder', () => {
    const root = tempTree({ 'package.json': { name: 'app' }, 'packages/ui/package.json': { name: 'ui' }, 'packages/ui/src/a.ts': '' });
    const before = process.cwd();
    process.chdir(join(root, 'packages/ui/src'));
    try {
      expect(loadStandards({ rootDir: root }).context).toEqual({ rootDir: root, packageDir: join(root, 'packages/ui') });
    } finally {
      process.chdir(before);
    }
  });
});

describe('mergeOptions', () => {
  it('joins arrays, merges objects and lets the later scalar win', () => {
    expect(mergeOptions({ a: ['x'], o: { k: 1 }, s: 1 }, { a: ['y', 'x'], o: { j: 2 }, s: 2 })).toEqual({ a: ['x', 'y'], o: { k: 1, j: 2 }, s: 2 });
  });

  it('replaces rawControls and consoleGlobs instead of joining them', () => {
    expect(mergeOptions({ rawControls: [1], consoleGlobs: ['a'] }, { rawControls: [2], consoleGlobs: ['b'] })).toEqual({ rawControls: [2], consoleGlobs: ['b'] });
  });
});
