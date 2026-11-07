/* @layer tooling-scripts @kind test */
import { describe, expect, it } from 'vitest';
import { findSlop, GROUPS, RULE_BY_GROUP, localeOf } from '../writing/index.mjs';

const brandHits = (text) => findSlop(text, { groups: ['brand'] }).map((hit) => hit.match);

describe('tool-brand-word', { tags: ['standard'] }, () => {
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

describe('locale-based ai warning', { tags: ['standard'] }, () => {
  it('reads the language from the folder or file name after a locales folder', () => {
    expect(localeOf('src/i18n/locales/it/menu.ts')).toBe('it');
    expect(localeOf('lang/pt-BR.json')).toBe('pt');
    expect(localeOf('src/i18n/locales/en/x.ts')).toBe('en');
    expect(localeOf('src/menu.ts')).toBeNull();
    expect(localeOf('src/i18n/index.ts')).toBeNull();
  });

  it('moves ai to the brand-ambiguous group in Italian and Japanese only', () => {
    const groups = ['brand', 'brand-ambiguous'];
    expect(findSlop('torna ai menu', { groups, locale: 'it' }).map((hit) => hit.group)).toEqual(['brand-ambiguous']);
    expect(findSlop('ai', { groups, locale: 'ja' }).map((hit) => hit.group)).toEqual(['brand-ambiguous']);
    expect(findSlop('ai', { groups, locale: 'fr' }).map((hit) => hit.group)).toEqual(['brand']);
    expect(findSlop('ai', { groups, locale: 'en' }).map((hit) => hit.group)).toEqual(['brand']);
    expect(findSlop('torna ai menu', { groups }).map((hit) => hit.group)).toEqual(['brand']);
  });

  it('keeps a real tool name in the brand group in an Italian file', () => {
    expect(findSlop('usa ChatGPT', { groups: ['brand', 'brand-ambiguous'], locale: 'it' }).map((hit) => hit.group)).toEqual(['brand']);
  });

  it('maps the ambiguous group to its own rule id', () => {
    expect(RULE_BY_GROUP['brand-ambiguous']).toBe('no-ambiguous-brand-words');
  });
});
