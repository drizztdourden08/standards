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

/** the import specifiers of every code entry a package exports, sorted, for the optimizer include list */
export function prebundleEntries(pkgDir: string, name: string): string[];

/** turns on the vitest optimizer for source-shipping packages; a listed package is one shared prebundled copy, so vi.mock of its inner files does not apply */
export function withPrebundledDeps(
  config: ViteUserConfig,
  options: { root: string; appDir?: string; packages: string[] },
): ViteUserConfig;
