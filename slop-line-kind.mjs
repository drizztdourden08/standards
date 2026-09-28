/* @layer tooling-scripts @kind logic */
const SLASH = { line: '//', open: '/*', close: '*/' };
const HASH = { line: '#' };
const XML = { open: '<!--', close: '-->' };

const BY_LANG = {
  C: SLASH,
  'C-Header': SLASH,
  'C++': SLASH,
  CSS: { open: '/*', close: '*/' },
  SCSS: SLASH,
  Shell: HASH,
  YAML: HASH,
  TOML: HASH,
  Python: HASH,
  Make: HASH,
  PowerShell: { line: '#', open: '<#', close: '#>' },
  Batch: { line: '::' },
  HTML: XML,
  Other: XML,
  JSON: {},
};

const markersFor = (lang) => BY_LANG[lang] ?? {};

const startsComment = (trimmed, m) =>
  (m.line && trimmed.startsWith(m.line)) ||
  (m.open && trimmed.startsWith(m.open)) ||
  trimmed.startsWith('*') ||
  (m.line === '::' && /^rem\b/i.test(trimmed));

/**
 * @param {string} text
 * @param {string} lang language name
 * @returns {string[]} one kind per line
 */
const opensBlock = (line, m) => Boolean(m.open) && line.includes(m.open) && !(m.close && line.includes(m.close));

const hasLineComment = (line, m) =>
  Boolean(m.line) && line.includes(m.line) && !/["'`]/.test(line.slice(0, line.indexOf(m.line)));

const isCommentLine = (line, m) =>
  startsComment(line.trim(), m) || (Boolean(m.open) && line.includes(m.open)) || hasLineComment(line, m);

const kindOfLine = (line, m) => {
  if (isCommentLine(line, m)) return 'comment';
  return /["'`]/.test(line) ? 'string' : 'other';
};

const classifyLines = (text, lang) => {
  const m = markersFor(lang);
  const out = [];
  let inBlock = false;
  for (const line of text.split('\n')) {
    if (inBlock) {
      out.push('comment');
      if (m.close && line.includes(m.close)) inBlock = false;
    } else if (opensBlock(line, m)) {
      inBlock = true;
      out.push('comment');
    } else {
      out.push(kindOfLine(line, m));
    }
  }
  return out;
};

export { classifyLines };
