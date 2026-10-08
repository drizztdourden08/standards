/* @layer tooling-scripts @kind logic */
import { blocksOf, parseNote } from './parse-note.mjs';
import { DRAFT_MARKER, LAST_SECTION, RESERVED_SECTIONS, SECTIONS, TITLE } from './release-notes.constants.mjs';
import { sentenceFindings, writingFindings } from './sentence-findings.mjs';

/**
 * @typedef {{ line: number, message: string }} Finding
 * @typedef {object} NoteRules
 * @property {string} version the version the file name gives
 * @property {string} [product] the product the title must name; any name when left out
 * @property {string[]} [sections] ## sections allowed beside SECTIONS
 * @property {{ allow?: string[], banned?: string[] }} [words] the repo's writing gate words
 */

const BLOCK_PROBLEMS = {
  heading: 'only ## section headings belong in a note; fold this into its section',
  nested: 'bullets stay one level deep; make it a bullet of its own',
  'other-bullet': 'bullets start with "- "',
};

const draftFindings = (comments) => comments
  .filter(({ text }) => text.trim() === DRAFT_MARKER)
  .map(({ line }) => ({ line, message: 'still a draft: rewrite it for the people who use the release, then delete this marker' }));

/**
 * @param {{ line: number, text: string } | null} title
 * @param {NoteRules} rules
 * @returns {Finding[]}
 */
const titleFindings = (title, { version, product }) => {
  const match = title && TITLE.exec(title.text);
  const expected = `# ${product ?? '<Product>'} v${version}`;
  if (!match) return [{ line: title?.line ?? 1, message: `the first line is the title, "${expected}"` }];
  const findings = [];
  if (match[2] !== version) findings.push({ line: title.line, message: `the title says v${match[2]}, the file is v${version}` });
  if (product && match[1] !== product) findings.push({ line: title.line, message: `the title names "${match[1]}"; the product is "${product}"` });
  return findings;
};

const introFindings = (intro, titleLine) => {
  const blocks = blocksOf(intro);
  const paragraphs = blocks.filter((block) => block.kind === 'paragraph');
  const line = blocks[0]?.line ?? titleLine + 1;
  if (!paragraphs.length) return [{ line, message: 'a one-paragraph summary follows the title' }];
  const findings = blocks.filter((block) => block.kind !== 'paragraph')
    .map((block) => ({ line: block.line, message: 'the summary is one paragraph; lists and headings go under a ## section' }));
  if (paragraphs.length > 1) findings.push({ line: paragraphs[1].line, message: 'the summary is one paragraph; move the rest under a ## section' });
  return [...findings, ...sentenceFindings(paragraphs[0], 'the summary')];
};

const blockFindings = (block) => {
  if (block.kind === 'code') return [];
  if (BLOCK_PROBLEMS[block.kind]) return [{ line: block.line, message: BLOCK_PROBLEMS[block.kind] }];
  return sentenceFindings(block, block.kind === 'bullet' ? 'the bullet' : 'the paragraph');
};

const sectionNameFindings = (section, index, { sections, seen, count }) => {
  const { name, line } = section;
  if (RESERVED_SECTIONS.includes(name)) return [{ line, message: `"## ${name}" is added at release time; leave it out of the note` }];
  if (!sections.includes(name)) return [{ line, message: `"## ${name}" is not a release note section; use one of ${sections.join(', ')}` }];
  if (seen.has(name)) return [{ line, message: `"## ${name}" appears twice; keep one` }];
  seen.add(name);
  return name === LAST_SECTION && index < count - 1 ? [{ line, message: `"## ${LAST_SECTION}" comes last` }] : [];
};

const sectionFindings = (parsed, allowed, titleLine) => {
  if (!parsed.length) return [{ line: titleLine + 1, message: 'a note holds at least one ## section of bullets' }];
  const state = { sections: allowed, seen: new Set(), count: parsed.length };
  return parsed.flatMap((section, index) => {
    const blocks = blocksOf(section.body);
    const empty = blocks.some((block) => block.kind === 'bullet') ? [] : [{ line: section.line, message: `"## ${section.name}" has no bullets` }];
    return [...sectionNameFindings(section, index, state), ...empty, ...blocks.flatMap(blockFindings)];
  });
};

const allLines = (note) => [note.title, ...note.intro, ...note.sections.flatMap((section) => [{ line: section.line, text: section.name, code: false }, ...section.body])].filter(Boolean);

/**
 * @param {string} text the note
 * @param {NoteRules} rules
 * @returns {Finding[]} sorted by line
 */
const checkReleaseNote = (text, rules) => {
  const note = parseNote(text);
  const titleLine = note.title?.line ?? 1;
  return [
    ...draftFindings(note.comments),
    ...titleFindings(note.title, rules),
    ...introFindings(note.intro, titleLine),
    ...sectionFindings(note.sections, [...new Set([...SECTIONS, ...(rules.sections ?? [])])], titleLine),
    ...writingFindings(allLines(note), rules.words),
  ].sort((a, b) => a.line - b.line);
};

export { checkReleaseNote };
