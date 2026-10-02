/* @layer tooling-scripts @kind config */
import { defineExtension } from '../config/define.mjs';
import reactApp from './react-app.mjs';

export default defineExtension({
  id: 'preset:design-system',
  description: 'A design system: React, with the primitives tier allowed raw HTML and the style prop',
  eslint: {
    configs: reactApp.eslint.configs,
    options: { primitivesGlobs: ['src/primitives/**/*.tsx'] },
  },
});
