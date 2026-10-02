/* @layer tooling-scripts @kind logic */
import { defineExtension, defineStandards, FACETS } from './config/define.mjs';
import { loadStandards, findRoot, PRESETS } from './config/load.mjs';
import { discoverExtensions } from './config/discover.mjs';
import { mergeOptions, facetOptions, facetsOf, proseWords } from './config/merge.mjs';

export { defineExtension, defineStandards, FACETS, loadStandards, findRoot, PRESETS, discoverExtensions, mergeOptions, facetOptions, facetsOf, proseWords };
