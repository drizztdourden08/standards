/* @layer tooling-scripts @kind logic */
import { SLOP_WORDS, FILLER_ADVERBS, STOCK_PHRASES, CONNECTORS } from './slop-word-lists.mjs';

const w = (words) => new RegExp(`\\b(?:${words})\\b`, 'gi');

const PATTERNS = [
  {
    id: 'em-dash',
    group: 'dash',
    re: /[—–]/g,
    label: (d) => (d === '—' ? 'Em dash' : 'En dash'),
    advice:
      'REPHRASE the sentence. Do not swap the character: a colon, a comma or a spaced hyphen keeps the same clause-plus-aside shape, and that shape is the tell. Split it into two sentences, delete the aside, or rejoin it with because / so / when / which. A numeric range or a table separator takes a plain hyphen.',
  },
  {
    id: 'ellipsis',
    group: 'punct',
    re: /…/g,
    label: 'Unicode ellipsis',
    advice: 'Type three periods (...) in a UI label. In prose, end the sentence and drop it.',
  },
  {
    id: 'curly-quote',
    group: 'punct',
    re: /[‘’“”]/g,
    label: 'Curly quote',
    advice: 'Use the straight quotes \' and ". Escape them in a string if needed.',
  },
  {
    id: 'emoji',
    group: 'punct',
    re: /(?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[✅❌✔✖✨⚠⭐‼⁉])️?/gu,
    label: 'Emoji',
    advice: 'Delete it. Code, strings, docs and messages carry words, never pictograms; a UI glyph is an Icon component.',
  },
  {
    id: 'glyph',
    group: 'punct',
    re: /[→←⇒⇐✓✗•▶►◆■]/g,
    label: 'Typographic glyph',
    advice: 'Use words or ASCII (->, -, *) in prose and strings; a UI glyph is an Icon component.',
  },
  {
    id: 'rather-than',
    group: 'prose',
    re: /\brather than\b/gi,
    advice: 'Write "instead of", or turn the sentence around: "X, not Y".',
  },
  {
    id: 'neg-pivot',
    group: 'prose',
    re: /\b(?:not|isn't|aren't|wasn't|doesn't|don't|never)\s+(?:just|only|merely|simply)\b[^.\n]{0,80}?\b(?:but|it's|it is|they're|rather)\b/gi,
    advice: 'Drop the pivot and say the thing once: "X and Y", or just "Y".',
  },
  {
    id: 'neg-pivot',
    group: 'prose',
    re: /\bit(?:'s| is)\s+not\s+(?:about|a|an|the)?\s?[^.\n,]{1,40},\s*(?:it(?:'s| is)|but)\b/gi,
    advice: 'Drop the pivot and say the thing once.',
  },
  {
    id: 'connector',
    group: 'prose',
    prefix: true,
    re: new RegExp(`(^|[.!?]\\s+|^[ \\t]*(?:\\/\\/|#|--|>|[-+*])[ \\t]*)(${CONNECTORS})\\b[,:]?`, 'gm'),
    advice: 'Delete the opening connector, or use "Also". The sentence reads fine without it.',
  },
  {
    id: 'stock-phrase',
    group: 'prose',
    re: new RegExp(`\\b(?:${STOCK_PHRASES})(?![\\w-])`, 'gi'),
    advice:
      'Use plain words: "to" for "in order to", "and" for "as well as", "so" for "this means that", "make sure" for "make sure to". Or delete the phrase.',
  },
  {
    id: 'slop-word',
    group: 'prose',
    word: true,
    re: w(SLOP_WORDS),
    advice: 'Use a plain word (use, solid, key, full, simplify, improve, best, simple, needed), or delete it.',
  },
  {
    id: 'filler-adverb',
    group: 'prose',
    word: true,
    re: w(FILLER_ADVERBS),
    advice: 'Delete the adverb. It adds nothing the sentence does not already say.',
  },
  {
    id: 'ensure',
    group: 'prose',
    word: true,
    re: w('ensure|ensures|ensuring'),
    advice: 'Write "make sure", "check" or "guarantee". Identifiers such as ensureWasm or ensure-wasm are left alone.',
  },
  {
    id: 'exclamation',
    group: 'prose',
    re: /[a-z]![ \n"')]/g,
    label: 'Exclamation mark',
    advice: 'End the sentence with a period. Prose here does not cheer.',
  },
];

const DEFAULT_ALLOW = [
  'navigate', 'navigates', 'navigating', 'navigation',
  'harness', 'harnesses',
  'unlock', 'unlocks', 'unlocked', 'unlocking',
  'underscore', 'underscores',
];

const RULE_BY_GROUP = { dash: 'no-em-dash', punct: 'no-smart-punctuation', prose: 'no-slop-prose' };
const GROUPS = ['dash', 'punct', 'prose'];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const compileAllow = (allow) =>
  allow.map((a) => new RegExp(`^(?:${escapeRe(a)})$`, /[A-Z]/.test(a) ? '' : 'i'));

const isIdentChar = (c) => c !== undefined && /[A-Za-z0-9_$-]/.test(c);

const isIdentifierUse = (text, index, length) => {
  const before = text[index - 1];
  const after = text[index + length];
  if (isIdentChar(before) || isIdentChar(after)) return true;
  if (after === '(') return true;
  if (before === '.' && /[A-Za-z0-9_$]/.test(text[index - 2] ?? '')) return true;
  return false;
};

/**
 * @param {string} text
 * @param {{ allow?: string[], groups?: string[] }} [opts]
 * @returns {{ id: string, group: string, index: number, length: number, match: string, message: string }[]}
 */
const headOf = (p, match) => {
  const label = typeof p.label === 'function' ? p.label(match) : p.label;
  return label ?? `"${match.replace(/\s+/g, ' ')}"`;
};

const hitOf = (p, text, m, allow) => {
  const match = p.prefix ? m[2] : m[0];
  const index = p.prefix ? m.index + m[1].length : m.index;
  if (p.word && isIdentifierUse(text, index, match.length)) return null;
  if (allow.some((re) => re.test(match))) return null;
  return { id: p.id, group: p.group, index, length: match.length, match, message: `${headOf(p, match)}: ${p.advice}` };
};

const hitsOf = (p, text, allow) => {
  const hits = [];
  p.re.lastIndex = 0;
  let m;
  while ((m = p.re.exec(text)) !== null) {
    if (m[0].length === 0) { p.re.lastIndex++; continue; }
    const hit = hitOf(p, text, m, allow);
    if (hit) hits.push(hit);
  }
  return hits;
};

const withoutOverlaps = (found) => {
  const sorted = [...found].sort((a, b) => a.index - b.index || b.length - a.length);
  const out = [];
  let end = -1;
  for (const f of sorted) {
    if (f.index < end) continue;
    out.push(f);
    end = f.index + f.length;
  }
  return out;
};

const findSlop = (text, opts = {}) => {
  const allow = compileAllow(opts.allow ?? DEFAULT_ALLOW);
  const groups = opts.groups ?? GROUPS;
  const found = PATTERNS.filter((p) => groups.includes(p.group)).flatMap((p) => hitsOf(p, text, allow));
  return withoutOverlaps(found);
};

export { PATTERNS, DEFAULT_ALLOW, RULE_BY_GROUP, GROUPS, findSlop };
