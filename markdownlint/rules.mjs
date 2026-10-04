/* @layer tooling-scripts @kind logic */
import { DEFAULT_ALLOW, findSlop } from '../writing/slop-patterns.mjs';

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const INLINE_CODE = /`+[^`]*`+/g;
const blank = (m) => ' '.repeat(m.length);

const maskCode = (lines) => {
  let fence = null;
  return lines.map((line) => {
    const open = line.match(FENCE);
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length) fence = null;
      return blank(line);
    }
    if (open) { fence = open[1]; return blank(line); }
    if (/^ {4,}\S/.test(line)) return blank(line);
    return line.replace(INLINE_CODE, blank);
  });
};

const makeRule = (id, name, group, description) => ({
  names: [id, name],
  description,
  tags: ['prose', 'style', 'brock'],
  parser: 'none',
  function: (params, onError) => {
    const allow = params.config?.allow ?? DEFAULT_ALLOW;
    const banned = params.config?.banned;
    const lines = maskCode(params.lines);
    lines.forEach((line, i) => {
      for (const hit of findSlop(line, { allow, banned, groups: [group] })) {
        onError({
          lineNumber: i + 1,
          detail: hit.message,
          context: hit.match.replace(/\s+/g, ' ').slice(0, 40),
          range: [hit.index + 1, hit.length],
        });
      }
    });
  },
});

const SLOP_HEADINGS = /^#{1,6}\s+(?:overview|summary|conclusion|conclusions|introduction|key features|key takeaways|key points|key concepts|next steps|final thoughts|benefits|why this matters|best practices|additional notes|notes|features|getting started|tl;?dr|recap|wrap-up|closing thoughts|the bottom line|in a nutshell)\s*:?\s*$/i;
const BOLD_LABEL_BULLET = /^\s*(?:[-*+]|\d+\.)\s+\*\*[^*\n]{1,60}\*\*\s*[:.]\s*\S/;
const EMOJI_HEADING = /^#{1,6}\s+(?:\p{Extended_Pictographic}|[✅❌✨⚠⭐])/u;

const lineRule = ({ id, name, description, re, detail }) => ({
  names: [id, name],
  description,
  tags: ['prose', 'style', 'brock'],
  parser: 'none',
  function: (params, onError) => {
    maskCode(params.lines).forEach((line, i) => {
      if (re.test(line)) onError({ lineNumber: i + 1, detail, context: line.trim().slice(0, 40) });
    });
  },
});

const rules = [
  makeRule('BROCK001', 'no-em-dash', 'dash', 'Em dash or en dash in prose; rewrite the sentence, do not swap the character'),
  makeRule('BROCK002', 'no-smart-punctuation', 'punct', 'Unicode ellipsis, curly quote, emoji or glyph in prose; use plain ASCII'),
  makeRule('BROCK003', 'no-slop-prose', 'prose', 'Stock phrasing or filler in prose; use plain words and short sentences'),
  lineRule({
    id: 'BROCK004',
    name: 'no-slop-headings',
    description: 'Template heading that names a section shape instead of its subject',
    re: SLOP_HEADINGS,
    detail: 'Name what the section is about. "Overview", "Summary", "Key features" and "Conclusion" are the shape of a template page, not a subject.',
  }),
  lineRule({
    id: 'BROCK005',
    name: 'no-bold-label-bullets',
    description: 'Bullet that opens with a bold label and a colon',
    re: BOLD_LABEL_BULLET,
    detail: 'Write the bullet as a sentence, or make the labels a table. A run of "- **Label:** text" is the template-list shape.',
  }),
  lineRule({ id: 'BROCK006', name: 'no-emoji-headings', description: 'Heading that opens with an emoji', re: EMOJI_HEADING, detail: 'Delete the emoji. A heading is words.' }),
  makeRule('BROCK007', 'no-tool-brand-words', 'brand', 'Banned tool or vendor name in prose'),
];

export default rules;
