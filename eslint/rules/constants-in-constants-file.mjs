/* @layer tooling-scripts @kind logic */
import { SHAPE_OFF_KINDS, UPPER_SNAKE, constantsFileFor, hasKind } from '../file-shape.mjs';

const constantsInConstantsFile = {
  meta: { type: 'problem', docs: { description: 'UPPER_SNAKE constants live in *.constants.ts beside the implementation' }, schema: [] },
  create(context) {
    if (hasKind(context.filename, ['constants', ...SHAPE_OFF_KINDS], context.settings)) return {};
    return {
      'Program > VariableDeclaration[kind="const"] > VariableDeclarator, Program > ExportNamedDeclaration > VariableDeclaration[kind="const"] > VariableDeclarator'(node) {
        const name = node.id.type === 'Identifier' ? node.id.name : null;
        if (!name || !UPPER_SNAKE.test(name)) return;
        context.report({ node, message: `"${name}" is a constant in an implementation file. Move it to ${constantsFileFor(context.filename)}.` });
      },
    };
  },
};

export { constantsInConstantsFile };
