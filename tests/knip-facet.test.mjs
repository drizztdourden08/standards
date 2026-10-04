/* @layer tooling-scripts @kind test */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { writeConfig } from '../cli/knip.mjs';
import { withKnipFacets } from '../config/knip-facet.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

afterEach(removeTempTrees);

const EXAMPLE = /^\/\/ @example import (\{[^}]*\}) from ('[^']*');$/gm;
const exampleReexports = (text) => text.replace(EXAMPLE, 'export $1 from $2;');
const USAGE = "// @example import { unusedElsewhere } from './lib.ts';\nexport const note = 1;\n";

const EXTENSION_MODULE = [
  "const exampleReexports = (text) => text.replace(/^\\/\\/ @example import (\\{[^}]*\\}) from ('[^']*');$/gm, 'export $1 from $2;');",
  "export default { id: 'examples', knip: { compilers: { ts: exampleReexports }, entry: ({ rootDir }) => [rootDir ? 'usage.ts' : 'no-root.ts'] } };",
  '',
].join('\n');

const loaded = (extensions, rootDir = '/repo') => ({ rootDir, context: { rootDir }, extensions });

describe('withKnipFacets', () => {
  it('leaves the config as it is when no extension has a knip facet', () => {
    const config = { entry: ['a.ts'], ignore: [] };
    expect(withKnipFacets(config, loaded([{ id: 'x', prose: {} }]))).toBe(config);
  });

  it('adds a compiler that turns example imports into re-exports, so the export they name counts as used', () => {
    const config = withKnipFacets({ entry: ['index.ts'] }, loaded([{ id: 'examples', knip: { compilers: { ts: exampleReexports } } }]));
    expect(config.compilers.ts(USAGE, '/repo/usage.ts')).toBe("export { unusedElsewhere } from './lib.ts';\nexport const note = 1;\n");
  });

  it('runs the compilers of one extension key in load order, whatever the leading dot, and keeps the repo ones', () => {
    const seen = [];
    const extensions = [
      { id: 'first', knip: { compilers: { ts: (text, path) => { seen.push(path); return `${text}a`; } } } },
      { id: 'second', knip: { compilers: { '.ts': (text) => `${text}b` } } },
    ];
    const config = withKnipFacets({ compilers: { '.mdx': true } }, loaded(extensions));
    expect(Object.keys(config.compilers)).toEqual(['mdx', 'ts']);
    expect(config.compilers.ts('x', 'f.ts')).toBe('xab');
    expect(seen).toEqual(['f.ts']);
  });

  it('joins plain entries and the entries of a function called with the run context', () => {
    const seen = [];
    const extensions = [{ id: 'plain', knip: { entry: ['a.ts', 'b.ts'] } }, { id: 'computed', knip: { entry: (ctx) => { seen.push(ctx); return ['b.ts', 'c.ts']; } } }];
    expect(withKnipFacets({ entry: 'own.ts' }, loaded(extensions)).entry).toEqual(['own.ts', 'a.ts', 'b.ts', 'c.ts']);
    expect(seen).toEqual([{ rootDir: '/repo' }]);
  });

  it('gives each workspace with its own entry list the entries computed for its folder', () => {
    const extension = { id: 'computed', knip: { entry: ({ packageDir }) => [packageDir ? `${packageDir.endsWith('ui') ? 'ui' : 'other'}.usage.ts` : 'root.usage.ts'] } };
    const root = join('/', 'repo');
    const config = withKnipFacets({ entry: ['brock.workspace.mjs'], workspaces: { 'packages/ui': { entry: ['src/index.ts'] }, 'packages/cli': { project: ['**/*.mjs'] } } }, loaded([extension], root));
    expect(config.entry).toEqual(['brock.workspace.mjs', 'root.usage.ts']);
    expect(config.workspaces['packages/ui'].entry).toEqual(['src/index.ts', 'ui.usage.ts']);
    expect(config.workspaces['packages/cli']).toEqual({ project: ['**/*.mjs'] });
  });
});

describe('the written knip config module', () => {
  it('loads the extensions of the repo and merges their compilers and entries, in place of the old knip.json', async () => {
    const root = tempTree({
      'package.json': { name: 'app', private: true },
      'standards.config.mjs': "export default { extensions: ['./examples.mjs'] };\n",
      'examples.mjs': EXTENSION_MODULE,
      'node_modules/.cache/standards/knip.json': '{}',
    });
    const file = writeConfig(root, { entry: ['index.ts'], ignore: ['gen/**'] });
    expect(file).toBe(join(root, 'node_modules', '.cache', 'standards', 'knip.config.mjs'));
    expect(existsSync(join(root, 'node_modules', '.cache', 'standards', 'knip.json'))).toBe(false);
    const config = (await import(pathToFileURL(file).href)).default;
    expect(config.entry).toEqual(['index.ts', 'usage.ts']);
    expect(config.ignore).toEqual(['gen/**']);
    expect(config.compilers.ts(USAGE, join(root, 'usage.ts'))).toMatch(/^export \{ unusedElsewhere \} from '\.\/lib\.ts';$/m);
  });
});
