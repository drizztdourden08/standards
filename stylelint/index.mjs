/* @layer tooling-scripts @kind config */
import { fileURLToPath } from 'node:url';

const QUERY_LENGTHS = ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'];

const TOKEN_ONLY_RULES = {
  'color-no-hex': true,
  'color-named': 'never',
  'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb'],
  'unit-disallowed-list': [['px', 'rem', 'em'], { ignoreMediaFeatureNames: { px: QUERY_LENGTHS, rem: QUERY_LENGTHS } }],
  'declaration-property-value-disallowed-list': {
    '/^--/': ['/^(?!var\\().+$/'],
    'font-weight': ['/^[0-9]+$/'],
    'z-index': ['/^[1-9][0-9]*$/'],
    'font-family': ['/^(?!var\\(|inherit$|initial$|unset$).+$/'],
  },
};

const TOKEN_RULES_OFF = {
  'color-no-hex': null,
  'color-named': null,
  'function-disallowed-list': null,
  'unit-disallowed-list': null,
  'declaration-property-value-disallowed-list': null,
};

const TOKEN_DERIVED_RULES = {
  ...TOKEN_ONLY_RULES,
  'unit-disallowed-list': [['px', 'rem', 'em'], { ignoreMediaFeatureNames: { px: QUERY_LENGTHS, rem: QUERY_LENGTHS }, ignoreProperties: { em: ['/^--tracking-/'] } }],
  'declaration-property-value-disallowed-list': {
    'font-weight': ['/^[0-9]+$/'],
    'z-index': ['/^[1-9][0-9]*$/'],
  },
};

const COMMENT_ALLOW = '^\\s*(@layer\\b|@kind\\b|stylelint-)';

const PLUGINS = ['no-token-override', 'no-token-shadow'].map((name) => fileURLToPath(new URL(`./rules/${name}.mjs`, import.meta.url)));

const tokenRules = (opts) => {
  const secondary = { severity: 'warning', tokenGlobs: opts.tokenGlobs ?? [], ...(opts.rootDir ? { rootDir: opts.rootDir } : {}) };
  return { 'brock/no-token-override': [true, secondary], 'brock/no-token-shadow': [true, secondary] };
};

/**
 * @typedef {object} BrockStylelintOptions
 * @property {string[]} [uiGlobs] token-only stylesheets
 * @property {string[]} [tokenGlobs] token files; values derive via var(), color-mix(), calc()
 * @property {string[]} [rawValueGlobs] token files holding raw colours and lengths
 * @property {string[]} [exemptGlobs] documented exceptions to the token rules
 * @property {string} [commentAllow] regex source a CSS comment must match
 * @property {string} [rootDir] base of tokenGlobs, default the nearest config folder
 * @property {string[]} [ignoreFiles]
 * @property {Record<string, unknown>} [rules]
 */
/** @param {BrockStylelintOptions} [opts] */
const brockStylelint = (opts = {}) => {
  const scoped = [
    [opts.uiGlobs, TOKEN_ONLY_RULES],
    [opts.tokenGlobs, opts.rawValueGlobs?.length ? TOKEN_DERIVED_RULES : TOKEN_RULES_OFF],
    [opts.rawValueGlobs, TOKEN_RULES_OFF],
    [opts.exemptGlobs, TOKEN_RULES_OFF],
  ];
  const overrides = scoped.filter(([files]) => files?.length).map(([files, rules]) => ({ files, rules }));
  return {
    extends: 'stylelint-config-standard',
    plugins: PLUGINS,
    reportDescriptionlessDisables: true,
    rules: {
      'no-descending-specificity': null,
      'custom-property-pattern': null,
      'selector-class-pattern': null,
      'keyframes-name-pattern': null,
      'alpha-value-notation': null,
      'color-function-notation': null,
      'value-keyword-case': null,
      'comment-pattern': opts.commentAllow ?? COMMENT_ALLOW,
      ...tokenRules(opts),
      ...(opts.rules ?? {}),
    },
    overrides,
    ignoreFiles: ['**/node_modules/**', '**/dist/**', '**/release/**', '.worktrees/**', ...(opts.ignoreFiles ?? [])],
  };
};

export { brockStylelint, TOKEN_ONLY_RULES, TOKEN_DERIVED_RULES, TOKEN_RULES_OFF, COMMENT_ALLOW, QUERY_LENGTHS };
