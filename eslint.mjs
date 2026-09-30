/* @layer tooling-scripts @kind config */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import { DEFAULT_ALLOW } from './slop-patterns.mjs';
import { noRawHtml } from './rules/no-raw-html.mjs';
import { noRawColor } from './rules/no-raw-color.mjs';
import { noInlineStyle } from './rules/no-inline-style.mjs';
import { noAsElementWithPrimitive } from './rules/no-as-element-with-primitive.mjs';
import { noStaticInlineStyle } from './rules/no-static-inline-style.mjs';
import { noEmDash, noSmartPunctuation, noSlopProse } from './rules/slop-rule.mjs';
import { noComments, DEFAULT_COMMENT_ALLOW } from './rules/no-comments.mjs';
import { noSlopIdentifiers } from './rules/no-slop-identifiers.mjs';
import { exportsLast } from './rules/exports-last.mjs';
import { oneComponentPerFile } from './rules/one-component-per-file.mjs';
import { oneExportPerFile } from './rules/one-export-per-file.mjs';
import { typesInTypeFile } from './rules/types-in-type-file.mjs';
import { constantsInConstantsFile } from './rules/constants-in-constants-file.mjs';
import { hookFileNamedAfterHook } from './rules/hook-file-named-after-hook.mjs';
import { cssBesideComponent } from './rules/css-beside-component.mjs';
import { noCrossPackageRelative, noDeepPackageImport, noGenericFolderNames } from './rules/boundaries.mjs';
import { QUALITY_RULES, TS_QUALITY_RULES, TYPED_RULES, RESTRICTED_SYNTAX, NO_INLINE_EXPORT, RAW_CONTROLS, NO_DEFAULT_EXPORT, NO_DOUBLE_CAST } from './quality-rules.mjs';

const LOCAL_RULES = {
  'no-raw-html': noRawHtml,
  'no-raw-color': noRawColor,
  'no-inline-style': noInlineStyle,
  'no-as-element-with-primitive': noAsElementWithPrimitive,
  'no-static-inline-style': noStaticInlineStyle,
  'no-em-dash': noEmDash,
  'no-smart-punctuation': noSmartPunctuation,
  'no-slop-prose': noSlopProse,
  'no-comments': noComments,
  'no-slop-identifiers': noSlopIdentifiers,
  'exports-last': exportsLast,
  'one-component-per-file': oneComponentPerFile,
  'one-export-per-file': oneExportPerFile,
  'types-in-type-file': typesInTypeFile,
  'constants-in-constants-file': constantsInConstantsFile,
  'hook-file-named-after-hook': hookFileNamedAfterHook,
  'css-beside-component': cssBesideComponent,
  'no-cross-package-relative': noCrossPackageRelative,
  'no-deep-package-import': noDeepPackageImport,
  'no-generic-folder-names': noGenericFolderNames,
};

const BASE_IGNORES = [
  'node_modules/**', '**/node_modules/**', 'dist/**', '**/dist/**', 'out/**', 'release/**', 'coverage/**',
  '**/*.d.ts', '**/*.d.mts', '**/*.config.{js,ts,cjs,mjs}', '**/.markdownlint-cli2.mjs', '**/.brock/**', '.worktrees/**',
];

const DEFAULT_CONSOLE_GLOBS = ['**/bin/**', '**/scripts/**', '**/tooling/**', '**/*.test.{ts,tsx,js,mjs}'];
const DEFAULT_EXPORT_GLOBS = ['**/*.stories.{ts,tsx}', '**/modules/*/src/{main,preload,renderer}/index.ts', '**/stylelint-rules/*.mjs', '**/brock.workspace.mjs', '**/boot/*.task.ts'];
const NODE_GLOBALS = { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly', fetch: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' };

const slopRules = (allow) => ({
  'local/no-em-dash': ['error', { allow }],
  'local/no-smart-punctuation': ['error', { allow }],
  'local/no-slop-prose': ['error', { allow }],
});

const BOUNDARY_RULES = {
  'local/no-cross-package-relative': 'error',
  'local/no-deep-package-import': 'error',
  'local/no-generic-folder-names': 'error',
};

const PRIMITIVE_RULES = {
  'local/no-raw-html': 'off',
  'local/no-inline-style': 'off',
  'local/no-as-element-with-primitive': 'off',
  'local/no-static-inline-style': 'off',
  'no-restricted-syntax': ['error', NO_INLINE_EXPORT, NO_DEFAULT_EXPORT],
};

const SHAPE_RULES = {
  'local/one-component-per-file': 'error',
  'local/one-export-per-file': 'error',
  'local/types-in-type-file': 'error',
  'local/constants-in-constants-file': 'error',
  'local/hook-file-named-after-hook': 'error',
  'local/css-beside-component': 'error',
};

const SHAPE_RULES_OFF = Object.fromEntries(Object.keys(SHAPE_RULES).map((rule) => [rule, 'off']));

