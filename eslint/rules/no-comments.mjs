/* @layer tooling-scripts @kind logic */
const DEFAULT_COMMENT_ALLOW = [
  '^\\s*\\*?\\s*eslint-(disable|enable)\\b',
  '^\\s*\\*?\\s*globals?\\b',
  '^\\s*\\*?\\s*exported\\b',
  '^\\s*\\*?\\s*@ts-(expect-error|check)\\b',
  '^\\s*\\*?\\s*(istanbul|c8|v8)\\s+ignore\\b',
  '^\\s*\\*?\\s*@jsx(ImportSource|Runtime|Frag)?\\b',
  '^\\s*\\*?\\s*stylelint-(disable|enable)\\b',
  '^\\s*\\*?\\s*@vitest-environment\\b',
  '^\\s*\\*?\\s*@vite-ignore\\b',
];

const HEADER_TAG = /^\s*@layer\s+[\w-]+\s+@kind\s+[\w-]+\s*$/;
const JSDOC_TAG = /^@(typedef|param|returns?|type|template|property|callback|import)\b/;
const JSDOC_MAX_LINES = 10;
const JSDOC_MAX_TRAIL = 60;

const SCHEMA = [{
  type: 'object',
  properties: {
    allowJsdocTypes: { type: 'boolean' },
    allow: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
}];

const jsdocLines = (text) => text
  .split('\n')
  .map((line) => line.replace(/^\s*\*\s?/, '').trim())
  .filter((line) => line.length > 0);

const jsdocTrail = (line) => {
  const afterTag = line.replace(JSDOC_TAG, '').trim();
  const afterType = afterTag.startsWith('{') ? afterTag.slice(afterTag.lastIndexOf('}') + 1).trim() : afterTag;
  return /^@(param|property|typedef|template|callback)\b/.test(line) ? afterType.replace(/^\[?[\w.$]+\]?\s*/, '') : afterType;
};

const jsdocProblem = (text) => {
  const lines = jsdocLines(text);
  if (lines.length === 0) return 'empty block';
  if (lines.length > JSDOC_MAX_LINES) return `${lines.length} lines; a type block has at most ${JSDOC_MAX_LINES}`;
  for (const line of lines) {
    if (!JSDOC_TAG.test(line)) return `"${line.slice(0, 40)}" is prose; every line of a type block starts with a type tag`;
    const trail = jsdocTrail(line);
    if (trail.length > JSDOC_MAX_TRAIL) return `"${trail.slice(0, 40)}..." runs ${trail.length} chars; a tag note stops at ${JSDOC_MAX_TRAIL}`;
    if (/[.!?]\s+[A-Z]/.test(trail)) return `"${trail.slice(0, 40)}..." is sentences; a tag note is a few words`;
  }
  return null;
};

const noComments = {
  meta: { type: 'problem', docs: { description: 'No comments: make the code say it, or move the note to a doc page' }, schema: SCHEMA },
  create(context) {
    const options = context.options?.[0] ?? {};
    const allowJsdocTypes = options.allowJsdocTypes ?? false;
    const allowed = (options.allow ?? DEFAULT_COMMENT_ALLOW).map((source) => new RegExp(source));
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const report = (comment, detail) => context.report({
      loc: comment.loc,
      message: `No comments (${detail}). Name the thing so the code reads on its own, extract a function, or write the note in a doc page.`,
    });
    return {
      Program() {
        const comments = sourceCode.getAllComments().filter((c) => c.type !== 'Shebang');
        comments.forEach((comment, index) => {
          const text = comment.value;
          if (allowed.some((re) => re.test(text))) return;
          if (index === 0 && HEADER_TAG.test(text)) return;
          if (allowJsdocTypes && comment.type === 'Block' && text.startsWith('*')) {
            const problem = jsdocProblem(text);
            if (problem) report(comment, problem);
            return;
          }
          report(comment, 'not a directive, a header tag or a type block');
        });
      },
    };
  },
};

export { noComments, DEFAULT_COMMENT_ALLOW };
