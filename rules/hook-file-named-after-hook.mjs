/* @layer tooling-scripts @kind logic */
import { HOOK_NAME, SHAPE_OFF_KINDS, baseNameOf, hasKind } from '../file-shape.mjs';

const hookFileNamedAfterHook = {
  meta: { type: 'problem', docs: { description: 'A hook lives alone in a file named after it: behavior/useThing.ts' }, schema: [] },
  create(context) {
    if (hasKind(context.filename, SHAPE_OFF_KINDS)) return {};
    const fileName = baseNameOf(context.filename);
    return {
      'Program > VariableDeclaration > VariableDeclarator, Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator, Program > FunctionDeclaration'(node) {
        const id = node.type === 'FunctionDeclaration' ? node.id : node.id;
        const name = id?.type === 'Identifier' ? id.name : null;
        if (!name || !HOOK_NAME.test(name) || name === fileName) return;
        context.report({ node, message: `Hook "${name}" is declared in ${fileName}. A hook lives alone in behavior/${name}.ts.` });
      },
    };
  },
};

export { hookFileNamedAfterHook };
