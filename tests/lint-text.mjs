/* @layer tooling-scripts @kind test */
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { standardsEslint } from '../eslint/index.mjs';

const HEADER = '/* @layer tooling-scripts @kind logic */\n';

/**
 * @param {string} root
 * @param {string} file
 * @param {string} code
 * @param {Record<string, unknown>} [options]
 * @returns {Promise<string[]>} each message as "<rule id>: <message>"
 */
const lint = async (root, file, code, options = {}) => {
  const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: standardsEslint({ rootDir: root, typed: false, ...options }) });
  const [result] = await eslint.lintText(code, { filePath: join(root, file) });
  return result.messages.map((message) => `${message.ruleId}: ${message.message}`);
};

export { HEADER, lint };
