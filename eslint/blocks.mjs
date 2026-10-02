/* @layer tooling-scripts @kind config */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { LOCAL_PLUGIN } from './local-rules.mjs';
import { QUALITY_RULES, TS_QUALITY_RULES, TYPED_RULES, RESTRICTED_SYNTAX, RAW_CONTROLS, NO_DEFAULT_EXPORT, NO_DOUBLE_CAST } from './quality-rules.mjs';
import { DEFAULT_CONSOLE_GLOBS, DEFAULT_EXPORT_GLOBS, NODE_GLOBALS, PRIMITIVE_RULES, SHAPE_RULES, SHAPE_RULES_OFF, SOURCE_FILES } from './rule-sets.mjs';

const withoutSyntax = (dropped, extra = []) => ['error', ...RESTRICTED_SYNTAX.filter((rule) => rule !== dropped), ...extra];

const requireWhy = (label, exceptions) => {
  for (const exception of exceptions) {
    if (!exception.why?.trim()) throw new Error(`${label} exception for ${exception.files?.join(', ')} needs a why`);
  }
  return exceptions;
};

const rawControlsOf = (opts) => opts.rawControls ?? RAW_CONTROLS;

const tsBlock = (opts, shared) => ({
  files: ['**/*.{ts,tsx}'],
  extends: [js.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.stylistic],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
      tsconfigRootDir: opts.rootDir ?? process.cwd(),
      projectService: opts.typed === false ? false : { allowDefaultProject: ['*.ts', '*.mjs'] },
    },
  },
  plugins: { local: LOCAL_PLUGIN },
  rules: {
    ...QUALITY_RULES,
    ...TS_QUALITY_RULES,
    ...SHAPE_RULES,
    ...(opts.typed === false ? {} : TYPED_RULES),
    ...shared.rules,
    'local/no-comments': ['error', { allow: shared.commentAllow }],
    'local/no-raw-html': 'error',
    'local/no-inline-style': 'error',
    'local/no-raw-color': 'error',
    'local/no-as-element-with-primitive': 'error',
    'local/no-static-inline-style': 'error',
    'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX, ...rawControlsOf(opts)],
  },
});

const jsBlock = (shared) => ({
  files: ['**/*.{js,mjs,cjs,jsx}'],
  extends: [js.configs.recommended],
  languageOptions: { sourceType: 'module', ecmaVersion: 'latest', globals: NODE_GLOBALS },
  plugins: { local: LOCAL_PLUGIN },
  rules: {
    ...QUALITY_RULES,
    ...shared.rules,
    'local/no-comments': ['error', { allow: shared.commentAllow, allowJsdocTypes: true }],
    'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX],
  },
});

const settingsBlocks = (opts) => {
  if (!opts.fileKinds && !opts.oneExportExempt) return [];
  return [{ settings: { standards: { fileKinds: opts.fileKinds ?? {}, oneExportExempt: opts.oneExportExempt ?? [] } } }];
};

const justified = (opts) => ({
  inlineStyle: { 'local/no-inline-style': 'off' },
  doubleCast: { 'no-restricted-syntax': withoutSyntax(NO_DOUBLE_CAST, rawControlsOf(opts)) },
  glyphContent: { 'local/no-smart-punctuation': 'off' },
  shapeOff: SHAPE_RULES_OFF,
});

const justifiedBlocks = (opts) =>
  Object.entries(justified(opts)).flatMap(([label, rules]) => requireWhy(label, opts[label] ?? []).map((e) => ({ files: e.files, rules })));

const globBlock = (files, rules) => (files?.length ? [{ files, rules }] : []);

const exceptionBlocks = (opts) => [
  ...globBlock(opts.rawColorOffGlobs, { 'local/no-raw-color': 'off' }),
  ...globBlock(opts.primitivesGlobs, PRIMITIVE_RULES),
  { files: opts.consoleGlobs ?? DEFAULT_CONSOLE_GLOBS, rules: { 'no-console': 'off' } },
  { files: [...DEFAULT_EXPORT_GLOBS, ...(opts.defaultExportGlobs ?? [])], rules: { 'no-restricted-syntax': withoutSyntax(NO_DEFAULT_EXPORT) } },
  ...justifiedBlocks(opts),
];

const extensionRuleBlocks = (facets) =>
  facets.filter((facet) => facet.plugins || facet.rules).map((facet) => ({ files: SOURCE_FILES, plugins: facet.plugins ?? {}, rules: facet.rules ?? {} }));

const extensionConfigs = (facets) => facets.flatMap((facet) => facet.configs ?? []);

export { tsBlock, jsBlock, settingsBlocks, exceptionBlocks, extensionRuleBlocks, extensionConfigs };
