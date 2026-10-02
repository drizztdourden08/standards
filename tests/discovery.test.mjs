/* @layer tooling-scripts @kind test */
import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadStandards } from '../config/load.mjs';
import { discoverExtensions } from '../config/discover.mjs';
import { runStructure } from '../structure/index.mjs';
import { runProse } from '../prose/index.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

const FIXTURE_MODULE = {
  'node_modules/@acme/module-widgets/package.json': {
    name: '@acme/module-widgets',
    version: '1.0.0',
    standards: { extension: './standards.extension.mjs' },
  },
  'node_modules/@acme/module-widgets/standards.extension.mjs': `export default {
  id: 'module-widgets',
  structure: {
    moduleFiles: [{ pattern: /^[a-z][a-z0-9-]*\\.widget\\.ts$/, label: '<id>.widget.ts' }],
    checks: [(ctx) => ({ findings: ctx.kind === 'package' ? [ctx.label + ': widgets checked'] : [], notes: ['module-widgets ran'] })],
  },
  prose: { banned: ['frobnicate'] },
};
`,
};

const PACKAGE = {
  'packages/core/package.json': { name: '@acme/core', exports: { '.': './src/index.ts' } },
  'packages/core/src/index.ts': '',
  'packages/core/src/clock/tick.widget.ts': '',
  'packages/core/src/clock/index.ts': '',
};

const captured = () => {
  const lines = [];
  vi.spyOn(console, 'log').mockImplementation((line) => lines.push(line));
  vi.spyOn(console, 'error').mockImplementation((line) => lines.push(line));
  return lines;
};

afterEach(() => {
  vi.restoreAllMocks();
  removeTempTrees();
});

describe('installing a module is enough', () => {
  it('loads the extension of a root dependency without any config', async () => {
    const root = tempTree({ 'package.json': { name: '@acme/repo', devDependencies: { '@acme/module-widgets': '1.0.0' } }, ...FIXTURE_MODULE, ...PACKAGE });
    const lines = captured();
    expect(await runStructure({ rootDir: root })).toBe(1);
    expect(lines).toEqual([
      'standards structure: module-widgets ran',
      'standards structure: 1 finding(s) under @acme:',
      '  packages/core: widgets checked',
    ]);
  });

  it('loads the extension of a workspace package dependency', () => {
    const root = tempTree({
      'package.json': { name: '@acme/repo' },
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      'packages/core/package.json': { name: '@acme/core', dependencies: { '@acme/module-widgets': '1.0.0' } },
      ...FIXTURE_MODULE,
    });
    expect(discoverExtensions(root).map((file) => file.replace(/\\/g, '/'))).toEqual([expect.stringMatching(/node_modules\/@acme\/module-widgets\/standards\.extension\.mjs$/)]);
  });

  it('accepts the module file pattern the extension adds', async () => {
    const root = tempTree({ 'package.json': { name: '@acme/repo' }, ...PACKAGE });
    const lines = captured();
    expect(await runStructure({ rootDir: root })).toBe(1);
    expect(lines).toContain('  packages/core/src/clock/tick.widget.ts: a module file is kebab-case.ts, <subject>.type.ts, <subject>.constants.ts or index.ts');
  });

  it('feeds the banned words of the module to the prose gate', () => {
    const root = tempTree({ 'package.json': { name: '@acme/repo', description: 'We frobnicate.', dependencies: { '@acme/module-widgets': '1.0.0' } }, ...FIXTURE_MODULE });
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(1);
    expect(lines.some((line) => line.startsWith('package.json:') && line.includes('"frobnicate"'))).toBe(true);
  });

  it('follows a linked dependency, as pnpm link: and workspace packages install it', () => {
    const linked = tempTree({
      'package.json': { name: '@acme/linked', standards: { extension: './standards.extension.mjs' } },
      'standards.extension.mjs': 'const extension = { id: "linked", eslint: { options: ({ rootDir }) => ({ seenRoot: [rootDir] }) } };\nexport { extension };\n',
    });
    const root = tempTree({ 'package.json': { name: '@acme/repo', devDependencies: { '@acme/linked': 'link:../linked' } } });
    mkdirSync(join(root, 'node_modules/@acme'), { recursive: true });
    symlinkSync(linked, join(root, 'node_modules/@acme/linked'), 'junction');
    const { extensions, context } = loadStandards({ rootDir: root });
    const found = extensions.find((extension) => extension.id === 'linked');
    expect(found.eslint.options(context)).toEqual({ seenRoot: [root] });
  });

  it('skips discovery when the config turns it off', async () => {
    const root = tempTree({
      'package.json': { name: '@acme/repo', devDependencies: { '@acme/module-widgets': '1.0.0' } },
      'standards.config.mjs': 'export default { discover: false };\n',
      ...FIXTURE_MODULE,
      ...PACKAGE,
    });
    const lines = captured();
    await runStructure({ rootDir: root });
    expect(lines).not.toContain('standards structure: module-widgets ran');
  });
});
