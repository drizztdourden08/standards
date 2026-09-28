/* @layer tooling-scripts @kind logic */
const noInlineStyle = {
  meta: { type: 'problem', docs: { description: 'No inline style outside primitives; list a justified exception in the config' }, schema: [] },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== 'style') return;
        context.report({
          node,
          message: 'No inline style outside primitives. Use a token-backed class; a justified exception goes in the inlineStyle list of eslint.config.mjs with its reason.',
        });
      },
    };
  },
};

export { noInlineStyle };
