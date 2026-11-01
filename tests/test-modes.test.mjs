/* @layer tooling-scripts @kind test */
import { describe, expect, it } from 'vitest';
import { parseTestArgs } from '../cli/test-args.mjs';
import { testArgs } from '../cli/test-modes.mjs';

describe('standards test modes (K1 business logic)', { tags: ['critical'] }, () => {
  it('maps each mode to related tests and a tag filter', () => {
    const files = ['src/a.ts', 'src/b.ts'];
    expect(testArgs({ mode: 'changed', files })).toEqual(['related', 'src/a.ts', 'src/b.ts', '--run', '--tags-filter', 'critical', '--passWithNoTests']);
    expect(testArgs({ mode: 'pr', files }).slice(-3, -1)).toEqual(['--tags-filter', 'critical||standard']);
    expect(testArgs({ mode: 'e2e', files }).slice(-3, -1)).toEqual(['--tags-filter', 'e2e']);
  });

  it('defaults to changed, refuses an unknown mode and has no all mode', () => {
    expect(testArgs({ files: [] })).toContain('critical');
    expect(() => testArgs({ mode: 'all', files: [] })).toThrow('unknown test mode "all"');
  });

  it('reads the mode, --root and --base, and passes the rest to vitest', () => {
    expect(parseTestArgs([])).toEqual({ mode: 'changed', passthrough: [] });
    expect(parseTestArgs(['pr', '--base', 'v1.2.0', '--root', 'x', '-t', 'name'])).toEqual({ mode: 'pr', base: 'v1.2.0', root: 'x', passthrough: ['-t', 'name'] });
    expect(parseTestArgs(['--reporter', 'dot']).mode).toBe('changed');
  });
});
