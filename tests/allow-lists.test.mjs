/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it } from 'vitest';
import { standardsEslint } from '../eslint/index.mjs';
import { HEADER, lint } from './lint-text.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

afterEach(removeTempTrees);

const WRITING = /^local\/(?:no-em-dash|no-smart-punctuation|no-slop-prose|no-tool-brand-words):/;
const DASH = String.fromCodePoint(0x2014);

const writingHits = async (file, code) => {
  const root = tempTree({ 'package.json': { name: 'x' } });
  return (await lint(root, file, `${HEADER}${code}\n`)).filter((m) => WRITING.test(m));
};

describe('local/no-slop-identifiers allow list', () => {
  const declare = (name) => `${HEADER}const ${name} = 1;\n\nexport { ${name} };\n`;
  const identifierHits = async (name, options) => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    return (await lint(root, 'a.mjs', declare(name), options)).filter((m) => m.startsWith('local/no-slop-identifiers'));
  };

  it('reports a product name and a stored key without an entry', async () => {
    for (const name of ['AdvancedEdition', 'layoutV2', 'autoAI']) expect(await identifierHits(name), name).toHaveLength(1);
  });

  it('passes a name the allow option lists', async () => {
    const allow = ['AdvancedEdition', 'layoutV2', 'autoAI'];
    for (const name of allow) expect(await identifierHits(name, { allow }), name).toEqual([]);
  });

  it('reads the allow list of a prose facet', async () => {
    const extensions = [{ id: 'names', prose: { allow: ['layoutV2'] } }];
    expect(await identifierHits('layoutV2', { extensions })).toEqual([]);
  });

  it('matches the whole name in its exact case', async () => {
    expect(await identifierHits('layoutV2', { allow: ['layoutv2'] })).toHaveLength(1);
    expect(await identifierHits('AdvancedSearch', { allow: ['Advanced', 'AdvancedEdition'] })).toHaveLength(1);
  });
});

describe('expected values in test assertions', () => {
  it('passes the text a matcher expects in a test file', async () => {
    const code = [
      "expect(toast()).toBe('File saved!');",
      "expect(toast()).not.toBe('Not saved!');",
      `expect(title()).toEqual(['Done!', { text: 'Saved${DASH}twice' }]);`,
      "expect(show).toHaveBeenCalledWith(expect.stringContaining('Saved!'));",
      'await expect(save()).rejects.toThrow(`Disk full! ${name} kept`);',
    ].join('\n');
    expect(await writingHits('src/toast.test.mjs', code)).toEqual([]);
    expect(await writingHits('src/toast.spec.ts', code)).toEqual([]);
  });

  it('reports the same text outside a test file', async () => {
    expect(await writingHits('src/toast.mjs', "const message = 'File saved!';\nexpect(toast()).toBe('File saved!');\n\nexport { message };")).toHaveLength(2);
  });

  it('reports test text that is not an expected value', async () => {
    const code = "const input = 'File saved!';\nexpect('Sent twice!').toBe(input);\nit('saves the file!', () => {});";
    expect(await writingHits('src/toast.test.mjs', code)).toHaveLength(3);
  });

  it('keeps tool and vendor names banned in an expected value', async () => {
    expect(await writingHits('src/toast.test.mjs', "expect(reply()).toBe('Ask the chatbot');")).toEqual([
      'local/no-tool-brand-words: "chatbot": These projects do not name this kind of tool or its vendor. Say what the code does, or delete the word.',
    ]);
  });
});

describe('verbatim text', () => {
  const DIALOGUE = 'src/dialogue.mjs';
  const VERBATIM = { verbatimText: [{ files: [DIALOGUE], why: 'the dialogue table of a game, reproduced as the game shows it' }] };
  const hits = async (file, lines, options = VERBATIM) => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    return (await lint(root, file, `${HEADER}${lines.join('\n')}\n`, options)).filter((m) => WRITING.test(m));
  };
  const TABLE = [`const LINES = ['File saved!', \`Saved${DASH}twice\`, { greeting: 'Welcome back!' }];`, '', 'export { LINES };'];

  it('skips the string values of a listed file', async () => {
    expect(await hits(DIALOGUE, TABLE)).toEqual([]);
  });

  it('reads the same strings in a file the list does not name', async () => {
    expect(await hits('src/menu.mjs', TABLE)).toHaveLength(3);
    expect(await hits(DIALOGUE, TABLE, {})).toHaveLength(3);
  });

  it('keeps tool and vendor names banned in a listed file', async () => {
    expect(await hits(DIALOGUE, ["const LINES = ['Ask the chatbot'];", '', 'export { LINES };'])).toEqual([
      'local/no-tool-brand-words: "chatbot": These projects do not name this kind of tool or its vendor. Say what the code does, or delete the word.',
    ]);
  });

  it('still reads the comments of a listed file', async () => {
    expect(await hits(DIALOGUE, [...TABLE, '// File saved! Then closed.'])).toHaveLength(1);
  });

  it('refuses an entry without a why', () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    expect(() => standardsEslint({ rootDir: root, typed: false, verbatimText: [{ files: [DIALOGUE], why: ' ' }] })).toThrow('verbatimText exception for src/dialogue.mjs needs a why');
  });

  it('takes skipStringValues on the dash, punctuation and prose rules, not on the vendor-name rule', async () => {
    const withOption = (rule) => ({ extra: [{ files: ['**/*.mjs'], rules: { [rule]: ['error', { skipStringValues: true }] } }] });
    expect(await hits('src/menu.mjs', TABLE, withOption('local/no-em-dash'))).toHaveLength(2);
    await expect(hits('src/menu.mjs', TABLE, withOption('local/no-tool-brand-words'))).rejects.toThrow(/skipStringValues|additional properties/);
  });
});
