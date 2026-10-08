/* @layer tooling-scripts @kind logic */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkReleaseNote } from './check-note.mjs';
import { noteRulesFor } from './note-rules.mjs';
import { NOTE_FILE, NOTES_DIR } from './release-notes.constants.mjs';
import { compareVersions, releaseVersionOf } from './release-version.mjs';

/**
 * @param {string} version
 * @returns {string} the note's path from the repo root
 */
const notePath = (version) => `${NOTES_DIR}/v${version.replace(/^v/, '')}.md`;

/**
 * @param {string} rootDir
 * @returns {string[]} every version with a note, oldest first
 */
const noteVersions = (rootDir) => {
  const dir = join(rootDir, NOTES_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => NOTE_FILE.exec(name)?.slice(1, 2) ?? []).sort(compareVersions);
};

const fileFindings = (rootDir, version, rules) => {
  const file = notePath(version);
  const text = readFileSync(join(rootDir, file), 'utf8');
  return checkReleaseNote(text, { ...rules, version }).map(({ line, message }) => `${file}:${line}  ${message}`);
};

/**
 * @param {string} rootDir
 * @param {string} version
 * @param {boolean} explicit the caller named the version, so its note must exist
 */
const missingFindings = (rootDir, version, explicit) => {
  const versions = noteVersions(rootDir);
  if (versions.includes(version)) return [];
  const started = versions.some((v) => compareVersions(v, version) <= 0);
  if (!explicit && !started) return [];
  return [`${notePath(version)}: missing. Every release has a note, written before the release (docs/release-notes.md in @drizztdourden08/standards has the format).`];
};

/**
 * @typedef {object} CheckInput
 * @property {string} rootDir
 * @property {string} [version] the version being released; else the repo's release version
 * @property {string} [product] the product the title must name
 * @property {string[]} [sections] sections allowed beside the configured ones
 */

/**
 * @param {CheckInput} input
 * @returns {{ version: string, findings: string[], checked: string[] }}
 */
const checkRepoNotes = ({ rootDir, version: given, product, sections }) => {
  const rules = noteRulesFor(rootDir, { product, sections });
  const version = (given ?? releaseVersionOf(rootDir, rules.packageName)).replace(/^v/, '');
  const checked = noteVersions(rootDir).filter((v) => compareVersions(v, version) >= 0);
  return {
    version,
    findings: [...missingFindings(rootDir, version, Boolean(given)), ...checked.flatMap((v) => fileFindings(rootDir, v, rules))],
    checked: checked.map(notePath),
  };
};

export { checkRepoNotes, notePath };
