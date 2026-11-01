/* @layer tooling-scripts @kind logic */
import { facetsOf } from './merge.mjs';

/**
 * @param {{ extensions: Record<string, any>[] }} loaded what loadStandards returns
 * @returns {string[]} the preprocessor modules of every extension, once each, in load order
 */
const knipPreprocessors = (loaded) => [...new Set(facetsOf(loaded.extensions, 'knip').flatMap((facet) => facet.preprocessors ?? []))];

export { knipPreprocessors };
