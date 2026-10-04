/* @layer tooling-scripts @kind test */
import { describe, expect, it } from 'vitest';
import { findSlop, GROUPS, RULE_BY_GROUP } from '../writing/index.mjs';

const brandHits = (text) => findSlop(text, { groups: ['brand'] }).map((hit) => hit.match);

describe('tool-brand-word', () => {
  it('runs with the default groups under its own rule id', () => {
    expect(GROUPS).toContain('brand');
    expect(RULE_BY_GROUP.brand).toBe('no-tool-brand-words');
    expect(findSlop('Ask Claude.').map((hit) => hit.id)).toEqual(['tool-brand-word']);
  });

  it('reports every word on the list as a whole word in any case', () => {
    const text = 'AI, a.i., LLM, llms, GPT, ChatGPT, Claude, Copilot, OpenAI, Anthropic, chatbot, chatbots, GenAI.';
    expect(brandHits(text)).toEqual(['AI', 'a.i.', 'LLM', 'llms', 'GPT', 'ChatGPT', 'Claude', 'Copilot', 'OpenAI', 'Anthropic', 'chatbot', 'chatbots', 'GenAI']);
  });

  it('reports the multi-word terms across any spacing', () => {
    expect(brandHits('Artificial Intelligence, a language  model, language models and machine learning.')).toEqual([
      'Artificial Intelligence',
      'language  model',
      'language models',
      'machine learning',
    ]);
  });

  it('reports a hyphenated compound and a word inside a path', () => {
    expect(brandHits('the ai-config repo')).toEqual(['ai']);
    expect(brandHits('skip .claude/worktrees and .ai/tools')).toEqual(['claude', 'ai']);
  });

  it('leaves words that only contain the letters', () => {
    expect(brandHits('maintain the daily pair, said the aide; a gpt4o_x chain of claudes')).toEqual([]);
  });

  it('skips a word the allow list names', () => {
    expect(findSlop('Ask Claude.', { groups: ['brand'], allow: ['claude'] })).toEqual([]);
  });
});
