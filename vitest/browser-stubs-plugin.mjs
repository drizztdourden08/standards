/* @layer tooling-scripts @kind logic */
import { createRequire } from 'node:module';
import { join } from 'node:path';

/**
 * @param {string} resolveDir
 * @returns {string | undefined} the browser build of debug, else undefined so esbuild resolves it
 */
const resolveDebugBrowser = (resolveDir) => {
  try {
    return createRequire(join(resolveDir, 'noop.js')).resolve('debug/src/browser.js');
  } catch {
    return undefined;
  }
};

/**
 * An esbuild plugin for the vitest optimizer: debug takes its browser build (its node build pulls tty) and css imports become empty modules.
 * @returns {import('esbuild').Plugin}
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
