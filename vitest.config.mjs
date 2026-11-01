/* @layer root-config @kind config */
import { defineStandardsVitest } from './vitest/index.mjs';

export default defineStandardsVitest({
  test: { include: ['tests/**/*.test.mjs'] },
});
