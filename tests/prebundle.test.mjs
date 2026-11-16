/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { prebundleEntries } from '../vitest/prebundle-entries.mjs';
import { withPrebundledDeps } from '../vitest/with-prebundled-deps.mjs';
import { removeTempTrees, tempTree } from './temp-tree.mjs';

const pkgTree = () =>
  tempTree({
    'node_modules/pkg/package.json': {
      name: 'pkg',
      exports: {
        '.': './src/index.ts',
        './a': { import: './src/a.ts', default: './src/a.js' },
        './b/*': './src/b/*/index.ts',
        './s.css': './src/s.css',
        './tokens.json': './tokens.json',
      },
    },
    'node_modules/pkg/src/b/x/index.ts': '',
    'node_modules/pkg/src/b/y/other.ts': '',
  });

afterEach(removeTempTrees);

describe('prebundleEntries', { tags: ['standard'] }, () => {
  it('lists code entries, expands stars by existing targets and skips css and json', () => {
    const root = pkgTree();
    expect(prebundleEntries(join(root, 'node_modules/pkg'), 'pkg')).toEqual(['pkg', 'pkg/a', 'pkg/b/x']);
  });
});

describe('withPrebundledDeps', { tags: ['standard'] }, () => {
  it('keeps existing keys, sets the cache dir under appDir and appends the entries', () => {
    const root = pkgTree();
    const appDir = join(root, 'app');
    const config = withPrebundledDeps(
      { test: { include: ['a.test.ts'], deps: { inline: ['x'] } } },
      { root, appDir, packages: ['pkg'] },
    );
    expect(config.test.include).toEqual(['a.test.ts']);
    expect(config.test.deps.inline).toEqual(['x']);
    expect(config.cacheDir).toBe(join(appDir, 'node_modules', '.vite-standards'));
    const client = config.test.deps.optimizer.client;
    expect(client.enabled).toBe(true);
    expect(client.include).toEqual(['pkg', 'pkg/a', 'pkg/b/x']);
    expect(client.esbuildOptions.plugins).toHaveLength(1);
  });

  it('throws a clear error for a missing package', () => {
    const root = tempTree({ 'x.txt': '' });
    expect(() => withPrebundledDeps({}, { root, packages: ['nope'] })).toThrow(/nope/);
  });
});
