/* @layer tooling-scripts @kind test */
import { afterEach, describe, expect, it } from 'vitest';
import { HEADER, lint } from './lint-text.mjs';
import { tempTree, removeTempTrees } from './temp-tree.mjs';

afterEach(removeTempTrees);

const tagMessages = async (body, options) => {
  const root = tempTree({ 'package.json': { name: 'x' } });
  const messages = await lint(root, 'a.test.mjs', `${HEADER}import { describe, it } from 'vitest';\n\n${body}\n`, options);
  return messages.filter((message) => message.startsWith('local/test-has-one-tag'));
};

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
