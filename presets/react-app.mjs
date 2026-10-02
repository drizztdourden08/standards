/* @layer tooling-scripts @kind config */
import reactHooks from 'eslint-plugin-react-hooks';
import { defineExtension } from '../config/define.mjs';

const REACT_HOOKS = {
  files: ['**/*.{ts,tsx}'],
  plugins: { 'react-hooks': reactHooks },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',
  },
};

export default defineExtension({
  id: 'preset:react-app',
  description: 'A React app or React package: the core plus the rules of hooks',
  eslint: { configs: [REACT_HOOKS] },
});
