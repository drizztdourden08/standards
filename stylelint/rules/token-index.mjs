/* @layer tooling-scripts @kind logic */
import { existsSync, globSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const IMPORT = /@import\s+(?:url\()?\s*['"]?([^'")\s]+)['"]?\s*\)?/g;
const DECLARATION = /(--[\w-]+)\s*:\s*([^;{}]+);/g;
const cache = new Map();

const sourceFile = (rootDir, source) => {
  if (isAbsolute(source) || source.startsWith('.')) return resolve(rootDir, source);
  const anchor = join(rootDir, 'package.json');
  if (!existsSync(anchor)) return null;
  try {
    return createRequire(anchor).resolve(source);
  } catch {
    return null;
  }
};

const normalizePath = (file) => resolve(file).replace(/\\/g, '/').toLowerCase();

const followImports = (file, seen) => {
  const path = normalizePath(file);
  if (seen.has(path) || !existsSync(path)) return seen;
  seen.add(path);
  const text = readFileSync(path, 'utf8');
  for (const match of text.matchAll(IMPORT)) {
    const target = match[1];
    if (!/^[./]/.test(target)) continue;
    followImports(join(dirname(path), target), seen);
  }
  return seen;
};

const tokenFiles = (rootDir, tokenGlobs, tokenSources) => {
  const seen = new Set();
  for (const glob of tokenGlobs) {
    for (const file of globSync(glob, { cwd: rootDir })) followImports(isAbsolute(file) ? file : join(rootDir, file), seen);
  }
  for (const source of tokenSources) {
    const file = sourceFile(rootDir, source);
    if (file) followImports(file, seen);
  }
  return seen;
};

const readTokens = (files) => {
  const tokens = new Map();
  for (const file of files) {
    for (const match of readFileSync(file, 'utf8').matchAll(DECLARATION)) {
      if (!tokens.has(match[1])) tokens.set(match[1], { value: match[2].trim(), file });
    }
  }
  return tokens;
};

const CONFIG_FILES = ['stylelint.config.mjs', 'stylelint.config.js', 'stylelint.config.cjs', '.stylelintrc', '.stylelintrc.json', '.stylelintrc.mjs'];

/**
 * @param {string} file the stylesheet being linted
 * @returns {string} the folder of the nearest stylelint config, else cwd
 */
const configRootFor = (file) => {
  let dir = dirname(resolve(file));
  for (;;) {
    if (CONFIG_FILES.some((name) => existsSync(join(dir, name)))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
};

/**
 * @param {string} rootDir
 * @param {string[]} tokenGlobs
 * @param {string[]} [tokenSources] package specifiers or paths of token sheets
 * @returns {{ files: Set<string>, tokens: Map<string, { value: string, file: string }> }}
 */
const tokenIndex = (rootDir, tokenGlobs, tokenSources = []) => {
  const key = `${rootDir}::${tokenGlobs.join('|')}::${tokenSources.join('|')}`;
  if (!cache.has(key)) {
    const files = tokenFiles(rootDir, tokenGlobs, tokenSources);
    cache.set(key, { files, tokens: readTokens(files) });
  }
  return cache.get(key);
};

/**
 * @param {{ source?: { input: { file?: string } } }} root
 * @param {{ rootDir?: string, tokenGlobs?: string[], tokenSources?: string[] }} secondary
 * @returns {{ tokens: Map<string, { value: string, file: string }> } | null} null when the sheet is a token file
 */
const tokensForSheet = (root, secondary) => {
  const file = root.source?.input.file;
  if (!file) return null;
  const { files, tokens } = tokenIndex(secondary.rootDir ?? configRootFor(file), secondary.tokenGlobs ?? [], secondary.tokenSources ?? []);
  return files.has(normalizePath(file)) ? null : { tokens };
};

export { tokenIndex, tokensForSheet };
