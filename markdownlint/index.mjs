/* @layer tooling-scripts @kind config */
import { DEFAULT_ALLOW } from '../writing/slop-patterns.mjs';
import { loadStandards } from '../config/load.mjs';
import { gitIgnoredGlobs } from '../config/git-ignored.mjs';
import { facetsOf, mergeOptions, proseWords } from '../config/merge.mjs';

const STYLE_OFF = {
  MD013: false,
  MD033: false,
  MD041: false,
  MD024: false,
  MD003: false,
  MD060: false,
  MD040: false,
  MD029: false,
  MD036: false,
};

const BASE_IGNORES = ['**/node_modules/**', '**/dist/**', '**/release/**', '**/out/**'];

const RULES_MODULE = '@drizztdourden08/standards/markdownlint/rules';

const WRITING_RULES = ['no-slop-prose', 'no-em-dash', 'no-smart-punctuation', 'no-tool-brand-words'];

const writingConfig = ({ allow, banned }) => {
  if (!allow.length && !banned.length) return {};
  const options = { allow: [...DEFAULT_ALLOW, ...allow], ...(banned.length ? { banned } : {}) };
  return Object.fromEntries(WRITING_RULES.map((rule) => [rule, options]));
};

/**
 * @param {{ ignores?: string[], globs?: string[], allow?: string[], banned?: string[], config?: Record<string, unknown>, rootDir?: string }} [input]
 * @returns {{ config: Record<string, unknown>, customRules: unknown[], globs: string[], ignores: string[] }}
 */
const standardsMarkdownlint = (input = {}) => {
  const { rootDir, extensions, options: config } = loadStandards({ rootDir: input.rootDir, presets: input.presets, extensions: input.extensions, discover: input.discover });
  const facets = facetsOf(extensions, 'markdownlint');
  const opts = mergeOptions(config.markdownlint, input);
  return {
    config: {
      ...STYLE_OFF,
      ...writingConfig(proseWords(extensions, config, opts)),
      ...Object.assign({}, ...facets.map((facet) => facet.config ?? {})),
      ...(opts.config ?? {}),
    },
    customRules: [opts.rulesModule ?? RULES_MODULE, ...facets.flatMap((facet) => facet.customRules ?? [])],
    globs: opts.globs ?? ['**/*.md'],
    ignores: [...BASE_IGNORES, ...gitIgnoredGlobs(rootDir), ...(opts.ignores ?? [])],
  };
};

export { standardsMarkdownlint, STYLE_OFF, RULES_MODULE };
