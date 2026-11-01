/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it } from 'vitest';
import { HEADER, lint } from './lint-text.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

afterEach(removeTempTrees);

const tagMessages = async (body, options, file = 'a.test.mjs') => {
  const root = tempTree({ 'package.json': { name: 'x' } });
  const messages = await lint(root, file, `${HEADER}import { describe, it } from 'vitest';\n\n${body}\n`, options);
  return messages.filter((message) => message.startsWith('local/test-has-one-tag'));
};

const src = (...lines) => lines.join('\n');

describe('local/test-has-one-tag (K1 business logic)', { tags: ['critical'] }, () => {
  it('passes a tag on the test, an array tag, and a tag on the describe', async () => {
    const body = [
      "it('a', { tags: 'critical' }, () => {});",
      "it('b', { tags: ['standard'] }, () => {});",
      "describe('c', { tags: ['e2e'] }, () => {",
      "  it('d', () => {});",
      "  describe('nested', () => {",
      "    it('e', () => {});",
      '  });',
      '});',
    ].join('\n');
    expect(await tagMessages(body)).toEqual([]);
  });

  it('reports a test with no tag, also inside an untagged describe', async () => {
    const messages = await tagMessages("describe('c', () => {\n  it('d', () => {});\n});\nit.skip('e', () => {});");
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('exactly one tag');
  });

  it('reports two tags on one test, and one on the test with another on its describe', async () => {
    const messages = await tagMessages("it('a', { tags: ['critical', 'e2e'] }, () => {});\ndescribe('c', { tags: 'standard' }, () => {\n  it('d', { tags: 'critical' }, () => {});\n});");
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('2 (critical, e2e)');
    expect(messages[1]).toContain('2 (standard, critical)');
  });

  it('reports an unknown tag', async () => {
    const messages = await tagMessages("it('a', { tags: ['fast'] }, () => {});");
    expect(messages).toContain('local/test-has-one-tag: Unknown tag "fast". The tags are critical, standard, e2e.');
  });

  it('does not read a file that is not a test file', async () => {
    const root = tempTree({ 'package.json': { name: 'x' } });
    const messages = await lint(root, 'a.mjs', `${HEADER}const it = (name) => name;\n\nit('a', 1);\n`);
    expect(messages.filter((message) => message.startsWith('local/test-has-one-tag'))).toEqual([]);
  });
});

describe('local/test-has-one-tag on Playwright and e2e specs (K1 business logic)', { tags: ['critical'] }, () => {
  it('reads the Playwright tag form on a test and on test.describe', async () => {
    const body = [
      "it('a', { tag: '@critical' }, () => {});",
      "it('b', { tag: ['@standard'] }, () => {});",
      "describe.serial('c', { tag: ['@e2e'] }, () => {",
      "  it('d', () => {});",
      '});',
    ].join('\n');
    expect(await tagMessages(body)).toEqual([]);
    const group = src("describe('c', { tag: '@e2e' }, () => {", "  it('d', () => {});", '});');
    expect(await tagMessages(group)).toEqual([]);
    const browser = src("test.describe('c', { tag: '@e2e' }, () => {", "  test('d', async () => {});", "  test.step('e', async () => {});", '});', "test('f', async () => {});");
    expect(await tagMessages(browser)).toHaveLength(1);
  });

  it('reports a Playwright tag without the at sign, an unknown one, and two tags', async () => {
    const messages = await tagMessages(src("it('a', { tag: 'critical' }, () => {});", "it('b', { tag: '@fast' }, () => {});", "it('c', { tag: ['@critical', '@e2e'] }, () => {});"));
    expect(messages).toContain('local/test-has-one-tag: Unknown tag "critical". The tags are @critical, @standard, @e2e.');
    expect(messages).toContain('local/test-has-one-tag: Unknown tag "@fast". The tags are @critical, @standard, @e2e.');
    expect(messages.some((message) => message.includes('2 (@critical, @e2e)'))).toBe(true);
  });

  it('counts the vitest form and the Playwright form on one test as two tags', async () => {
    const messages = await tagMessages("it('a', { tags: ['critical'], tag: '@critical' }, () => {});");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('2 (critical, @critical)');
  });

  it('ignores a skip annotation call inside a Playwright test', async () => {
    expect(await tagMessages(src("it.skip(true, 'not on this browser');", "it.skip(() => true, 'later');", "it.skip(!ready, 'needs the dataset');"))).toEqual([]);
  });

  it('reads the tag on a describe wrapper and on a conditional describe', async () => {
    const wrapper = src("describeDataset('c', { tags: ['critical'] }, () => {", "  it('d', () => {});", '});');
    const conditional = src("(ready ? describe : describe.skip)('c', { tags: ['standard'] }, () => {", "  it('d', () => {});", '});');
    expect(await tagMessages(wrapper)).toEqual([]);
    expect(await tagMessages(conditional)).toEqual([]);
    expect(await tagMessages(src("(ready ? describe : describe.skip)('c', () => {", "  it('d', () => {});", '});'))).toHaveLength(1);
  });

  it('applies to e2e specs and to files in the tests and e2e folders', async () => {
    for (const file of ['a.e2e.mjs', 'a.e2e.test.mjs', 'a.spec.mjs', 'tests/helper.mjs', 'e2e/flow.mjs']) {
      const messages = await tagMessages("it('a', () => {});", undefined, file);
      expect(messages, file).toHaveLength(1);
    }
  });
});