const withoutSyntax = (dropped) => ['error', ...RESTRICTED_SYNTAX.filter((rule) => rule !== dropped)];

const requireWhy = (label, exceptions) => {
  for (const exception of exceptions) {
    if (!exception.why?.trim()) throw new Error(`${label} exception for ${exception.files?.join(', ')} needs a why`);
  }
  return exceptions;
};

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
  plugins: { 'react-hooks': reactHooks, local: { rules: LOCAL_RULES } },
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
    'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX, ...RAW_CONTROLS],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',
  },
});

const jsBlock = (shared) => ({
  files: ['**/*.{js,mjs,cjs,jsx}'],
  extends: [js.configs.recommended],
  languageOptions: { sourceType: 'module', ecmaVersion: 'latest', globals: NODE_GLOBALS },
  plugins: { local: { rules: LOCAL_RULES } },
  rules: {
    ...QUALITY_RULES,
    ...shared.rules,
    'local/no-comments': ['error', { allow: shared.commentAllow, allowJsdocTypes: true }],
    'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX],
  },
});

const JUSTIFIED = {
  inlineStyle: { 'local/no-inline-style': 'off' },
  doubleCast: { 'no-restricted-syntax': [...withoutSyntax(NO_DOUBLE_CAST), ...RAW_CONTROLS] },
  glyphContent: { 'local/no-smart-punctuation': 'off' },
  shapeOff: SHAPE_RULES_OFF,
};

const justifiedBlocks = (opts) =>
  Object.entries(JUSTIFIED).flatMap(([label, rules]) => requireWhy(label, opts[label] ?? []).map((e) => ({ files: e.files, rules })));

const globBlock = (files, rules) => (files?.length ? [{ files, rules }] : []);

const exceptionBlocks = (opts) => [
  ...globBlock(opts.rawColorOffGlobs, { 'local/no-raw-color': 'off' }),
  ...globBlock(opts.primitivesGlobs, PRIMITIVE_RULES),
  { files: opts.consoleGlobs ?? DEFAULT_CONSOLE_GLOBS, rules: { 'no-console': 'off' } },
  { files: [...DEFAULT_EXPORT_GLOBS, ...(opts.defaultExportGlobs ?? [])], rules: { 'no-restricted-syntax': withoutSyntax(NO_DEFAULT_EXPORT) } },
  ...justifiedBlocks(opts),
  { files: ['**/brock-lint-config/**', '**/packages/lint-config/**'], rules: { 'local/no-em-dash': 'off', 'local/no-smart-punctuation': 'off', 'local/no-slop-prose': 'off' } },
];

/**
 * @typedef {object} BrockEslintExceptions
 * @property {string[]} [primitivesGlobs] design-system components: raw HTML and inline style allowed
 * @property {{ files: string[], why: string }[]} [inlineStyle] justified style props outside primitives
 * @property {{ files: string[], why: string }[]} [doubleCast] boundary files where `as unknown as T` bridges a type
 * @property {{ files: string[], why: string }[]} [glyphContent] files whose data is emoji or glyphs
 * @property {{ files: string[], why: string }[]} [shapeOff] files that are a list by nature, exempt from the shape rules
 * @property {string[]} [rawColorOffGlobs] categorical palettes and pixel-accurate reproductions
 * @property {string[]} [consoleGlobs] CLI files whose output is the console, replaces the default
 * @property {string[]} [defaultExportGlobs] files a host tool loads by default export
 * @property {{ allow?: string[] }} [comments] extra comment forms with a working use, regex sources
 */
/**
 * @typedef {BrockEslintExceptions & { allow?: string[], ignores?: string[], boundaries?: boolean, typed?: boolean, extra?: unknown[], rootDir?: string }} BrockEslintOptions
 */
/** @param {BrockEslintOptions} [opts] */
const brockEslint = (opts = {}) => {
  const shared = {
    rules: {
      ...slopRules([...DEFAULT_ALLOW, ...(opts.allow ?? [])]),
      ...(opts.boundaries === false ? {} : BOUNDARY_RULES),
      'local/no-slop-identifiers': 'error',
      'local/exports-last': 'error',
    },
    commentAllow: [...DEFAULT_COMMENT_ALLOW, ...(opts.comments?.allow ?? [])],
  };
  return tseslint.config(
    { ignores: [...BASE_IGNORES, ...(opts.ignores ?? [])] },
    tsBlock(opts, shared),
    jsBlock(shared),
    ...exceptionBlocks(opts),
    ...(opts.extra ?? []),
  );
};

export { brockEslint, LOCAL_RULES, NO_INLINE_EXPORT, RAW_CONTROLS, BOUNDARY_RULES, PRIMITIVE_RULES, DEFAULT_COMMENT_ALLOW, DEFAULT_CONSOLE_GLOBS, slopRules };
