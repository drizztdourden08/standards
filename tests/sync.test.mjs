/* @layer tooling-scripts @kind test */
import { mkdirSync, readFileSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSync, sharedFileFindings, standardsCopies } from '../sync/index.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

const NPMRC = readFileSync(join(import.meta.dirname, '..', 'templates', 'npmrc'), 'utf8');
const GITIGNORE = readFileSync(join(import.meta.dirname, '..', 'templates', 'gitignore'), 'utf8');
const JSCPD = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'jscpd', 'base.json'), 'utf8'));
const STANDARDS_PKG = { name: '@drizztdourden08/standards', version: '1.0.0' };
const STORE_A = 'node_modules/.pnpm/@drizztdourden08+standards@1.0.0/node_modules/@drizztdourden08/standards';
const STORE_B = 'node_modules/.pnpm/@drizztdourden08+standards@1.0.1/node_modules/@drizztdourden08/standards';

const link = (root, from, to) => {
  mkdirSync(dirname(join(root, from)), { recursive: true });
  symlinkSync(join(root, to), join(root, from), 'junction');
};

afterEach(() => {
  vi.restoreAllMocks();
  removeTempTrees();
});

describe('shared files', () => {
  it('names a .gitignore that leaves the dot-folder convention', () => {
    const lines = ['node_modules/', '.vite/', '/.cache/', '**/.out/', 'app/.state/**', '!.github/', '.vscode/*', '.env-local'];
    const root = tempTree({ '.npmrc': NPMRC, '.gitignore': `${lines.join('\n')}\n` });
    expect(sharedFileFindings(root)).toEqual([
      '.gitignore: missing the line ".*/", which ignores every dot-folder',
      '.gitignore: ".vite/" names one dot-folder that ".*/" already ignores; delete the line',
      '.gitignore: "/.cache/" names one dot-folder that ".*/" already ignores; delete the line',
      '.gitignore: "**/.out/" names one dot-folder that ".*/" already ignores; delete the line',
      '.gitignore: "app/.state/**" names one dot-folder that ".*/" already ignores; delete the line',
    ]);
  });

  it('names a missing .gitignore and writes the template without --check', () => {
    const root = tempTree({ '.npmrc': NPMRC });
    expect(sharedFileFindings(root)).toContain('.gitignore: missing; copy templates/gitignore from @drizztdourden08/standards');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    runSync({ rootDir: root });
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe(GITIGNORE);
  });

  it('passes files that match the templates', () => {
    const root = tempTree({ '.npmrc': NPMRC, '.gitignore': GITIGNORE, '.jscpd.json': JSCPD, 'knip.json': { $schema: 'https://unpkg.com/knip@5/schema.json', entry: ['x.ts'] } });
    expect(sharedFileFindings(root)).toEqual([]);
  });

  it('names each drift', () => {
    const root = tempTree({
      '.npmrc': 'auto-install-peers=true\n',
      '.jscpd.json': { ...JSCPD, minTokens: 30, ignore: ['**/node_modules/**'] },
      '.changeset/config.json': { access: 'public', baseBranch: 'main', commit: false, changelog: '@changesets/cli/changelog', updateInternalDependencies: 'patch', fixed: [['a', 'b']] },
    });
    const findings = sharedFileFindings(root);
    expect(findings).toContain('.npmrc: missing the line "@drizztdourden08:registry=https://npm.pkg.github.com"');
    expect(findings).toContain('.jscpd.json: "minTokens" is 30, the base has 50');
    expect(findings).toContain('.jscpd.json: "ignore" lacks **/fonts/**');
    expect(findings).toContain('.changeset/config.json: "access" is "public", the base has "restricted"');
    expect(findings.some((finding) => finding.includes('"fixed"'))).toBe(false);
  });

  it('writes the missing lines without --check', () => {
    const root = tempTree({ '.npmrc': 'auto-install-peers=true' });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(runSync({ rootDir: root })).toBe(0);
    expect(sharedFileFindings(root)).toEqual([]);
  });
});

describe('copies of standards', () => {
  it('finds one copy in a plain install', () => {
    const root = tempTree({ 'node_modules/@drizztdourden08/standards/package.json': STANDARDS_PKG });
    expect(standardsCopies(root)).toHaveLength(1);
  });

  it('fails --check when two copies resolve', () => {
    const root = tempTree({
      '.npmrc': NPMRC,
      '.gitignore': GITIGNORE,
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      [`${STORE_A}/package.json`]: STANDARDS_PKG,
      [`${STORE_B}/package.json`]: STANDARDS_PKG,
      'packages/a/package.json': { name: 'a' },
    });
    link(root, 'node_modules/@drizztdourden08/standards', STORE_A);
    link(root, 'packages/a/node_modules/@drizztdourden08/standards', STORE_B);
    const errors = [];
    vi.spyOn(console, 'error').mockImplementation((line) => errors.push(line));
    expect(runSync({ rootDir: root, check: true })).toBe(1);
    expect(errors[0]).toMatch(/^standards sync: 2 copies of @drizztdourden08\/standards resolve in this install/);
  });

  it('does not count a folder pnpm left in .pnpm after an upgrade', () => {
    const root = tempTree({ [`${STORE_A}/package.json`]: STANDARDS_PKG, [`${STORE_B}/package.json`]: STANDARDS_PKG });
    link(root, 'node_modules/@drizztdourden08/standards', STORE_B);
    expect(standardsCopies(root)).toHaveLength(1);
  });
});
