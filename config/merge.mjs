/* @layer tooling-scripts @kind logic */
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
 * @param {{ id: string }[]} extensions
 * @param {string} name
 * @returns {Record<string, unknown>}
 */
const facetOptions = (extensions, name) => mergeOptions(...facetsOf(extensions, name).map((facet) => facet.options));

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
