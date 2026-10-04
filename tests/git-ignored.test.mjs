/* @layer tooling-scripts @kind test */
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { afterEach, describe, expect, it } from 'vitest';
import { gitIgnoredGlobs } from '../config/git-ignored.mjs';
import { standardsEslint } from '../eslint/index.mjs';
import { standardsMarkdownlint } from '../markdownlint/index.mjs';
import { standardsStylelint } from '../stylelint/index.mjs';
import { gitTree, tempTree, removeTempTrees } from './temp-tree.mjs';

const HEADER = '/* @layer tooling-scripts @kind logic */\n';

afterEach(removeTempTrees);

describe('gitIgnoredGlobs', () => {
  it('lists what .gitignore ignores, a folder as one glob', () => {
    const root = gitTree({ '.gitignore': 'build/\n*.log\n', 'build/a.js': 'x', 'b.log': 'x', 'tool/x/a.mjs': 'x', 'src/a.mjs': 'x' });
    expect(gitIgnoredGlobs(root).sort()).toEqual(['b.log', 'build/**']);
  });

  it('counts the info/exclude and global excludes files', () => {
    const root = gitTree({ 'global-excludes': 'cache/\n', 'cache/a.mjs': 'x', 'local/a.mjs': 'x', 'src/a.mjs': 'x' });
    appendFileSync(join(root, '.git', 'info', 'exclude'), 'local/\n');
    expect(gitIgnoredGlobs(root).sort()).toEqual(['cache/**', 'local/**']);
  });

  it('lists nothing for a work tree that ignores nothing', () => {
    expect(gitIgnoredGlobs(gitTree({ 'src/a.mjs': 'x' }))).toEqual([]);
  });

  it('reads .gitignore when the folder is no git work tree', () => {
    const root = tempTree({ '.gitignore': '# local\nbuild/\n/top.txt\n*.log\n!keep.log\n' });
    expect(gitIgnoredGlobs(root)).toEqual(['**/build/**', 'top.txt', 'top.txt/**', '**/*.log', '**/*.log/**']);
  });
});

describe('every check skips what git ignores', () => {
  const files = { 'package.json': { name: 'x' }, '.gitignore': 'scratch/\n', 'scratch/a.mjs': 'x', 'scratch/a.md': 'x', 'src/a.mjs': 'x' };

  it('ESLint ignores the ignored folder and still lints the rest', async () => {
    const root = gitTree(files);
    const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: standardsEslint({ rootDir: root, typed: false }) });
    expect(await eslint.isPathIgnored(join(root, 'scratch/a.mjs'))).toBe(true);
    expect(await eslint.isPathIgnored(join(root, 'src/a.mjs'))).toBe(false);
    const [result] = await eslint.lintText(`${HEADER}const a = 1;\n\nexport { a };\n`, { filePath: join(root, 'src/a.mjs') });
    expect(result.messages).toEqual([]);
  });

  it('stylelint and markdownlint get the ignored folder', () => {
    const root = gitTree(files);
    expect(standardsStylelint({ rootDir: root }).ignoreFiles).toContain('scratch/**');
    expect(standardsMarkdownlint({ rootDir: root, discover: false }).ignores).toContain('scratch/**');
  });
});
