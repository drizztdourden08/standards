/* @layer root-config @kind config */
import { standardsEslint } from './eslint/index.mjs';

const WRITING_OFF = { 'local/no-em-dash': 'off', 'local/no-smart-punctuation': 'off', 'local/no-slop-prose': 'off' };

export default standardsEslint({
  presets: ['library'],
  ignores: ['tests/fixtures/**'],
  consoleGlobs: ['bin/**', 'cli/**', 'structure/index.mjs', 'prose/index.mjs', 'sync/index.mjs', 'tests/**'],
  defaultExportGlobs: ['presets/*.mjs', 'extensions/*/index.mjs', 'markdownlint/rules.mjs', 'stylelint/rules/no-token-*.mjs'],
  extra: [{ files: ['writing/**', 'markdownlint/rules.mjs', 'tests/**'], rules: WRITING_OFF }],
});
