/* @layer tooling-scripts @kind logic */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHAIN_MODULE = 'knip-preprocessors.mjs';

/**
 * @param {string[]} paths the preprocessor modules, in order
 * @returns {string} the module source
 */
const chainSource = (paths) => [
  '// Written by standards knip on every run: knip 5.88 crashes on a second --preprocessor, so this one runs them all in order.',
  ...paths.map((path, index) => `import step${index} from ${JSON.stringify(pathToFileURL(path).href)};`),
  '',
  `const steps = [${paths.map((_, index) => `step${index}`).join(', ')}];`,
  '',
  'export default async (data) => {',
  '  let out = data;',
  '  for (const step of steps) out = await step(out);',
  '  return out;',
  '};',
  '',
].join('\n');

/**
 * @param {string} dir the cache folder for the chain module
 * @param {string[]} paths the preprocessor modules, in order
 * @returns {string[]} the knip arguments, one preprocessor at most
 */
const preprocessorArgs = (dir, paths) => {
  if (paths.length <= 1) return paths.flatMap((path) => ['--preprocessor', path]);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, CHAIN_MODULE);
  writeFileSync(file, chainSource(paths));
  return ['--preprocessor', file];
};

export { chainSource, preprocessorArgs };
