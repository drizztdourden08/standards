/* @layer tooling-scripts @kind logic */
import { TEST_TAGS } from './tags.constants.mjs';

const BASE_TEST = {
  pool: 'forks',
  maxWorkers: 3,
  tags: TEST_TAGS,
  strictTags: true,
  testTimeout: 5000,
  hookTimeout: 30000,
  teardownTimeout: 10000,
  bail: 3,
};

/**
 * @param {Record<string, any>} [overrides] a vitest config
 * @param {NodeJS.ProcessEnv} [env] loses the NODE_PATH of pnpm bin shims
 * @returns {Record<string, any>}
 */
const defineStandardsVitest = (overrides = {}, env = process.env) => {
  delete env.NODE_PATH;
  return { ...overrides, test: { ...BASE_TEST, ...overrides.test } };
};

export { defineStandardsVitest };
