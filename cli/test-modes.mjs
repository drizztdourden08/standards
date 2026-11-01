/* @layer tooling-scripts @kind logic */
import { TEST_MODES } from './run.constants.mjs';

const TAG_FILTERS = { changed: 'critical', pr: 'critical||standard', e2e: 'e2e' };

/**
 * Every mode runs only the tests related to the files touched against the base.
 * @param {{ mode?: string, files: string[], passthrough?: string[] }} job
 * @returns {string[]} the vitest arguments
 */
const testArgs = ({ mode = 'changed', files, passthrough = [] }) => {
  if (!TEST_MODES.includes(mode)) throw new Error(`unknown test mode "${mode}" (${TEST_MODES.join(', ')})`);
  return ['related', ...files, '--run', '--tags-filter', TAG_FILTERS[mode], '--passWithNoTests', ...passthrough];
};

export { testArgs, TAG_FILTERS };
