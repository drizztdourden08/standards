/* @layer tooling-scripts @kind config */
import tseslint from 'typescript-eslint';
import { DEFAULT_ALLOW } from '../writing/slop-patterns.mjs';
import { loadStandards } from '../config/load.mjs';
import { facetOptions, facetsOf, mergeOptions, proseWords } from '../config/merge.mjs';
import { LOCAL_RULES, LOCAL_PLUGIN } from './local-rules.mjs';
import { DEFAULT_COMMENT_ALLOW } from './rules/no-comments.mjs';
import { NO_INLINE_EXPORT, RAW_CONTROLS, RESTRICTED_SYNTAX, QUALITY_RULES, TS_QUALITY_RULES, TYPED_RULES } from './quality-rules.mjs';
import { BASE_IGNORES, BOUNDARY_RULES, PRIMITIVE_RULES, DEFAULT_CONSOLE_GLOBS, SHAPE_RULES, slopRules } from './rule-sets.mjs';
import { tsBlock, jsBlock, settingsBlocks, exceptionBlocks, extensionRuleBlocks, extensionConfigs } from './blocks.mjs';

/**
 * @param {Record<string, any>} [input] loading keys plus factory options
 * @returns {import('eslint').Linter.Config[]}
 */
const standardsEslint = (input = {}) => {
  const { context, extensions, options: config } = loadStandards({ rootDir: input.rootDir, packageDir: input.packageDir, presets: input.presets, extensions: input.extensions, discover: input.discover });
  const facets = facetsOf(extensions, 'eslint');
  const opts = mergeOptions(facetOptions(extensions, 'eslint', context), config.eslint, input);
  const words = proseWords(extensions, config, opts);
  const shared = {
    rules: {
      ...slopRules([...DEFAULT_ALLOW, ...words.allow], words.banned),
      ...(opts.boundaries === false ? {} : BOUNDARY_RULES),
      'local/no-slop-identifiers': 'error',
      'local/exports-last': 'error',
      'local/file-header': 'error',
    },
    commentAllow: [...DEFAULT_COMMENT_ALLOW, ...(opts.comments?.allow ?? [])],
  };
  return tseslint.config(
    { ignores: [...BASE_IGNORES, ...(opts.ignores ?? [])] },
    ...settingsBlocks(opts),
    tsBlock(opts, shared),
    jsBlock(shared),
    ...extensionRuleBlocks(facets),
    ...exceptionBlocks(opts),
    ...extensionConfigs(facets),
    ...(opts.extra ?? []),
  );
};

export {
  standardsEslint,
  LOCAL_RULES,
  LOCAL_PLUGIN,
  NO_INLINE_EXPORT,
  RAW_CONTROLS,
  RESTRICTED_SYNTAX,
  QUALITY_RULES,
  TS_QUALITY_RULES,
  TYPED_RULES,
  BOUNDARY_RULES,
  PRIMITIVE_RULES,
  SHAPE_RULES,
  DEFAULT_COMMENT_ALLOW,
  DEFAULT_CONSOLE_GLOBS,
  slopRules,
};
