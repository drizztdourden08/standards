/* @layer tooling-scripts @kind config */
import { NO_INLINE_EXPORT, NO_DEFAULT_EXPORT } from './quality-rules.mjs';

const BASE_IGNORES = [
  'node_modules/**', '**/node_modules/**', 'dist/**', '**/dist/**', 'out/**', 'release/**', 'coverage/**',
  '**/*.d.ts', '**/*.d.mts', '**/*.config.{js,ts,cjs,mjs}', '**/.markdownlint-cli2.mjs', '**/.brock/**',
];

const DEFAULT_CONSOLE_GLOBS = ['**/bin/**', '**/scripts/**', '**/tooling/**', '**/*.test.{ts,tsx,js,mjs}'];
const DEFAULT_EXPORT_GLOBS = ['**/*.stories.{ts,tsx}', '**/stylelint-rules/*.mjs', '**/standards.extension.mjs'];
const NODE_GLOBALS = { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly', fetch: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' };
const SOURCE_FILES = ['**/*.{ts,tsx,js,mjs,cjs,jsx}'];

/**
 * @param {string[]} allow
 * @param {string[]} [banned]
 * @returns {Record<string, unknown>}
 */
const slopRules = (allow, banned = []) => {
  const options = banned.length ? { allow, banned } : { allow };
  return {
    'local/no-em-dash': ['error', options],
    'local/no-smart-punctuation': ['error', options],
    'local/no-slop-prose': ['error', options],
    'local/no-tool-brand-words': ['error', options],
  };
};

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

export { BASE_IGNORES, DEFAULT_CONSOLE_GLOBS, DEFAULT_EXPORT_GLOBS, NODE_GLOBALS, SOURCE_FILES, slopRules, BOUNDARY_RULES, PRIMITIVE_RULES, SHAPE_RULES, SHAPE_RULES_OFF };
