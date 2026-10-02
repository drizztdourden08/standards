/* @layer tooling-scripts @kind config */
import { defineExtension } from '../config/define.mjs';

export default defineExtension({
  id: 'preset:library',
  description: 'A published package without React: the core, with the boundary rules kept on',
  eslint: { options: { boundaries: true } },
});
