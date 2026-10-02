/* @layer tooling-scripts @kind logic */
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { discoverExtensions } from './discover.mjs';
import { defineExtension } from './define.mjs';
import { optionsContext } from './context.mjs';

const OWN_ROOT = resolve(import.meta.dirname, '..');
const OWN_NAME = '@drizztdourden08/standards';
const CONFIG_FILE = 'standards.config.mjs';
const ROOT_MARKERS = [CONFIG_FILE, 'pnpm-workspace.yaml'];
const PRESETS = ['base', 'library', 'design-system', 'react-app'];
const requireHere = createRequire(import.meta.url);
const discovered = new Map();

const findUp = (fromDir, marker) => {
  let dir = resolve(fromDir);
  for (;;) {
    if (existsSync(join(dir, marker))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

/**
 * @param {string} [fromDir]
 * @returns {string} the nearest folder with a root marker
 */
const findRoot = (fromDir = process.cwd()) => ROOT_MARKERS.map((marker) => findUp(fromDir, marker)).find(Boolean) ?? resolve(fromDir);

const moduleValue = (module) => module?.default ?? module?.extension ?? module;

const readConfig = (rootDir) => {
  const file = join(rootDir, CONFIG_FILE);
  return existsSync(file) ? moduleValue(requireHere(file)) ?? {} : {};
};

const resolveSpecifier = (spec, rootDir) => {
  if (PRESETS.includes(spec)) return join(OWN_ROOT, 'presets', `${spec}.mjs`);
  if (isAbsolute(spec)) return spec;
  if (spec.startsWith('.')) return resolve(rootDir, spec);
  if (spec === OWN_NAME || spec.startsWith(`${OWN_NAME}/`)) return requireHere.resolve(spec);
  return createRequire(join(rootDir, 'package.json')).resolve(spec);
};

/**
 * @param {string | Record<string, unknown>} entry
 * @param {string} rootDir
 * @returns {Record<string, any>}
 */
const loadEntry = (entry, rootDir) => {
  if (typeof entry !== 'string') return defineExtension(entry);
  try {
    return defineExtension(moduleValue(requireHere(resolveSpecifier(entry, rootDir))));
  } catch (error) {
    throw new Error(`standards: cannot load extension "${entry}": ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
};

const byFirstId = (extensions) => {
  const seen = new Set();
  return extensions.filter((extension) => !seen.has(extension.id) && seen.add(extension.id));
};

const discoveredIn = (rootDir) => {
  if (!discovered.has(rootDir)) discovered.set(rootDir, discoverExtensions(rootDir));
  return discovered.get(rootDir);
};

const entriesFor = (rootDir, config, input) => [
  ...(input.presets ?? []),
  ...(config.presets ?? []),
  ...(input.discover !== false && config.discover !== false ? discoveredIn(rootDir) : []),
  ...(config.extensions ?? []),
  ...(input.extensions ?? []),
];

/**
 * @param {{ rootDir?: string, packageDir?: string, presets?: string[], extensions?: unknown[], discover?: boolean }} [input] rootDir, else the nearest root above cwd
 * @returns {{ rootDir: string, context: { rootDir: string, packageDir?: string }, options: Record<string, any>, extensions: Record<string, any>[] }}
 */
const loadStandards = (input = {}) => {
  const rootDir = input.rootDir ? resolve(input.rootDir) : findRoot();
  const config = readConfig(rootDir);
  const extensions = byFirstId(entriesFor(rootDir, config, input).map((entry) => loadEntry(entry, rootDir)));
  return { rootDir, context: optionsContext(rootDir, input), options: config.options ?? {}, extensions };
};

export { loadStandards, findRoot, PRESETS, OWN_ROOT };
