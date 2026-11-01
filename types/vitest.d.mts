/* @layer tooling-scripts @kind types */
import type { ViteUserConfig } from 'vitest/config';

export interface StandardsTestTag {
  name: 'critical' | 'standard' | 'e2e';
  description: string;
  /** milliseconds */
  timeout: number;
  concurrent?: boolean;
}

/** the three test tags with their timeouts */
export const TEST_TAGS: StandardsTestTag[];

/** the names of the three test tags */
export const TAG_NAMES: StandardsTestTag['name'][];

/** the vitest config of the standard: forks, 3 workers, the tags, strict tags and timeouts; the test keys you pass replace those keys */
export function defineStandardsVitest(overrides?: ViteUserConfig): ViteUserConfig;
