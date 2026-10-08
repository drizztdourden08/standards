/* @layer tooling-scripts @kind test */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineExtension } from '../config/define.mjs';
import { checkReleaseNote, checkRepoNotes, noteBody, runReleaseNotes, writeDraft } from '../release-notes/index.mjs';
import { compareVersions, releaseVersionOf } from '../release-notes/release-version.mjs';
import { removeTempTrees, tempTree } from './temp-tree.mjs';

afterEach(() => {
  vi.restoreAllMocks();
  removeTempTrees();
});

const GOOD = `<!-- @layer docs @kind doc -->
# Atlas v1.2.0

The map opens where you left it, and two crashes on start are gone.

## View

- The map opens on the last place you looked at.
- Zoom keeps its level when the window is resized.

## Fixes

- The app no longer closes on start when a profile is empty.
`;

const messagesOf = (text, rules = {}) => checkReleaseNote(text, { version: '1.2.0', ...rules }).map((f) => `${f.line}: ${f.message}`);

describe('checkReleaseNote', () => {
  it('passes a note in the standard format', () => {
    expect(messagesOf(GOOD, { product: 'Atlas' })).toEqual([]);
  });

  it('holds the title to the file version and the configured product', () => {
    const text = GOOD.replace('# Atlas v1.2.0', '# Atlas v1.3.0');
    expect(messagesOf(text, { product: 'Globe' })).toEqual([
      '2: the title says v1.3.0, the file is v1.2.0',
      '2: the title names "Atlas"; the product is "Globe"',
    ]);
    expect(messagesOf('Release 1.2.0\n')[0]).toBe('1: the first line is the title, "# <Product> v1.2.0"');
  });

  it('wants one summary paragraph that reads as a sentence', () => {
    expect(messagesOf(GOOD.replace('The map opens where you left it, and two crashes on start are gone.\n', ''))).toEqual(['3: a one-paragraph summary follows the title']);
    expect(messagesOf(GOOD.replace('are gone.', 'are gone\n\nA second paragraph.'))).toEqual([
      '4: the summary does not end its sentence; finish it with a period',
      '6: the summary is one paragraph; move the rest under a ## section',
    ]);
  });

  it('allows the base sections, the configured ones, and puts Fixes last', () => {
    const extra = GOOD.replace('## View', '## Controllers');
    expect(messagesOf(extra)[0]).toMatch(/^6: "## Controllers" is not a release note section; use one of New, Changes/);
    expect(messagesOf(extra, { sections: ['Controllers'] })).toEqual([]);
    const fixesFirst = GOOD.replace('## View', '## Temp').replace('## Fixes', '## View').replace('## Temp', '## Fixes');
    expect(messagesOf(fixesFirst)).toEqual(['6: "## Fixes" comes last']);
    expect(messagesOf(`${GOOD}\n## Downloads\n\n- Setup.\n`)).toEqual([
      '11: "## Fixes" comes last',
      '15: "## Downloads" is added at release time; leave it out of the note',
    ]);
  });

  it('reports bullets that are not plain sentences for users', () => {
    const text = GOOD.replace('- Zoom keeps its level when the window is resized.', [
      '- fix: zoom level kept in a1b2c3d (#42)',
      '  - nested detail.',
      '* Star bullet.',
      '### A sub heading',
      '- Clicks on <b>Save</b> work again.',
    ].join('\n'));
    expect(messagesOf(text)).toEqual([
      '9: the bullet starts like a fragment; open it with a capital letter, as a sentence',
      '9: the bullet does not end its sentence; finish it with a period',
      '9: the bullet holds a commit hash; say what changed, not where',
      '9: the bullet holds an issue or pull request number; say what changed',
      '9: the bullet holds a commit prefix; write a sentence for the people who use it',
      '10: bullets stay one level deep; make it a bullet of its own',
      '11: bullets start with "- "',
      '12: only ## section headings belong in a note; fold this into its section',
      '13: the bullet holds raw HTML; the note is plain markdown',
    ]);
  });

  it('runs the writing gate and skips code', () => {
    const text = GOOD.replace('- Zoom keeps', '- A robust zoom keeps').replace('## Fixes', '```\nrobust code\n```\n\n## Fixes');
    expect(messagesOf(text)).toEqual([expect.stringMatching(/^9: "robust"/)]);
    expect(messagesOf(text, { words: { allow: ['robust'] } })).toEqual([]);
  });

  it('rejects a draft until its marker is gone', () => {
    expect(messagesOf(`<!-- release-notes: draft -->\n${GOOD}`)).toEqual(['1: still a draft: rewrite it for the people who use the release, then delete this marker']);
  });
});

const repo = (files) => tempTree({ 'package.json': { name: '@acme/atlas', version: '1.2.0' }, ...files });

