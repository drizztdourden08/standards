/* @layer tooling-scripts @kind logic */
const noRawHtml = {
  meta: { type: 'problem', docs: { description: 'No raw HTML elements outside primitives' }, schema: [] },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const n = node.name;
        if (n.type === 'JSXIdentifier' && /^[a-z]/.test(n.name)) {
          context.report({ node, message: `No raw <${n.name}> outside primitives. Use a design-system primitive (Box/Text/Flex/Button/...).` });
        }
      },
    };
  },
};

export { noRawHtml };
