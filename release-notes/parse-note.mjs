/* @layer tooling-scripts @kind logic */
import { BULLET, COMMENT_LINE, FENCE, NESTED_BULLET, OTHER_BULLET, OTHER_HEADING, SECTION } from './release-notes.constants.mjs';

/**
 * @typedef {{ line: number, text: string, code: boolean }} NoteLine
 * @typedef {{ kind: 'bullet' | 'nested' | 'other-bullet' | 'heading' | 'paragraph' | 'code', line: number, text: string }} NoteBlock
 * @typedef {{ name: string, line: number, body: NoteLine[] }} NoteSection
 * @typedef {{ comments: NoteLine[], title: NoteLine | null, intro: NoteLine[], sections: NoteSection[] }} ParsedNote
 */

const lineAt = (lines, index, code = false) => ({ line: index + 1, text: lines[index], code });

/**
 * @param {string | null} fence the open fence, if any
 * @param {string} text
 * @returns {{ fence: string | null, code: boolean }}
 */
const nextFence = (fence, text) => {
  const open = text.match(FENCE);
  if (!open) return { fence, code: Boolean(fence) };
  if (!fence) return { fence: open[1], code: true };
  const closes = open[1][0] === fence[0] && open[1].length >= fence.length;
  return { fence: closes ? null : fence, code: true };
};

const headEnd = (lines) => {
  let index = 0;
  while (index < lines.length && (!lines[index].trim() || COMMENT_LINE.test(lines[index]))) index += 1;
  return index;
};

/**
 * @param {string} text the note
 * @returns {ParsedNote}
 */
const parseNote = (text) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = headEnd(lines);
  const comments = lines.slice(0, start).flatMap((line, index) => (line.trim() ? [lineAt(lines, index)] : []));
  const note = { comments, title: start < lines.length ? lineAt(lines, start) : null, intro: [], sections: [] };
  let fence = null;
  for (let index = start + 1; index < lines.length; index += 1) {
    const state = nextFence(fence, lines[index]);
    fence = state.fence;
    const section = !state.code && SECTION.exec(lines[index]);
    if (section) note.sections.push({ name: section[1], line: index + 1, body: [] });
    else (note.sections.at(-1)?.body ?? note.intro).push(lineAt(lines, index, state.code));
  }
  return note;
};

const kindOf = (text) => {
  if (BULLET.test(text)) return 'bullet';
  if (NESTED_BULLET.test(text)) return 'nested';
  if (OTHER_BULLET.test(text)) return 'other-bullet';
  if (OTHER_HEADING.test(text)) return 'heading';
  return 'paragraph';
};

const blockText = (kind, text) => (kind === 'bullet' ? text.slice(2).trim() : text.trim());

/**
 * @param {NoteLine[]} lines
 * @returns {NoteBlock[]} bullets joined to their continuations
 */
const blocksOf = (lines) => {
  const blocks = [];
  let current = null;
  for (const { line, text, code } of lines) {
    if (code || !text.trim()) {
      current = null;
      if (code && blocks.at(-1)?.kind !== 'code') blocks.push({ kind: 'code', line, text: '' });
      continue;
    }
    const kind = kindOf(text);
    if (kind === 'paragraph' && current) { current.text = `${current.text} ${text.trim()}`; continue; }
    current = { kind, line, text: blockText(kind, text) };
    blocks.push(current);
    if (kind === 'heading') current = null;
  }
  return blocks;
};

export { parseNote, blocksOf };
