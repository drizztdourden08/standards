/* @layer tooling-scripts @kind test */
import { describe, expect, it } from 'vitest';
import { withHeapCeiling } from '../cli/heap-env.mjs';
import { batchesOf } from '../cli/lint-batches.mjs';

const names = (count) => Array.from({ length: count }, (_, index) => `src/file-${index}.ts`);

describe('batchesOf', { tags: ['critical'] }, () => {
  it('keeps up to 1000 files in one batch and splits the rest in order', () => {
    expect(batchesOf(names(1000), { maxChars: Infinity })).toHaveLength(1);
    const batches = batchesOf(names(2500), { maxChars: Infinity });
    expect(batches.map((batch) => batch.length)).toEqual([1000, 1000, 500]);
    expect(batches.flat()).toEqual(names(2500));
  });

  it('also splits when the command line would get too long', () => {
    const batches = batchesOf(names(10), { maxChars: 40 });
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.flat()).toEqual(names(10));
  });

  it('gives no batch for no files', () => {
    expect(batchesOf([])).toEqual([]);
  });
});

describe('withHeapCeiling', { tags: ['critical'] }, () => {
  it('adds 4096 MB to NODE_OPTIONS by default and keeps what is there', () => {
    expect(withHeapCeiling({}).NODE_OPTIONS).toBe('--max-old-space-size=4096');
    expect(withHeapCeiling({ NODE_OPTIONS: '--no-warnings' }).NODE_OPTIONS).toBe('--no-warnings --max-old-space-size=4096');
  });

  it('takes STANDARDS_LINT_HEAP_MB, and ignores a value that is not a positive integer', () => {
    expect(withHeapCeiling({ STANDARDS_LINT_HEAP_MB: '8192' }).NODE_OPTIONS).toBe('--max-old-space-size=8192');
    expect(withHeapCeiling({ STANDARDS_LINT_HEAP_MB: 'lots' }).NODE_OPTIONS).toBe('--max-old-space-size=4096');
  });
});
