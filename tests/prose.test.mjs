/* @layer tooling-scripts @kind test */
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runProse, readProseIgnore } from '../prose/index.mjs';
import { findSlop } from '../writing/index.mjs';
import { gitTree, tempTree, removeTempTrees } from './temp-tree.mjs';

const captured = () => {
  const lines = [];
  vi.spyOn(console, 'log').mockImplementation((line) => lines.push(line));
  return lines;
};

afterEach(() => {
  vi.restoreAllMocks();
  removeTempTrees();
});

describe('runProse', { tags: ['standard'] }, () => {
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
    expect(lines.at(-1)).toBe('brock prose: 1 file(s) outside eslint, stylelint and markdownlint scanned, 1 finding(s), 0 warning(s).');
    expect(lines[0]).toMatch(/^notes\.txt:1:9 {2}"robust": /);
  });

  it('skips a file listed in .proseignore with a why', () => {
    const root = tempTree({ 'LICENSE.txt': 'a robust licence\n', '.proseignore': 'LICENSE.txt   travels unchanged\n' });
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(0);
    expect(lines).toEqual(['standards prose: 0 file(s) outside eslint, stylelint and markdownlint scanned, 0 finding(s), 0 warning(s).']);
  });

  it('allows the words the config allows', () => {
    const root = tempTree({ 'notes.txt': 'A robust tool.\n', 'standards.config.mjs': 'export default { options: { allow: ["robust"] } };\n' });
    captured();
    expect(runProse({ rootDir: root })).toBe(0);
  });

  it('skips a tracked file that is deleted but not committed', () => {
    const root = gitTree({ 'gone.txt': 'plain\n', 'notes.txt': 'plain\n' });
    execFileSync('git', ['add', '-A'], { cwd: root, windowsHide: true });
    rmSync(join(root, 'gone.txt'));
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(0);
    expect(lines.at(-1)).toMatch(/1 file\(s\) outside/);
  });
});

describe('runProse ai in a translation file', { tags: ['standard'] }, () => {
  it('passes lower-case ai and prints a warning, exit 0, for upper-case AI in a foreign-locale file', () => {
    const root = tempTree({ 'src/i18n/locales/it.json': '{ "back": "torna ai menu", "tool": "usa la AI" }\n' });
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(0);
    expect(lines[0]).toMatch(/\(warning\)$/);
    expect(lines.at(-1)).toMatch(/0 finding\(s\), 1 warning\(s\)\.$/);
  });

  it('skips English word checks in a foreign-locale file and keeps the dash check', () => {
    const root = tempTree({ 'src/locales/it/cheats.json': '{ "light": "Le torce illuminate restano accese", "dash": "a \u2014 b" }\n' });
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(1);
    expect(lines.join('\n')).not.toMatch(/illuminate/);
    expect(lines.at(-1)).toMatch(/1 finding\(s\), 0 warning\(s\)\.$/);
  });

  it('fails for the same text in an English file', () => {
    const root = tempTree({ 'src/i18n/locales/en.json': '{ "back": "torna ai menu" }\n' });
    const lines = captured();
    expect(runProse({ rootDir: root })).toBe(1);
    expect(lines[0]).not.toMatch(/\(warning\)$/);
    expect(lines.at(-1)).toMatch(/1 finding\(s\), 0 warning\(s\)\.$/);
  });
});

describe('readProseIgnore', { tags: ['standard'] }, () => {
  it('refuses an entry without a why', () => {
    expect(readProseIgnore('LICENSE.txt\n').problems).toEqual(['line 1: "LICENSE.txt" has no why. Write "<glob>  <why this file is skipped>".']);
  });
});

describe('findSlop', { tags: ['standard'] }, () => {
  it('reports a banned word and leaves identifiers alone', () => {
    expect(findSlop('We frobnicate; frobnicateAll() stays.', { banned: ['frobnicate'] }).map((hit) => hit.match)).toEqual(['frobnicate']);
  });

  it('keeps the default allow list when none is given', () => {
    expect(findSlop('navigate the harness')).toEqual([]);
  });
});
