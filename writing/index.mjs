/* @layer tooling-scripts @kind logic */
import { PATTERNS, DEFAULT_ALLOW, RULE_BY_GROUP, GROUPS, findSlop } from './slop-patterns.mjs';
import { SLOP_WORDS, FILLER_ADVERBS, STOCK_PHRASES, CONNECTORS } from './slop-word-lists.mjs';
import { classifyLines } from './slop-line-kind.mjs';

export { PATTERNS, DEFAULT_ALLOW, RULE_BY_GROUP, GROUPS, findSlop, SLOP_WORDS, FILLER_ADVERBS, STOCK_PHRASES, CONNECTORS, classifyLines };
