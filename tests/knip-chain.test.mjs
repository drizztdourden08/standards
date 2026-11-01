/* @layer tooling-scripts @kind test */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { preprocessorArgs } from '../cli/knip-chain.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

afterEach(removeTempTrees);

const step = (mark) => `export default async (data) => ({ ...data, marks: [...data.marks, '${mark}'] });\n`;

describe('knip preprocessor chain (K1 business logic)', { tags: ['critical'] }, () => {
  it('passes one preprocessor straight through and writes no chain module', () => {
    const root = tempTree({ 'a.mjs': step('a') });
    const dir = join(root, 'cache');
    expect(preprocessorArgs(dir, [join(root, 'a.mjs')])).toEqual(['--preprocessor', join(root, 'a.mjs')]);
    expect(preprocessorArgs(dir, [])).toEqual([]);
    expect(existsSync(dir)).toBe(false);
  });

  it('hands knip a single module that runs every preprocessor in order', async () => {
    const root = tempTree({ 'a.mjs': step('a'), 'b.mjs': step('b') });
    const args = preprocessorArgs(join(root, 'cache'), [join(root, 'a.mjs'), join(root, 'b.mjs')]);
    expect(args).toHaveLength(2);
    const { default: chain } = await import(pathToFileURL(args[1]).href);
    expect(await chain({ marks: [] })).toEqual({ marks: ['a', 'b'] });
  });
});
