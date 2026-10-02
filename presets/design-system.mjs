/* @layer tooling-scripts @kind config */
import { defineExtension } from '../config/define.mjs';
import reactApp from './react-app.mjs';

export default defineExtension({
  id: 'preset:design-system',
  description: 'A design system: React and the rules of hooks; the design system package names its primitives folders through primitivesGlobs or its own extension',
  eslint: { configs: reactApp.eslint.configs },
});
