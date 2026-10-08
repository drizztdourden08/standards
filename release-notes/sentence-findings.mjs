/* @layer tooling-scripts @kind logic */
import { DEFAULT_ALLOW, findSlop } from '../writing/slop-patterns.mjs';
import { RESIDUE, SENTENCE_END, SENTENCE_START } from './release-notes.constants.mjs';

const INLINE_CODE = /`+[^`]*`+/g;
const LINK_TARGET = /\]\([^)]*\)/g;
const blank = (match) => ' '.repeat(match.length);

/**
 * @param {string} text
 * @returns {string} the text without code spans or link targets
 */
const proseOf = (text) => text.replace(INLINE_CODE, blank).replace(LINK_TARGET, (match) => `]${blank(match.slice(1))}`);

/**
 * @param {{ line: number, text: string }} block a bullet or a paragraph
 * @param {string} what how the finding names it
 * @returns {{ line: number, message: string }[]}
 */
const sentenceFindings = ({ line, text }, what) => {
  const findings = [];
  if (!SENTENCE_START.test(text)) findings.push({ line, message: `${what} starts like a fragment; open it with a capital letter, as a sentence` });
  if (!SENTENCE_END.test(text)) findings.push({ line, message: `${what} does not end its sentence; finish it with a period` });
  const prose = proseOf(text);
  for (const { re, why } of RESIDUE) if (re.test(prose)) findings.push({ line, message: `${what} holds ${why}` });
  return findings;
};

/**
 * @param {{ line: number, text: string, code: boolean }[]} lines every line of the note
 * @param {{ allow?: string[], banned?: string[] }} words the repo's writing gate words
 * @returns {{ line: number, message: string }[]}
 */
const writingFindings = (lines, words = {}) => {
  const allow = words.allow?.length ? [...DEFAULT_ALLOW, ...words.allow] : DEFAULT_ALLOW;
  return lines
    .filter(({ code }) => !code)
    .flatMap(({ line, text }) => findSlop(proseOf(text), { allow, banned: words.banned }).map((hit) => ({ line, message: hit.message })));
};

export { sentenceFindings, writingFindings };
