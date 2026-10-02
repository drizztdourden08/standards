/* @layer tooling-scripts @kind logic */
import { DEFAULT_ALLOW, findSlop } from '../../writing/slop-patterns.mjs';

const DIRECTIVE_COMMENT = /^\s*(eslint\b|eslint-|globals?\b|exported\b|@ts-|prettier-|istanbul\b|c8\b|v8\b|@jsx\b|#!)/;

const SLOP_SCHEMA = [{
  type: 'object',
  properties: { allow: { type: 'array', items: { type: 'string' } } },
  additionalProperties: false,
}];

const slopRule = (group, description) => ({
  meta: { type: 'problem', docs: { description }, schema: SLOP_SCHEMA },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const allow = context.options?.[0]?.allow ?? DEFAULT_ALLOW;
    const scan = (start, text) => {
      for (const hit of findSlop(text, { allow, groups: [group] })) {
        const at = start + hit.index;
        context.report({
          loc: { start: sourceCode.getLocFromIndex(at), end: sourceCode.getLocFromIndex(at + hit.length) },
          message: hit.message,
        });
      }
    };
    const isModuleSpecifier = (node) => {
      const p = node.parent?.type;
      return p === 'ImportDeclaration' || p === 'ExportNamedDeclaration' || p === 'ExportAllDeclaration' || p === 'ImportExpression' || p === 'ImportAttribute';
    };
    return {
      Program() {
        const text = sourceCode.getText();
        for (const c of sourceCode.getAllComments()) {
          if (DIRECTIVE_COMMENT.test(c.value)) continue;
          scan(c.range[0], text.slice(c.range[0], c.range[1]));
        }
      },
      Literal(node) {
        if (typeof node.value !== 'string' || isModuleSpecifier(node)) return;
        if (group === 'prose' && /^[\w.:/-]*$/.test(node.value)) return;
        scan(node.range[0], sourceCode.getText(node));
      },
      TemplateElement(node) { scan(node.range[0], sourceCode.getText(node)); },
      JSXText(node) { scan(node.range[0], sourceCode.getText(node)); },
    };
  },
});

const noEmDash = slopRule('dash', 'No em dash or en dash: rewrite the sentence');
const noSmartPunctuation = slopRule('punct', 'No unicode ellipsis or curly quotes');
const noSlopProse = slopRule('prose', 'No AI-writing phrases, connectors, slop words or filler adverbs');

export { noEmDash, noSmartPunctuation, noSlopProse, slopRule };
