/* @layer tooling-scripts @kind logic */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { browserStubsPlugin } from './browser-stubs-plugin.mjs';
import { prebundleEntries } from './prebundle-entries.mjs';

/**
 * @param {string} root
 * @param {string} appDir
 * @param {string} name
 * @returns {string} the folder of the installed package
 */
const findPackage = (root, appDir, name) => {
  const found = [join(root, 'node_modules', name), join(appDir, 'node_modules', name)].find((dir) =>
    existsSync(join(dir, 'package.json')),
  );
  if (found === undefined) throw new Error(`withPrebundledDeps: package ${name} is not installed under ${root} or ${appDir}`);
  return found;
};

/**
 * Turns on the vitest dependency optimizer for source-shipping packages, so a cold import is prebundled once.
 * A package listed here is shared as one prebundled copy, so vi.mock of its inner files does not apply.
 * @param {import('vitest/config').ViteUserConfig} config
 * @param {{ root: string, appDir?: string, packages: string[] }} options
 * @returns {import('vitest/config').ViteUserConfig} a new config
 */
const withPrebundledDeps = (config, { root, appDir = root, packages }) => {
  const entries = packages.flatMap((name) => prebundleEntries(findPackage(root, appDir, name), name));
  const client = config.test?.deps?.optimizer?.client ?? {};
  const esbuild = client.esbuildOptions ?? {};
  return {
    ...config,
    cacheDir: config.cacheDir ?? join(appDir, 'node_modules', '.vite-standards'),
    test: {
      ...config.test,
      deps: {
        ...config.test?.deps,
        optimizer: {
          ...config.test?.deps?.optimizer,
          client: {
            ...client,
            enabled: true,
            include: [...(client.include ?? []), ...entries],
            esbuildOptions: { jsx: 'automatic', ...esbuild, plugins: [...(esbuild.plugins ?? []), browserStubsPlugin()] },
          },
        },
      },
    },
  };
};

export { withPrebundledDeps };
