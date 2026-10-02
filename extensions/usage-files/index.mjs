/* @layer tooling-scripts @kind config */
import { defineExtension } from '../../config/define.mjs';

export default defineExtension({
  id: 'usage-files',
  description: 'Every component folder outside sub-components/ holds {Name}.usage.ts',
  structure: {
    componentFiles: [{ file: '{Name}.usage.ts', required: true, reason: 'every design-system component documents when to use it' }],
  },
});
