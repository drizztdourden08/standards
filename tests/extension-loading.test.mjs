/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it } from 'vitest';
import { defineExtension, defineStandards, loadStandards } from '../index.mjs';
import { mergeOptions } from '../config/merge.mjs';
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

  it('resolves the usage-files extension by its package path', () => {
    const root = tempTree({ 'package.json': { name: 'app' } });
    const { extensions } = loadStandards({ rootDir: root, extensions: ['@drizztdourden08/standards/extensions/usage-files'] });
    expect(extensions[0].id).toBe('usage-files');
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

describe('mergeOptions', () => {
  it('joins arrays, merges objects and lets the later scalar win', () => {
    expect(mergeOptions({ a: ['x'], o: { k: 1 }, s: 1 }, { a: ['y', 'x'], o: { j: 2 }, s: 2 })).toEqual({ a: ['x', 'y'], o: { k: 1, j: 2 }, s: 2 });
  });

  it('replaces rawControls and consoleGlobs instead of joining them', () => {
    expect(mergeOptions({ rawControls: [1], consoleGlobs: ['a'] }, { rawControls: [2], consoleGlobs: ['b'] })).toEqual({ rawControls: [2], consoleGlobs: ['b'] });
  });
});
