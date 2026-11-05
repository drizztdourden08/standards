/* @layer tooling-scripts @kind logic */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const OWN_CONFIG = 'standards.config.mjs';
const ROOT_WORKSPACE = '.';
const KNIP_DEFAULT_ENTRY = ['{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}', 'src/{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'];

const withOwnEntry = (target) => {
  const entry = target.entry === undefined ? KNIP_DEFAULT_ENTRY : [target.entry].flat();
  return entry.includes(OWN_CONFIG) ? target : { ...target, entry: [...entry, OWN_CONFIG] };
};

/**
 * The standards CLI reads standards.config.mjs itself, so the unused-file check takes it as a root entry.
 * @param {Record<string, any>} config the repo knip.json plus git-ignored paths
 * @param {string} rootDir
 * @returns {Record<string, any>} config with standards.config.mjs as a root entry when the file exists
 */
const withOwnConfigEntry = (config, rootDir) => {
  if (!existsSync(join(rootDir, OWN_CONFIG))) return config;
  const root = config.workspaces?.[ROOT_WORKSPACE];
  if (!root) return withOwnEntry(config);
  return { ...config, workspaces: { ...config.workspaces, [ROOT_WORKSPACE]: withOwnEntry(root) } };
};

export { withOwnConfigEntry };
