/* @layer tooling-scripts @kind logic */
import { GLOBAL_STYLESHEET, SHAPE_OFF_KINDS, baseNameOf, hasKind } from '../file-shape.mjs';

const cssBesideComponent = {
  meta: { type: 'problem', docs: { description: 'A component imports only its own stylesheet, ./Name.css; global sheets live in theme/ or tokens/' }, schema: [] },
  create(context) {
    if (hasKind(context.filename, ['entry', ...SHAPE_OFF_KINDS])) return {};
    const own = `./${baseNameOf(context.filename)}.css`;
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (!source.endsWith('.css') || source === own || GLOBAL_STYLESHEET.test(source)) return;
        context.report({ node, message: `"${source}" is not this component's stylesheet. A component imports only ${own}; shared styles are tokens or a theme sheet imported by the entry.` });
      },
    };
  },
};

export { cssBesideComponent };
