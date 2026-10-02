/* @layer tooling-scripts @kind logic */
import { SHAPE_OFF_KINDS, hasKind, typeFileFor } from '../file-shape.mjs';

const typesInTypeFile = {
  meta: { type: 'problem', docs: { description: 'type and interface declarations live in *.type.ts beside the implementation' }, schema: [] },
  create(context) {
    if (hasKind(context.filename, ['types', ...SHAPE_OFF_KINDS])) return {};
    const report = (node) => context.report({
      node,
      message: `"${node.id.name}" is a type declared in an implementation file. Move it to ${typeFileFor(context.filename)} and import it with \`import type\`.`,
    });
    return { TSTypeAliasDeclaration: report, TSInterfaceDeclaration: report };
  },
};

export { typesInTypeFile };
