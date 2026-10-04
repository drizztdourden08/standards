/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runProse, readProseIgnore } from '../prose/index.mjs';
import { findSlop } from '../writing/index.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

const captured = () => {
  const lines = [];
  vi.spyOn(console, 'log').mockImplementation((line) => lines.push(line));
  return lines;
};

afterEach(() => {
  vi.restoreAllMocks();
  removeTempTrees();
});

describe('runProse', () => {
  it('skips every dot-folder when it walks a folder git does not know', () => {
    const root = tempTree({ '.tool/notes.txt': 'A robust tool.\n', 'app/.state/notes.txt': 'A robust tool.\n', 'notes.txt': 'A robust tool.\n' });
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(1);
    expect(lines.filter((line) => line.includes('"robust"'))).toEqual([expect.stringMatching(/^notes\.txt:1:3 /)]);
  });

  it('scans the text files the other linters skip and names the label', () => {
    const root = tempTree({ 'notes.txt': 'It is a robust tool.\n', 'a.ts': 'const robust = 1;\n' });
    const lines = captured();
    expect(runProse({ rootDir: root, label: 'brock prose' })).toBe(1);
    expect(lines.at(-1)).toBe('brock prose: 1 file(s) outside eslint, stylelint and markdownlint scanned, 1 finding(s).');
    expect(lines[0]).toMatch(/^notes\.txt:1:9 {2}"robust": /);
  });

  it('skips a file listed in .proseignore with a why', () => {
    const root = tempTree({ 'LICENSE.txt': 'a robust licence\n', '.proseignore': 'LICENSE.txt   travels unchanged\n' });
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(0);
    expect(lines).toEqual(['standards prose: 0 file(s) outside eslint, stylelint and markdownlint scanned, 0 finding(s).']);
  });

  it('allows the words the config allows', () => {
    const root = tempTree({ 'notes.txt': 'A robust tool.\n', 'standards.config.mjs': 'export default { options: { allow: ["robust"] } };\n' });
    captured();
    expect(runProse({ rootDir: root })).toBe(0);
  });
});

describe('readProseIgnore', () => {
  it('refuses an entry without a why', () => {
    expect(readProseIgnore('LICENSE.txt\n').problems).toEqual(['line 1: "LICENSE.txt" has no why. Write "<glob>  <why this file is skipped>".']);
  });
});

describe('findSlop', () => {
  it('reports a banned word and leaves identifiers alone', () => {
    expect(findSlop('We frobnicate; frobnicateAll() stays.', { banned: ['frobnicate'] }).map((hit) => hit.match)).toEqual(['frobnicate']);
  });

  it('keeps the default allow list when none is given', () => {
    expect(findSlop('navigate the harness')).toEqual([]);
  });
});
