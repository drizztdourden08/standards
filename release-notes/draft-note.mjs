/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceDirs } from '../structure/workspace.mjs';
import { DRAFT_MARKER } from './release-notes.constants.mjs';

const CHANGESET_SECTIONS = { 'Major Changes': 'Changes', 'Minor Changes': 'Changes', 'Patch Changes': 'Fixes' };
const HASH_PREFIX = /^[0-9a-f]{7,40}: /;
const DEPENDENCY_BUMP = /^Updated dependencies/;

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {string} changelog a CHANGELOG.md
 * @param {string} version
 * @returns {string} the lines under "## <version>", up to the next version
 */
const entryOf = (changelog, version) => {
  const match = new RegExp(`^## ${escapeRe(version)}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(changelog.replace(/\r\n/g, '\n'));
  return match ? match[1] : '';
};

const pushBullet = (bullets, section, text) => {
  const clean = text.replace(HASH_PREFIX, '').trim();
  if (section && clean && !DEPENDENCY_BUMP.test(clean)) bullets.push({ section, text: clean });
};

const readLine = (state, line) => {
  const heading = /^### (.+?)\s*$/.exec(line);
  const opens = Boolean(heading) || /^- /.test(line);
  if (opens) pushBullet(state.bullets, state.section, state.current ?? '');
  if (heading) {
    state.current = null;
    state.section = CHANGESET_SECTIONS[heading[1]] ?? null;
  } else if (opens) state.current = line.slice(2);
  else if (state.current !== null && /^\s+\S/.test(line)) state.current = `${state.current} ${line.trim()}`;
};

/**
 * @param {string} entry
 * @returns {{ section: string, text: string }[]} each bullet with its note section
 */
const bulletsOf = (entry) => {
  const state = { bullets: [], section: null, current: null };
  for (const line of entry.split('\n')) readLine(state, line);
  pushBullet(state.bullets, state.section, state.current ?? '');
  return state.bullets;
};

const changelogsOf = (rootDir) => [rootDir, ...workspaceDirs(rootDir).dirs]
  .map((dir) => join(dir, 'CHANGELOG.md'))
  .filter((file) => existsSync(file))
  .map((file) => readFileSync(file, 'utf8'));

const sectionBlock = (name, bullets) => (bullets.length ? [`## ${name}`, '', ...bullets.map((text) => `- ${text}`), ''] : []);

/**
 * @param {{ rootDir: string, version: string, product: string }} input
 * @returns {string} the draft note of that version
 */
const draftReleaseNote = ({ rootDir, version, product }) => {
  const bullets = changelogsOf(rootDir).flatMap((changelog) => bulletsOf(entryOf(changelog, version)));
  const unique = (section) => [...new Set(bullets.filter((b) => b.section === section).map((b) => b.text))];
  const changes = unique('Changes');
  const fixes = unique('Fixes');
  return [
    DRAFT_MARKER,
    `# ${product} v${version}`,
    '',
    `One paragraph for the people who use ${product}: what this release changes for them.`,
    '',
    ...sectionBlock('Changes', changes.length || fixes.length ? changes : ['Describe each change in a sentence a user would understand.']),
    ...sectionBlock('Fixes', fixes),
  ].join('\n');
};

export { draftReleaseNote };
