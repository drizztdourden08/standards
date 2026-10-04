/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOT_FOLDERS = '.*/';
const SINGLE_DOT_FOLDER = /^(?:\/|\*\*\/)?(?:[^!#\s]\S*\/)?\.[^/\s*?[\]!]+\/(?:\*\*)?$/;

/**
 * @param {string} rootDir
 * @returns {string[]} one line per break of the dot-folder rule
 */
const gitignoreFindings = (rootDir) => {
  const file = join(rootDir, '.gitignore');
  if (!existsSync(file)) return ['.gitignore: missing; copy templates/gitignore from @drizztdourden08/standards'];
  const lines = readFileSync(file, 'utf8').split(/\r?\n/).map((line) => line.trim());
  const lacking = lines.includes(DOT_FOLDERS) ? [] : [`.gitignore: missing the line "${DOT_FOLDERS}", which ignores every dot-folder`];
  const named = lines.filter((line) => SINGLE_DOT_FOLDER.test(line)).map((line) => `.gitignore: "${line}" names one dot-folder that "${DOT_FOLDERS}" already ignores; delete the line`);
  return [...lacking, ...named];
};

export { gitignoreFindings };
