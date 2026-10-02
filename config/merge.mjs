/* @layer tooling-scripts @kind logic */
import { findRoot } from './load.mjs';

const REPLACED = new Set(['rawControls', 'consoleGlobs']);

const isPlainObject = (value) => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

const mergeValue = (key, current, next) => {
  if (next === undefined) return current;
  if (Array.isArray(current) && Array.isArray(next) && !REPLACED.has(key)) return [...new Set([...current, ...next])];
  if (isPlainObject(current) && isPlainObject(next)) return mergeOptions(current, next);
  return next;
};

/**
 * @param {...(Record<string, unknown> | undefined)} layers
 * @returns {Record<string, unknown>} later layers win; arrays join
 */
const mergeOptions = (...layers) => {
  const merged = {};
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer ?? {})) merged[key] = mergeValue(key, merged[key], value);
  }
  return merged;
};

/**
 * @param {{ id: string }[]} extensions
 * @param {string} name
 * @returns {Record<string, any>[]}
 */
const facetsOf = (extensions, name) => extensions.map((extension) => extension[name]).filter(Boolean);

/**
 * @param {unknown} options an object, or a function of the context
 * @param {{ rootDir: string, packageDir?: string }} ctx
 * @returns {Record<string, unknown> | undefined}
 */
const optionsFor = (options, ctx) => (typeof options === 'function' ? options(ctx) : options);

/**
 * @param {{ id: string }[]} extensions
 * @param {string} name
 * @param {{ rootDir: string, packageDir?: string }} [ctx] the context of an options function
 * @returns {Record<string, unknown>}
 */
const facetOptions = (extensions, name, ctx = { rootDir: findRoot() }) => mergeOptions(...facetsOf(extensions, name).map((facet) => optionsFor(facet.options, ctx)));

/**
 * @param {{ id: string }[]} extensions
 * @param {Record<string, any>} config
 * @param {{ allow?: string[], banned?: string[] }} [local]
 * @returns {{ allow: string[], banned: string[] }}
 */
const proseWords = (extensions, config, local = {}) => {
  const facets = [...facetsOf(extensions, 'prose'), config, config.prose ?? {}, local];
  return {
    allow: [...new Set(facets.flatMap((facet) => facet.allow ?? []))],
    banned: [...new Set(facets.flatMap((facet) => facet.banned ?? []))],
  };
};

export { mergeOptions, facetsOf, facetOptions, proseWords };
