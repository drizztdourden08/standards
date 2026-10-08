/* @layer tooling-scripts @kind logic */
import { loadStandards } from '../config/load.mjs';
import { facetsOf, proseWords } from '../config/merge.mjs';

/**
 * @typedef {object} RepoNoteRules
 * @property {string[]} sections allowed beside the base ones
 * @property {string | undefined} product the configured product name, if any
 * @property {string | undefined} packageName the package whose version names the release, if set
 * @property {{ allow: string[], banned: string[] }} words
 */

/**
 * @param {string} rootDir
 * @param {{ product?: string, sections?: string[] }} [local] what the caller adds, such as a Brock app's product name
 * @returns {RepoNoteRules}
 */
const noteRulesFor = (rootDir, local = {}) => {
  const { extensions, options } = loadStandards({ rootDir });
  const own = options.releaseNotes ?? {};
  const layers = [...facetsOf(extensions, 'releaseNotes'), own, local];
  return {
    sections: [...new Set(layers.flatMap((layer) => layer.sections ?? []))],
    product: local.product ?? own.product ?? layers.map((layer) => layer.product).find(Boolean),
    packageName: own.package,
    words: proseWords(extensions, options),
  };
};

export { noteRulesFor };
