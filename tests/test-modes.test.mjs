/* @layer tooling-scripts @kind test */
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { givenFiles, parseTestArgs } from '../cli/test-args.mjs';
import { testArgs } from '../cli/test-modes.mjs';
import { removeTempTrees, tempTree } from './temp-tree.mjs';

describe('standards test modes (K1 business logic)', { tags: ['critical'] }, () => {
  afterAll(removeTempTrees);

  it('maps each mode to a run of the test files and a tag filter', () => {
    const files = ['src/a.test.ts', 'src/b.test.ts'];
    expect(testArgs({ mode: 'changed', files })).toEqual(['run', 'src/a.test.ts', 'src/b.test.ts', '--tags-filter', 'critical', '--passWithNoTests']);
    expect(testArgs({ mode: 'pr', files }).slice(-3, -1)).toEqual(['--tags-filter', 'critical||standard']);
    expect(testArgs({ mode: 'e2e', files }).slice(-3, -1)).toEqual(['--tags-filter', 'e2e']);
  });

  it('defaults to changed, refuses an unknown mode and has no all mode', () => {
    expect(testArgs({ files: [] })).toContain('critical');
    expect(() => testArgs({ mode: 'all', files: [] })).toThrow('unknown test mode "all"');
  });

  it('reads the mode, --root and --base, and passes the rest to vitest', () => {
    expect(parseTestArgs([])).toEqual({ mode: 'changed', files: [], passthrough: [] });
    expect(parseTestArgs(['pr', '--base', 'v1.2.0', '--root', 'x', '-t', 'name'])).toEqual({ mode: 'pr', base: 'v1.2.0', root: 'x', files: [], passthrough: ['-t', 'name'] });
    expect(parseTestArgs(['--reporter', 'dot']).mode).toBe('changed');
  });

  it('reads files before the vitest options and keeps option values out of them', () => {
    expect(parseTestArgs(['pr', 'src/a.ts', 'src/b.test.ts', '--reporter', 'dot', '-t', 'name'])).toEqual({
      mode: 'pr',
      files: ['src/a.ts', 'src/b.test.ts'],
      passthrough: ['--reporter', 'dot', '-t', 'name'],
    });
    expect(parseTestArgs(['--reporter=dot', 'src/a.ts']).files).toEqual(['src/a.ts']);
  });

  it('reads --help and -h in any position', () => {
    expect(parseTestArgs(['--help']).help).toBe(true);
    expect(parseTestArgs(['pr', '-h']).help).toBe(true);
    expect(parseTestArgs(['pr']).help).toBeUndefined();
  });

  it('resolves given files against the cwd and reports the missing ones', () => {
    const root = tempTree({ 'src/a.ts': 'a\n', 'src/b.ts': 'b\n' });
    expect(givenFiles({ files: ['a.ts', '../src/b.ts'], cwd: join(root, 'src'), rootDir: root })).toEqual({ files: ['src/a.ts', 'src/b.ts'] });
    expect(givenFiles({ files: ['a.ts', 'nope.ts'], cwd: join(root, 'src'), rootDir: root })).toEqual({ missing: ['nope.ts'] });
  });
});
