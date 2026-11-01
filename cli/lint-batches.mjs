/* @layer tooling-scripts @kind logic */
import { MAX_BATCH_CHARS, MAX_BATCH_FILES } from './run.constants.mjs';

/**
 * @param {string[]} files
 * @param {{ maxFiles?: number, maxChars?: number }} [limits] a batch stops at either one
 * @returns {string[][]} the files in order, in batches that fit one command line
 */
const batchesOf = (files, { maxFiles = MAX_BATCH_FILES, maxChars = MAX_BATCH_CHARS } = {}) => {
  const batches = [];
  let current = [];
  let chars = 0;
  for (const file of files) {
    const size = file.length + 1;
    if (current.length && (current.length >= maxFiles || chars + size > maxChars)) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(file);
    chars += size;
  }
  if (current.length) batches.push(current);
  return batches;
};

export { batchesOf };
