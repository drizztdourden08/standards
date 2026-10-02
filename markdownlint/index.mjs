/* @layer tooling-scripts @kind config */
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

const BASE_IGNORES = ['**/node_modules/**', '**/dist/**', '**/release/**', '**/out/**', '.worktrees/**'];

const RULES_MODULE = '@drizztdourden08/brock-lint-config/markdown-rules';

/**
 * @param {{ ignores?: string[], globs?: string[], allow?: string[], config?: Record<string, unknown>}} [opts]
 */
const brockMarkdownlint = (opts = {}) => ({
  config: {
    ...STYLE_OFF,
    ...(opts.allow ? { 'no-slop-prose': { allow: opts.allow }, 'no-em-dash': { allow: opts.allow }, 'no-smart-punctuation': { allow: opts.allow } } : {}),
    ...(opts.config ?? {}),
  },
  customRules: [RULES_MODULE],
  globs: opts.globs ?? ['**/*.md'],
  ignores: [...BASE_IGNORES, ...(opts.ignores ?? [])],
});

export { brockMarkdownlint, STYLE_OFF };
