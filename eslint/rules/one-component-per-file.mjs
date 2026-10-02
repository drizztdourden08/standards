/* @layer tooling-scripts @kind logic */
import { COMPONENT_NAME, SHAPE_OFF_KINDS, hasKind } from '../file-shape.mjs';

const topLevelDeclarationOf = (sourceCode, node) => {
  const ancestors = sourceCode.getAncestors(node);
  const program = ancestors[0];
  return ancestors.find((a) => a.parent === program) ?? null;
};

const EXPORT_WRAPPERS = new Set(['ExportNamedDeclaration', 'ExportDefaultDeclaration']);

const unwrapExport = (declaration) => (EXPORT_WRAPPERS.has(declaration.type) ? declaration.declaration ?? {} : declaration);

const nameOf = (wrapped) => {
  const declaration = unwrapExport(wrapped);
  if (declaration.type === 'FunctionDeclaration') return declaration.id?.name ?? null;
  if (declaration.type === 'VariableDeclaration') return declaration.declarations[0]?.id?.name ?? null;
  return null;
};

const oneComponentPerFile = {
  meta: { type: 'problem', docs: { description: 'One component per .tsx; a second one lives in sub-components/' }, schema: [] },
  create(context) {
    if (hasKind(context.filename, SHAPE_OFF_KINDS, context.settings)) return {};
    const sourceCode = context.sourceCode;
    const components = new Map();
    const record = (node) => {
      const declaration = topLevelDeclarationOf(sourceCode, node);
      const name = declaration ? nameOf(declaration) : null;
      if (name && COMPONENT_NAME.test(name) && !components.has(name)) components.set(name, declaration);
    };
    return {
      JSXElement: record,
      JSXFragment: record,
      'Program:exit'() {
        for (const [name, declaration] of [...components].slice(1)) {
          context.report({ node: declaration, message: `Second component "${name}" in this file. Give it sub-components/${name}.tsx (one component per file).` });
        }
      },
    };
  },
};

export { oneComponentPerFile };