describe('checkRepoNotes', () => {
  it('passes a repo that has no notes yet, and fails a named version without one', () => {
    const root = repo({});
    expect(checkRepoNotes({ rootDir: root }).findings).toEqual([]);
    expect(checkRepoNotes({ rootDir: root, version: 'v1.2.0' }).findings).toEqual([expect.stringMatching(/^release-notes\/v1\.2\.0\.md: missing\./)]);
  });

  it('wants the release version note once an older one exists, and checks the newer notes', () => {
    const root = repo({ 'release-notes/v1.1.0.md': 'old', 'release-notes/v1.3.0.md': GOOD });
    const { findings, checked } = checkRepoNotes({ rootDir: root });
    expect(checked).toEqual(['release-notes/v1.3.0.md']);
    expect(findings[0]).toMatch(/^release-notes\/v1\.2\.0\.md: missing\./);
    expect(findings[1]).toBe('release-notes/v1.3.0.md:2  the title says v1.2.0, the file is v1.3.0');
  });

  it('reads the product and the sections from standards.config.mjs and the facets', () => {
    const root = repo({
      'release-notes/v1.2.0.md': GOOD.replace('## View', '## Controllers'),
      'standards.config.mjs': "export default { options: { releaseNotes: { product: 'Globe' } }, extensions: [{ id: 'pads', releaseNotes: { sections: ['Controllers'] } }] };\n",
    });
    expect(checkRepoNotes({ rootDir: root }).findings).toEqual(['release-notes/v1.2.0.md:2  the title names "Atlas"; the product is "Globe"']);
  });
});

describe('the release version', () => {
  it('is the root version, else the one version the published packages share', () => {
    expect(releaseVersionOf(repo({}))).toBe('1.2.0');
    const mono = tempTree({
      'package.json': { name: 'mono', private: true, version: '0.1.0' },
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      'packages/a/package.json': { name: '@acme/a', version: '0.4.0' },
      'packages/b/package.json': { name: '@acme/b', version: '0.4.0' },
      'packages/c/package.json': { name: 'c', private: true, version: '9.0.0' },
    });
    expect(releaseVersionOf(mono)).toBe('0.4.0');
    expect(releaseVersionOf(mono, 'c')).toBe('9.0.0');
  });

  it('orders a pre-release before its release', () => {
    expect(['1.0.0', '1.0.0-beta.2', '0.9.0', '1.0.0-beta.10'].sort(compareVersions)).toEqual(['0.9.0', '1.0.0-beta.2', '1.0.0-beta.10', '1.0.0']);
  });
});

describe('drafts and bodies', () => {
  const CHANGELOG = `# @acme/atlas

## 1.3.0

### Minor Changes

- a1b2c3d: The map has a compass.
  It points north.

### Patch Changes

- Updated dependencies
- 9f8e7d6: Zoom no longer jumps.

## 1.2.0

### Patch Changes

- Older fix.
`;

  it('drafts the note of a version from every changelog, marked as a draft', () => {
    const root = tempTree({ 'package.json': { name: '@acme/atlas', version: '1.3.0' }, 'CHANGELOG.md': CHANGELOG });
    expect(writeDraft({ rootDir: root })).toEqual({ file: 'release-notes/v1.3.0.md', written: true });
    const text = readFileSync(join(root, 'release-notes/v1.3.0.md'), 'utf8');
    expect(text).toBe([
      '<!-- release-notes: draft -->',
      '# Atlas v1.3.0',
      '',
      'One paragraph for the people who use Atlas: what this release changes for them.',
      '',
      '## Changes',
      '',
      '- The map has a compass. It points north.',
      '',
      '## Fixes',
      '',
      '- Zoom no longer jumps.',
      '',
    ].join('\n'));
    expect(checkRepoNotes({ rootDir: root }).findings).toEqual([expect.stringContaining('still a draft')]);
    expect(writeDraft({ rootDir: root }).written).toBe(false);
  });

  it('prints a note without its comment lines', () => {
    const root = repo({ 'release-notes/v1.2.0.md': GOOD });
    expect(noteBody(root, '1.2.0')).toBe(`${GOOD.split('\n').slice(1).join('\n').trim()}\n`);
  });

  it('runs check from the command line', () => {
    const root = repo({ 'release-notes/v1.2.0.md': GOOD });
    const lines = [];
    vi.spyOn(console, 'log').mockImplementation((line) => lines.push(line));
    expect(runReleaseNotes({ rootDir: root, args: ['check'] })).toBe(0);
    expect(lines).toEqual(['release notes: release-notes/v1.2.0.md; 0 finding(s).']);
    expect(runReleaseNotes({ rootDir: root, args: ['check', '2.0.0'] })).toBe(1);
  });
});

describe('the releaseNotes facet', () => {
  it('takes sections and a product, and names a wrong key', () => {
    expect(defineExtension({ id: 'x', releaseNotes: { sections: ['Controllers'], product: 'Atlas' } }).releaseNotes.product).toBe('Atlas');
    expect(() => defineExtension({ id: 'x', releaseNotes: { section: [] } })).toThrow('unknown releaseNotes key section; the keys are sections, product');
    expect(() => defineExtension({ id: 'x', releaseNotes: { sections: 'View' } })).toThrow('releaseNotes.sections must be a string array');
  });
});
