/* @layer tooling-scripts @kind logic */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { checkRepoNotes, notePath } from './check-repo.mjs';
import { checkReleaseNote } from './check-note.mjs';
import { draftReleaseNote } from './draft-note.mjs';
import { noteRulesFor } from './note-rules.mjs';
import { COMMENT_LINE, DRAFT_MARKER, NOTES_DIR, SECTIONS } from './release-notes.constants.mjs';
import { productOf, releaseVersionOf } from './release-version.mjs';

const VERSION_COMMAND_ENV = 'STANDARDS_VERSION_COMMAND';
const DEFAULT_VERSION_COMMAND = 'pnpm changeset version';

const USAGE = `standards release-notes <check | draft | version | body | current | help> [version]

  check [version]   the note of the version being released (else the repo's release version) and every newer
                    note; a named version must have a note, and so must the release version once the repo has one
  draft [version]   write ${NOTES_DIR}/v<version>.md from the CHANGELOG entries of that version, marked as a draft
                    the check rejects until someone rewrites it; an existing note is kept
  version           run ${VERSION_COMMAND_ENV} (else ${DEFAULT_VERSION_COMMAND}), then draft the note of the new version
  body <version>    print the note without its comment lines, the body of a GitHub release
  current           print the version the repo releases: the root package, else the one its published packages share
  help              this text`;

/**
 * @param {{ rootDir: string, version?: string }} input
 * @returns {{ file: string, written: boolean }}
 */
const writeDraft = ({ rootDir, version: given }) => {
  const rules = noteRulesFor(rootDir);
  const version = (given ?? releaseVersionOf(rootDir, rules.packageName)).replace(/^v/, '');
  const file = notePath(version);
  const target = join(rootDir, file);
  if (existsSync(target)) return { file, written: false };
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, draftReleaseNote({ rootDir, version, product: rules.product ?? productOf(rootDir) }), 'utf8');
  return { file, written: true };
};

/**
 * @param {string} rootDir
 * @param {string} version
 * @returns {string} the note without its comment lines
 */
const noteBody = (rootDir, version) => {
  const file = join(rootDir, notePath(version));
  if (!existsSync(file)) throw new Error(`${notePath(version)} is missing`);
  return `${readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n').filter((line) => !COMMENT_LINE.test(line)).join('\n').trim()}\n`;
};

const runCheck = (rootDir, version) => {
  const { version: checkedVersion, findings, checked } = checkRepoNotes({ rootDir, version });
  for (const finding of findings) console.log(finding);
  const scope = checked.length ? checked.join(', ') : `no note at or above v${checkedVersion} yet`;
  console.log(`release notes: ${scope}; ${findings.length} finding(s).`);
  return findings.length ? 1 : 0;
};

const runDraft = (rootDir, version) => {
  const { file, written } = writeDraft({ rootDir, version });
  console.log(written ? `release notes: drafted ${file}; rewrite it for users and delete the draft marker.` : `release notes: ${file} exists, kept.`);
  return 0;
};

const runVersion = (rootDir) => {
  const before = releaseVersionOf(rootDir, noteRulesFor(rootDir).packageName);
  execSync(process.env[VERSION_COMMAND_ENV] || DEFAULT_VERSION_COMMAND, { cwd: rootDir, stdio: 'inherit' });
  const after = releaseVersionOf(rootDir, noteRulesFor(rootDir).packageName);
  if (after === before) { console.log(`release notes: still v${after}, nothing to draft.`); return 0; }
  return runDraft(rootDir, after);
};

const printBody = (rootDir, version) => {
  if (!version) throw new Error('release-notes body needs a version');
  process.stdout.write(noteBody(rootDir, version.replace(/^v/, '')));
  return 0;
};

const printCurrent = (rootDir) => {
  console.log(releaseVersionOf(rootDir, noteRulesFor(rootDir).packageName));
  return 0;
};

const COMMANDS = {
  check: runCheck,
  draft: runDraft,
  version: runVersion,
  body: printBody,
  current: printCurrent,
  help: () => { console.log(USAGE); return 0; },
};

/**
 * @param {{ rootDir: string, args: string[] }} ctx
 * @returns {number} exit code
 */
const runReleaseNotes = ({ rootDir, args }) => {
  const [command, version] = args;
  const run = COMMANDS[command];
  if (run) return run(rootDir, version);
  console.log(USAGE);
  return 1;
};

export { runReleaseNotes, checkReleaseNote, checkRepoNotes, draftReleaseNote, writeDraft, noteBody, releaseVersionOf, SECTIONS, DRAFT_MARKER, NOTES_DIR };
