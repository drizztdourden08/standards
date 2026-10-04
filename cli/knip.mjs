/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OWN_ROOT } from '../config/load.mjs';
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

const writeConfig = (rootDir, config) => {
  const dir = join(rootDir, 'node_modules', '.cache', 'standards');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'knip.json');
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  writeFileSync(join(dir, 'git-ignored.json'), `${JSON.stringify({ source: configNameIn(rootDir), ignore: knipIgnores(rootDir) })}\n`);
  return file;
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
  const configArgs = config ? ['--no-gitignore', '--config', writeConfig(rootDir, config), '--preprocessor', HINTS] : [];
  return spawnSync(process.execPath, [bin, ...configArgs, ...args], { cwd: rootDir, stdio: 'inherit' }).status ?? 1;
};

export { runKnip, knipConfigFor };
