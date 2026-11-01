/* @layer tooling-scripts @kind test */
import { describe, expect, it } from 'vitest';
import { defineStandardsVitest } from '../vitest/define-standards-vitest.mjs';

describe('defineStandardsVitest', { tags: ['standard'] }, () => {
  it('drops NODE_PATH so the forks resolve packages from the test folder only, and keeps the overrides', () => {
    const env = { NODE_PATH: '/repo/node_modules/.pnpm/node_modules', PATH: '/bin' };
    const config = defineStandardsVitest({ test: { include: ['a.test.mjs'] } }, env);
    expect(env).toEqual({ PATH: '/bin' });
    expect(config.test).toMatchObject({ include: ['a.test.mjs'], pool: 'forks', strictTags: true });
  });
});
