/* @layer tooling-scripts @kind constants */
const NOTES_DIR = 'release-notes';
const NOTE_FILE = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.md$/;
const DRAFT_MARKER = '<!-- release-notes: draft -->';

const SECTIONS = Object.freeze(['New', 'Changes', 'View', 'Settings', 'Around the app', 'Platforms', 'Under the hood', 'Upgrading', 'Fixes']);
const LAST_SECTION = 'Fixes';
const RESERVED_SECTIONS = Object.freeze(['Downloads']);

const TITLE = /^# (.+) v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\s*$/;
const SECTION = /^## (.+?)\s*$/;
const OTHER_HEADING = /^#{1,6}\s/;
const BULLET = /^- \S/;
const OTHER_BULLET = /^\s*(?:[*+]|\d+[.)])\s+\S/;
const NESTED_BULLET = /^\s+(?:[-*+]|\d+[.)])\s+\S/;
const COMMENT_LINE = /^\s*<!--.*-->\s*$/;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

const SENTENCE_START = /^[\p{Lu}\d`"'*[(]/u;
const SENTENCE_END = /[.!?][)"'*`\]]*$/;

const RESIDUE = Object.freeze([
  { re: /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/, why: 'a commit hash; say what changed, not where' },
  { re: /(?:^|[\s(])#\d+\b/, why: 'an issue or pull request number; say what changed' },
  { re: /^(?:feat|fix|chore|refactor|docs|tests?|perf|build|ci|style)(?:\([^)]*\))?!?:\s/i, why: 'a commit prefix; write a sentence for the people who use it' },
  { re: /\b(?:Major|Minor|Patch) Changes\b/, why: 'a changelog heading; group the bullets under the note sections' },
  { re: /<\/?[A-Za-z][^>]*>/, why: 'raw HTML; the note is plain markdown' },
]);

export {
  NOTES_DIR, NOTE_FILE, DRAFT_MARKER, SECTIONS, LAST_SECTION, RESERVED_SECTIONS, TITLE, SECTION, OTHER_HEADING,
  BULLET, OTHER_BULLET, NESTED_BULLET, COMMENT_LINE, FENCE, SENTENCE_START, SENTENCE_END, RESIDUE,
};
