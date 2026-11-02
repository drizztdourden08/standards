/* @layer tooling-scripts @kind logic */
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { TEST_MODES } from './run.constants.mjs';

const takesValue = (previous) => Boolean(previous?.startsWith('-')) && !previous.includes('=');

/**
 * @param {string[]} args
 * @returns {{ mode: string, root?: string, base?: string, files: string[], help?: true, passthrough: string[] }}
 */
const parseTestArgs = (args) => {
  const rest = [...args];
  const mode = TEST_MODES.includes(rest[0]) ? rest.shift() : 'changed';
  const found = { mode, files: [], passthrough: [] };
  while (rest.length) {
    const arg = rest.shift();
    if (arg === '--help' || arg === '-h') found.help = true;
    else if (arg === '--root' || arg === '--base') found[arg.slice(2)] = rest.shift();
    else if (arg.startsWith('-') || takesValue(found.passthrough.at(-1))) found.passthrough.push(arg);
    else found.files.push(arg);
  }
  return found;
};

/**
 * @param {{ files: string[], cwd: string, rootDir: string }} job files as typed, relative to cwd
 * @returns {{ files: string[] } | { missing: string[] }} files relative to the root, or the ones not found
 */
const givenFiles = ({ files, cwd, rootDir }) => {
  const paths = files.map((file) => resolve(cwd, file));
  const missing = files.filter((file, index) => !existsSync(paths[index]));
  if (missing.length) return { missing };
  return { files: paths.map((path) => relative(rootDir, path).replaceAll('\\', '/')) };
};

export { parseTestArgs, givenFiles };
