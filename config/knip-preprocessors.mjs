/* @layer tooling-scripts @kind logic */
import { facetsOf } from './merge.mjs';

/**
 * @param {{ extensions: Record<string, any>[] }} loaded what loadStandards returns
 * @returns {string[]} the preprocessor modules, once each
 */
const knipPreprocessors = (loaded) => [...new Set(facetsOf(loaded.extensions, 'knip').flatMap((facet) => facet.preprocessors ?? []))];

export { knipPreprocessors };
