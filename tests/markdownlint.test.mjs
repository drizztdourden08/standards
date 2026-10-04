/* @layer tooling-scripts @kind test */
import { describe, expect, it } from 'vitest';
import { standardsMarkdownlint, RULES_MODULE } from '../markdownlint/index.mjs';
import rules from '../markdownlint/rules.mjs';

describe('markdownlint', () => {
  it('keeps the BROCK rule ids', () => {
    expect(rules.map((rule) => rule.names[0])).toEqual(['BROCK001', 'BROCK002', 'BROCK003', 'BROCK004', 'BROCK005', 'BROCK006', 'BROCK007']);
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

  it('reports a banned tool or vendor word under BROCK007, outside code', () => {
    const rule = rules.find((entry) => entry.names[0] === 'BROCK007');
    const errors = [];
    const lines = ['Ask Claude or an LLM.', 'The `.claude/tools` folder stays in code.', '```', 'chatbot', '```', 'Skip .ai/tools here.'];
    rule.function({ lines, config: {} }, (error) => errors.push([error.lineNumber, error.context]));
    expect(rule.names[1]).toBe('no-tool-brand-words');
    expect(errors).toEqual([[1, 'Claude'], [1, 'LLM'], [6, 'ai']]);
  });

  it('passes banned and allowed words to the brand rule too', () => {
    const config = standardsMarkdownlint({ allow: ['claude'], discover: false });
    expect(config.config['no-tool-brand-words']).toEqual({ allow: expect.arrayContaining(['claude', 'navigate']) });
  });
});
