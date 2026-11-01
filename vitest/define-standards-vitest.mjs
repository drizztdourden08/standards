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
 * @returns {Record<string, any>}
 */
const defineStandardsVitest = (overrides = {}) => ({
  ...overrides,
  test: { ...BASE_TEST, ...overrides.test },
});

export { defineStandardsVitest };
