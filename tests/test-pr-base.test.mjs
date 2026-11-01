/* @layer tooling-scripts @kind test */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { changedFiles } from '../cli/changed-files.mjs';
import { testBatches } from '../cli/test-modes.mjs';
import { gitTree, removeTempTrees } from './temp-tree.mjs';

const run = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' }).trim();

const commitFile = (root, file) => {
  writeFileSync(join(root, file), `${file}\n`);
  run(root, 'add', '-A');
  run(root, 'commit', '-q', '-m', file);
};

const localFirstRepo = () => {
  const root = gitTree({ 'a.txt': 'a\n' });
  run(root, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  run(root, 'add', '-A');
  run(root, 'commit', '-q', '-m', 'first');
  run(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  run(root, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main');
  commitFile(root, 'ahead-1.txt');
  commitFile(root, 'ahead-2.txt');
  run(root, 'checkout', '-q', '-b', 'feature');
  commitFile(root, 'mine.txt');
  return root;
};

describe('K5 standards test pr base in local-first mode', { tags: ['critical'] }, () => {
  afterAll(removeTempTrees);

  it('uses the local main when origin/main is behind it', () => {
    const found = changedFiles(localFirstRepo(), {});
    expect(found.ref).toBe('main');
    expect(found.files).toEqual(['mine.txt']);
  });

  it('keeps STANDARDS_BASE above everything', () => {
    const found = changedFiles(localFirstRepo(), { STANDARDS_BASE: 'origin/main' });
    expect(found.ref).toBe('origin/main');
    expect(found.files).toEqual(['ahead-1.txt', 'ahead-2.txt', 'mine.txt']);
  });

  it('falls back to origin/main when the local main has diverged from it', () => {
    const root = localFirstRepo();
    run(root, 'checkout', '-q', 'main');
    run(root, 'reset', '-q', '--hard', 'HEAD~2');
    commitFile(root, 'diverged.txt');
    run(root, 'checkout', '-q', 'feature');
    expect(changedFiles(root, {}).ref).toBe('origin/main');
  });
});

describe('K5 standards test batches stay under the Windows command line limit', { tags: ['critical'] }, () => {
  const names = Array.from({ length: 600 }, (_, index) => `packages/some/deep/folder/file-${index}.test.ts`);

  it('keeps one batch for a short list and splits a long one in order', () => {
    expect(testBatches(names.slice(0, 10))).toEqual([names.slice(0, 10)]);
    const batches = testBatches(names);
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.flat()).toEqual(names);
    for (const batch of batches) expect(batch.join(' ').length).toBeLessThanOrEqual(24000);
  });

  it('gives no batch for no files and honours another budget', () => {
    expect(testBatches([])).toEqual([]);
    expect(testBatches(names.slice(0, 10), 100).length).toBeGreaterThan(1);
  });
});
