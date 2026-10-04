/* @layer tooling-scripts @kind test */
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { knipConfigFor } from '../cli/knip.mjs';
import dropGitIgnoredHints from '../cli/knip-hints.mjs';
import { gitTree, tempTree, removeTempTrees } from './temp-tree.mjs';

afterEach(removeTempTrees);

describe('knipConfigFor', () => {
  it('adds every git-ignored path but node_modules, which knip skips itself, to the ignore list of knip.json', () => {
    const root = gitTree({ 'knip.json': { entry: ['a.mjs'], ignore: 'vendor/**' }, '.gitignore': '.*/\ngen/\nnode_modules/\n', 'gen/a.mjs': 'x', '.cache/b.mjs': 'x', 'node_modules/x/a.js': 'x' });
    expect(knipConfigFor(root)).toEqual({ entry: ['a.mjs'], ignore: ['vendor/**', '.cache/**', 'gen/**'] });
  });

  it('leaves a repo without a knip JSON config to knip', () => {
    expect(knipConfigFor(gitTree({ 'a.mjs': 'x' }))).toBeNull();
  });
});

describe('dropGitIgnoredHints', () => {
  it('drops the unused-ignore hints of git-ignored paths and names the repo config', () => {
    const root = tempTree({ 'cache/git-ignored.json': { source: 'knip.json', ignore: ['gen/**'] } });
    const hints = [{ type: 'ignore', identifier: 'gen/**' }, { type: 'ignore', identifier: 'vendor/**' }, { type: 'ignoreDependencies', identifier: 'react' }];
    const out = dropGitIgnoredHints({ cwd: root, configFilePath: join(root, 'cache', 'knip.json'), configurationHints: hints });
    expect(out.configurationHints).toEqual(hints.slice(1));
    expect(out.configFilePath).toBe(join(root, 'knip.json'));
  });
});
