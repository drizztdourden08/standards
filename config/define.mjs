/* @layer tooling-scripts @kind logic */
const FACETS = ['structure', 'eslint', 'stylelint', 'markdownlint', 'prose'];
const META = ['id', 'description'];
const CONFIG_KEYS = ['presets', 'extensions', 'options', 'discover'];

/**
 * @param {Record<string, unknown>} extension
 * @returns {Record<string, unknown>}
 */
const defineExtension = (extension) => {
  if (typeof extension?.id !== 'string' || !extension.id.trim()) throw new Error('defineExtension: an extension needs a non-empty id');
  const unknown = Object.keys(extension).filter((key) => !META.includes(key) && !FACETS.includes(key));
  if (unknown.length) throw new Error(`defineExtension(${extension.id}): unknown key ${unknown.join(', ')}; the facets are ${FACETS.join(', ')}`);
  return extension;
};

/**
 * @param {Record<string, unknown>} config
 * @returns {Record<string, unknown>}
 */
const defineStandards = (config) => {
  const unknown = Object.keys(config ?? {}).filter((key) => !CONFIG_KEYS.includes(key));
  if (unknown.length) throw new Error(`defineStandards: unknown key ${unknown.join(', ')}; the keys are ${CONFIG_KEYS.join(', ')}`);
  return config;
};

export { defineExtension, defineStandards, FACETS };
