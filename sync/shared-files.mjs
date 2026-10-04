/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OWN_ROOT } from '../config/load.mjs';
import { gitignoreFindings } from './gitignore-findings.mjs';
import { majorBumpFindings } from './major-bump-findings.mjs';

const readOwn = (path) => readFileSync(join(OWN_ROOT, path), 'utf8');
const readOwnJson = (path) => JSON.parse(readOwn(path));
const lines = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const readJsonAt = (file) => {
  try {
    return { value: JSON.parse(readFileSync(file, 'utf8')) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

const npmrcFindings = (rootDir) => {
  const file = join(rootDir, '.npmrc');
  if (!existsSync(file)) return ['.npmrc: missing; copy templates/npmrc from @drizztdourden08/standards'];
  const present = new Set(lines(readFileSync(file, 'utf8')));
  return lines(readOwn('templates/npmrc')).filter((line) => !present.has(line)).map((line) => `.npmrc: missing the line "${line}"`);
};

const keyFindings = (name, actual, base, keys) =>
  keys.filter((key) => !same(actual[key], base[key])).map((key) => `${name}: "${key}" is ${JSON.stringify(actual[key])}, the base has ${JSON.stringify(base[key])}`);

const jsonFindings = (rootDir, name, compare) => {
  const file = join(rootDir, name);
  if (!existsSync(file)) return [];
  const { value, error } = readJsonAt(file);
  return error ? [`${name}: ${error}`] : compare(value);
};

const changesetFindings = (rootDir) => {
  const base = readOwnJson('templates/changeset-config.json');
  return jsonFindings(rootDir, '.changeset/config.json', (value) => keyFindings('.changeset/config.json', value, base, Object.keys(base).filter((key) => key !== '$schema')));
};

const jscpdFindings = (rootDir) => {
  const base = readOwnJson('jscpd/base.json');
  return jsonFindings(rootDir, '.jscpd.json', (value) => {
    const present = new Set(value.ignore ?? []);
    const ignores = base.ignore.filter((glob) => !present.has(glob)).map((glob) => `.jscpd.json: "ignore" lacks ${glob}`);
    return [...keyFindings('.jscpd.json', value, base, Object.keys(base).filter((key) => key !== 'ignore')), ...ignores];
  });
};

const knipFindings = (rootDir) => {
  const base = readOwnJson('knip/base.json');
  return jsonFindings(rootDir, 'knip.json', (value) => keyFindings('knip.json', value, base, ['$schema']));
};

/**
 * @param {string} rootDir
 * @returns {string[]} one line per shared file that drifts from its template
 */
const sharedFileFindings = (rootDir) => [...npmrcFindings(rootDir), ...gitignoreFindings(rootDir), ...changesetFindings(rootDir), ...majorBumpFindings(rootDir), ...jscpdFindings(rootDir), ...knipFindings(rootDir)];

export { sharedFileFindings };
