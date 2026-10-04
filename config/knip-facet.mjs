/* @layer tooling-scripts @kind logic */
import { resolve } from 'node:path';
import { facetsOf } from './merge.mjs';

const ROOT_WORKSPACE = '.';
const asList = (value) => (value === undefined ? [] : [value].flat());
const extensionKey = (ext) => ext.replace(/^\.*/, '');

const composedCompilers = (facets) => {
  const byExtension = new Map();
  for (const [ext, compile] of facets.flatMap((facet) => Object.entries(facet.compilers ?? {}))) {
    const key = extensionKey(ext);
    byExtension.set(key, [...(byExtension.get(key) ?? []), compile]);
  }
  return Object.fromEntries([...byExtension].map(([key, steps]) => [key, (text, path) => steps.reduce((out, compile) => compile(out, path), text)]));
};

const mergedCompilers = (own, facets) => {
  const composed = composedCompilers(facets);
  if (!Object.keys(composed).length) return own;
  return { ...Object.fromEntries(Object.entries(own ?? {}).map(([ext, value]) => [extensionKey(ext), value])), ...composed };
};

const facetEntries = (facets, ctx) => facets.flatMap((facet) => (typeof facet.entry === 'function' ? facet.entry(ctx) : asList(facet.entry)));

const withEntries = (target, entries) => (entries.length ? { ...target, entry: [...new Set([...asList(target.entry), ...entries])] } : target);

const mergedWorkspaces = (workspaces, facets, rootDir) => Object.fromEntries(
  Object.entries(workspaces).map(([dir, workspace]) => [dir, workspace.entry === undefined ? workspace : withEntries(workspace, facetEntries(facets, { rootDir, packageDir: resolve(rootDir, dir) }))]),
);

const withFacetEntries = (config, facets, { rootDir, context }) => {
  const rooted = config.workspaces?.[ROOT_WORKSPACE] ? config : withEntries(config, facetEntries(facets, context));
  return config.workspaces ? { ...rooted, workspaces: mergedWorkspaces(config.workspaces, facets, rootDir) } : rooted;
};

/**
 * @param {Record<string, any>} config the repo knip.json plus git-ignored paths
 * @param {{ rootDir: string, context: { rootDir: string, packageDir?: string }, extensions: Record<string, any>[] }} loaded what loadStandards returns
 * @returns {Record<string, any>} config with the knip facets merged
 */
const withKnipFacets = (config, loaded) => {
  const facets = facetsOf(loaded.extensions, 'knip');
  if (!facets.length) return config;
  const compilers = mergedCompilers(config.compilers, facets);
  return withFacetEntries(compilers ? { ...config, compilers } : config, facets, loaded);
};

export { withKnipFacets };
