/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadStandards, OWN_ROOT } from '../config/load.mjs';
import { gitIgnoredGlobs } from '../config/git-ignored.mjs';
import { binOf } from './bin-of.mjs';

const HINTS = join(import.meta.dirname, 'knip-hints.mjs');
const CONFIG_FILES = ['knip.json', '.knip.json'];
const KNIP_SKIPS = /(^|\/)node_modules\//;
const asList = (value) => (value === undefined ? [] : [value].flat());
const knipIgnores = (rootDir) => gitIgnoredGlobs(rootDir).filter((glob) => !KNIP_SKIPS.test(glob));
const configNameIn = (rootDir) => CONFIG_FILES.find((name) => existsSync(join(rootDir, name)));

/**
 * @param {string} rootDir
 * @returns {Record<string, unknown> | null} knip.json plus git-ignored paths
 */
const knipConfigFor = (rootDir) => {
  const name = configNameIn(rootDir);
  if (!name) return null;
  const config = JSON.parse(readFileSync(join(rootDir, name), 'utf8'));
  return { ...config, ignore: [...asList(config.ignore), ...knipIgnores(rootDir)] };
};

const CACHE_DIR = ['node_modules', '.cache', 'standards'];
const CONFIG_MODULE = 'knip.config.mjs';
const OLD_CONFIG = 'knip.json';
const ownUrl = (path) => JSON.stringify(pathToFileURL(join(OWN_ROOT, path)).href);

/**
 * @param {string} rootDir
 * @param {Record<string, unknown>} config what knipConfigFor returns
 * @returns {string} the knip config module source
 */
const knipConfigModule = (rootDir, config) => [
  '// Written by standards knip on every run: the repo knip.json, the git-ignored paths and the knip facets of its extensions.',
  `import { loadStandards } from ${ownUrl('config/load.mjs')};`,
  `import { withKnipFacets } from ${ownUrl('config/knip-facet.mjs')};`,
  '',
  `const config = ${JSON.stringify(config, null, 2)};`,
  '',
  `export default withKnipFacets(config, loadStandards({ rootDir: ${JSON.stringify(rootDir)} }));`,
  '',
].join('\n');

/**
 * @param {string} rootDir
 * @param {Record<string, unknown>} config what knipConfigFor returns
 * @returns {string} the config module path, under node_modules/.cache/standards
 */
const writeConfig = (rootDir, config) => {
  const dir = join(rootDir, ...CACHE_DIR);
  mkdirSync(dir, { recursive: true });
  rmSync(join(dir, OLD_CONFIG), { force: true });
  const file = join(dir, CONFIG_MODULE);
  writeFileSync(file, knipConfigModule(rootDir, config));
  writeFileSync(join(dir, 'git-ignored.json'), `${JSON.stringify({ source: configNameIn(rootDir), ignore: knipIgnores(rootDir) })}\n`);
  return file;
};

const warnUnusedFacets = (rootDir, label) => {
  const ids = loadStandards({ rootDir }).extensions.filter((extension) => extension.knip).map((extension) => extension.id);
  if (ids.length) console.warn(`${label}: no knip.json, so the knip facets of ${ids.join(', ')} do not apply`);
};

/**
 * @param {{ rootDir: string, args?: string[], label?: string }} ctx
 * @returns {number} exit code
 */
const runKnip = ({ rootDir, args = [], label = 'standards knip' }) => {
  const bin = binOf('knip', [rootDir, OWN_ROOT]);
  if (!bin) {
    console.error(`${label}: knip is not installed`);
    return 1;
  }
  const config = knipConfigFor(rootDir);
  if (!config) warnUnusedFacets(rootDir, label);
  const configArgs = config ? ['--no-gitignore', '--config', writeConfig(rootDir, config), '--preprocessor', HINTS] : [];
  return spawnSync(process.execPath, [bin, ...configArgs, ...args], { cwd: rootDir, stdio: 'inherit' }).status ?? 1;
};

export { runKnip, knipConfigFor, writeConfig };
