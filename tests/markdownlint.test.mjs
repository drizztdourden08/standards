/* @layer tooling-scripts @kind test */
import { describe, expect, it } from 'vitest';
import { standardsMarkdownlint, RULES_MODULE } from '../markdownlint/index.mjs';
import rules from '../markdownlint/rules.mjs';

describe('markdownlint', () => {
  it('keeps the BROCK rule ids', () => {
    expect(rules.map((rule) => rule.names[0])).toEqual(['BROCK001', 'BROCK002', 'BROCK003', 'BROCK004', 'BROCK005', 'BROCK006']);
  });

  it('loads the rules by path, then the custom rules of extensions', () => {
    const config = standardsMarkdownlint({ extensions: [{ id: 'docs', markdownlint: { customRules: ['./docs-rule.mjs'], config: { MD001: false } } }], discover: false });
    expect(config.customRules).toEqual([RULES_MODULE, './docs-rule.mjs']);
    expect(config.config.MD001).toBe(false);
  });

  it('passes banned and allowed words to the writing rules', () => {
    const config = standardsMarkdownlint({ allow: ['robust'], banned: ['frobnicate'], discover: false });
    expect(config.config['no-slop-prose']).toEqual({ allow: expect.arrayContaining(['robust', 'navigate']), banned: ['frobnicate'] });
  });
});
