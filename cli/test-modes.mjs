/* @layer tooling-scripts @kind logic */
import { batchesOf } from './lint-batches.mjs';
import { TEST_BATCH_CHARS, TEST_MODES } from './run.constants.mjs';

const TAG_FILTERS = { changed: 'critical', pr: 'critical||standard', e2e: 'e2e' };

/**
 * @param {{ mode?: string, files: string[], passthrough?: string[] }} job
 * @returns {string[]} the vitest arguments
 */
const testArgs = ({ mode = 'changed', files, passthrough = [] }) => {
  if (!TEST_MODES.includes(mode)) throw new Error(`unknown test mode "${mode}" (${TEST_MODES.join(', ')})`);
  return ['related', ...files, '--run', '--tags-filter', TAG_FILTERS[mode], '--passWithNoTests', ...passthrough];
};

/**
 * @param {string[]} files
 * @param {number} [maxChars]
 * @returns {string[][]} batches short enough for one command line
 */
const testBatches = (files, maxChars = TEST_BATCH_CHARS) => batchesOf(files, { maxFiles: Infinity, maxChars });

export { testArgs, testBatches };
