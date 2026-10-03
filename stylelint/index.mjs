/* @layer tooling-scripts @kind config */
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStandards } from '../config/load.mjs';
import { facetOptions, facetsOf, mergeOptions } from '../config/merge.mjs';

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

const STANDARD_CONFIG = 'stylelint-config-standard';

const standardConfigFor = (rootDir) => {
  try {
    createRequire(join(rootDir, 'package.json')).resolve(STANDARD_CONFIG);
    return STANDARD_CONFIG;
  } catch {
    return createRequire(import.meta.url).resolve(STANDARD_CONFIG);
  }
};

const tokenRules = (opts) => {
  const secondary = {
    severity: 'warning',
    tokenGlobs: opts.tokenGlobs ?? [],
    ...(opts.tokens?.length ? { tokenSources: opts.tokens } : {}),
    ...(opts.rootDir ? { rootDir: opts.rootDir } : {}),
  };
  return { 'brock/no-token-override': [true, secondary], 'brock/no-token-shadow': [true, secondary] };
};

const resolveOptions = (input) => {
  const { rootDir, context, extensions, options: config } = loadStandards({ rootDir: input.rootDir, packageDir: input.packageDir, presets: input.presets, extensions: input.extensions, discover: input.discover });
  const facets = facetsOf(extensions, 'stylelint');
  const tokens = config.tokens ? { tokens: config.tokens } : {};
  return {
    extendsConfig: standardConfigFor(input.rootDir ?? rootDir),
    opts: mergeOptions(facetOptions(extensions, 'stylelint', context), tokens, config.stylelint, input),
    plugins: facets.flatMap((facet) => facet.plugins ?? []),
    rules: Object.assign({}, ...facets.map((facet) => facet.rules ?? {})),
  };
};

/**
 * @typedef {object} StylelintTiers
 * @property {string[]} [uiGlobs] token-only stylesheets
 * @property {string[]} [tokenGlobs] token files; values derive via var()
 * @property {string[]} [rawValueGlobs] token files holding raw values
 * @property {string[]} [exemptGlobs] documented exceptions
 * @property {string[]} [tokens] token sheets from packages or paths
 */
/**
 * @param {StylelintTiers & Record<string, any>} [input]
 * @returns {Record<string, unknown>}
 */
const standardsStylelint = (input = {}) => {
  const { opts, plugins, rules: extensionRules, extendsConfig } = resolveOptions(input);
  const scoped = [
    [opts.uiGlobs, TOKEN_ONLY_RULES],
    [opts.tokenGlobs, opts.rawValueGlobs?.length ? TOKEN_DERIVED_RULES : TOKEN_RULES_OFF],
    [opts.rawValueGlobs, TOKEN_RULES_OFF],
    [opts.exemptGlobs, TOKEN_RULES_OFF],
  ];
  const overrides = scoped.filter(([files]) => files?.length).map(([files, rules]) => ({ files, rules }));
  return {
    extends: extendsConfig,
    plugins: [...PLUGINS, ...plugins],
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
      ...extensionRules,
      ...(opts.rules ?? {}),
    },
    overrides,
    ignoreFiles: ['**/node_modules/**', '**/dist/**', '**/release/**', '.worktrees/**', '.claude/worktrees/**', ...(opts.ignoreFiles ?? [])],
  };
};

export { standardsStylelint, TOKEN_ONLY_RULES, TOKEN_DERIVED_RULES, TOKEN_RULES_OFF, COMMENT_ALLOW, QUERY_LENGTHS };
