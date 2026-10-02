/* @layer tooling-scripts @kind test */
import { join } from 'node:path';
import stylelint from 'stylelint';
import { afterEach, describe, expect, it } from 'vitest';
import { standardsStylelint } from '../stylelint/index.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

const HEADER = '/* @layer ui @kind style */\n';

const warningsOf = async (root, config) => {
  const result = await stylelint.lint({ files: [join(root, 'src/card.css')], config, configBasedir: root });
  return result.results.flatMap((entry) => entry.warnings.map((warning) => warning.rule));
};

afterEach(removeTempTrees);

describe('token sources', () => {
  const files = {
    'package.json': { name: 'x' },
    'kit/tokens.css': `${HEADER}:root { --space-sm: 4px; }\n`,
    'src/card.css': `${HEADER}.card { --space-sm: var(--space-xs); }\n`,
  };

  it('reads token names from the sheets given as tokens', async () => {
    const root = tempTree(files);
    const config = standardsStylelint({ rootDir: root, uiGlobs: ['src/**/*.css'], tokens: ['./kit/tokens.css'] });
    expect(await warningsOf(root, config)).toContain('brock/no-token-override');
  });

  it('knows no token without a source', async () => {
    const root = tempTree(files);
    const config = standardsStylelint({ rootDir: root, uiGlobs: ['src/**/*.css'] });
    expect(await warningsOf(root, config)).not.toContain('brock/no-token-override');
  });

  it('takes the token sources from an extension', async () => {
    const root = tempTree(files);
    const config = standardsStylelint({ rootDir: root, uiGlobs: ['src/**/*.css'], extensions: [{ id: 'kit', stylelint: { options: { tokens: ['./kit/tokens.css'] } } }] });
    expect(await warningsOf(root, config)).toContain('brock/no-token-override');
  });

  it('flags a raw length in a token-only sheet', async () => {
    const root = tempTree({ ...files, 'src/card.css': `${HEADER}.card { padding: 4px; }\n` });
    const config = standardsStylelint({ rootDir: root, uiGlobs: ['src/**/*.css'] });
    expect(await warningsOf(root, config)).toContain('unit-disallowed-list');
  });
});
