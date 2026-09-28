/* @layer tooling-scripts @kind logic */
const isStaticStyleValue = (n) => {
  if (!n) return false;
  if (n.type === 'Literal') return true;
  if (n.type === 'UnaryExpression') return n.argument.type === 'Literal';
  return false;
};

const noStaticInlineStyle = {
  meta: { type: 'problem', docs: { description: 'Move fully-static inline styles to token-backed CSS' }, schema: [] },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== 'style') return;
        const expr = node.value && node.value.type === 'JSXExpressionContainer' ? node.value.expression : null;
        if (!expr || expr.type !== 'ObjectExpression' || expr.properties.length === 0) return;
        const allStatic = expr.properties.every((p) => p.type === 'Property' && isStaticStyleValue(p.value));
        if (allStatic) {
          context.report({ node, message: 'No static inline style. Move these values to a token-backed CSS class; inline style is only for dynamic/animated/computed values.' });
        }
      },
    };
  },
};

export { noStaticInlineStyle };
