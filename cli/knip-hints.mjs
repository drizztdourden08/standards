/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SIDE_FILE = 'git-ignored.json';

const sideFileNextTo = (configFilePath) => {
  const file = configFilePath ? join(dirname(configFilePath), SIDE_FILE) : '';
  return file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { source: undefined, ignore: [] };
};

/**
 * @param {{ configurationHints: { type: string, identifier: unknown }[], configFilePath?: string, cwd: string }} data
 * @returns {object} the knip report without hints on git-ignored paths
 */
const dropGitIgnoredHints = (data) => {
  const { source, ignore } = sideFileNextTo(data.configFilePath);
  const injected = new Set(ignore);
  const configurationHints = data.configurationHints.filter((hint) => !(hint.type === 'ignore' && injected.has(hint.identifier)));
  return { ...data, configurationHints, ...(source ? { configFilePath: join(data.cwd, source) } : {}) };
};

export default dropGitIgnoredHints;
