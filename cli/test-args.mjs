/* @layer tooling-scripts @kind logic */
import { TEST_MODES } from './run.constants.mjs';

/**
 * @param {string[]} args
 * @returns {{ mode: string, root?: string, base?: string, passthrough: string[] }}
 */
const parseTestArgs = (args) => {
  const rest = [...args];
  const mode = TEST_MODES.includes(rest[0]) ? rest.shift() : 'changed';
  const found = { mode, passthrough: [] };
  while (rest.length) {
    const arg = rest.shift();
    if (arg === '--root' || arg === '--base') found[arg.slice(2)] = rest.shift();
    else found.passthrough.push(arg);
  }
  return found;
};

export { parseTestArgs };
