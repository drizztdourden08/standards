/* @layer tooling-scripts @kind logic */
const FACETS = ['structure', 'eslint', 'stylelint', 'markdownlint', 'prose', 'knip'];
const META = ['id', 'description'];
const CONFIG_KEYS = ['presets', 'extensions', 'options', 'discover'];
const KNIP_KEYS = ['compilers', 'entry'];

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isStringList = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');

const compilerProblems = (compilers) => {
  if (compilers === undefined) return [];
  if (!isRecord(compilers)) return ['knip.compilers must map file extensions to functions'];
  return Object.entries(compilers).filter(([, compile]) => typeof compile !== 'function').map(([ext]) => `knip.compilers.${ext} must be a function (text, path) => string`);
};

const entryProblems = (entry) => (entry === undefined || typeof entry === 'function' || isStringList(entry) ? [] : ['knip.entry must be a string array or a function (ctx) => string[]']);

const knipProblems = (knip) => {
  if (knip === undefined) return [];
  if (!isRecord(knip)) return ['knip must be an object'];
  const unknown = Object.keys(knip).filter((key) => !KNIP_KEYS.includes(key));
  return [
    ...(unknown.length ? [`unknown knip key ${unknown.join(', ')}; the keys are ${KNIP_KEYS.join(', ')}`] : []),
    ...compilerProblems(knip.compilers),
    ...entryProblems(knip.entry),
  ];
};

/**
 * @param {Record<string, unknown>} extension
 * @returns {Record<string, unknown>}
 */
const defineExtension = (extension) => {
  if (typeof extension?.id !== 'string' || !extension.id.trim()) throw new Error('defineExtension: an extension needs a non-empty id');
  const unknown = Object.keys(extension).filter((key) => !META.includes(key) && !FACETS.includes(key));
  if (unknown.length) throw new Error(`defineExtension(${extension.id}): unknown key ${unknown.join(', ')}; the facets are ${FACETS.join(', ')}`);
  const problems = knipProblems(extension.knip);
  if (problems.length) throw new Error(`defineExtension(${extension.id}): ${problems.join('; ')}`);
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
