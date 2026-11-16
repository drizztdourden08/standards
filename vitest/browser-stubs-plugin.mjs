/* @layer tooling-scripts @kind logic */
import { createRequire } from 'node:module';
import { join } from 'node:path';

/**
 * @param {string} resolveDir
 * @returns {string | undefined} debug's browser build, or undefined
 */
const resolveDebugBrowser = (resolveDir) => {
  try {
    return createRequire(join(resolveDir, 'noop.js')).resolve('debug/src/browser.js');
  } catch {
    return undefined;
  }
};

/**
 * @returns {{ name: string, setup: (build: any) => void }} css stubbed, debug on its browser build
 */
const browserStubsPlugin = () => ({
  name: 'standards-browser-stubs',
  setup: (build) => {
    build.onResolve({ filter: /^debug$/ }, (args) => {
      const path = resolveDebugBrowser(args.resolveDir);
      return path === undefined ? undefined : { path };
    });
    build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-stub' }));
    build.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({ contents: '', loader: 'js' }));
  },
});

export { browserStubsPlugin };
