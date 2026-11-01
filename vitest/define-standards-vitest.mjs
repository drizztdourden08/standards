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
 * The vitest config every project shares: forks, three workers at most, the three tags with their timeouts,
 * strict tags, hook and teardown timeouts, bail after three failures. `overrides` merges over it, one level deep under `test`.
 * @param {Record<string, any>} [overrides] a vitest config
 * @returns {Record<string, any>} a vitest config, ready to be the default export of vitest.config.mjs
 */
const defineStandardsVitest = (overrides = {}) => ({
  ...overrides,
  test: { ...BASE_TEST, ...overrides.test },
});

export { defineStandardsVitest };
