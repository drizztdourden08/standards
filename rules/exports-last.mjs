/* @layer tooling-scripts @kind logic */
const EXPORT_TYPES = new Set(['ExportNamedDeclaration', 'ExportAllDeclaration', 'ExportDefaultDeclaration']);

const isExport = (node) => EXPORT_TYPES.has(node.type);

const exportsLast = {
  meta: { type: 'problem', docs: { description: 'Export statements are the last statements of a file' }, schema: [] },
  create(context) {
    return {
      Program(program) {
        const body = program.body;
        const firstExport = body.findIndex(isExport);
        if (firstExport === -1) return;
        for (const node of body.slice(firstExport)) {
          if (isExport(node)) continue;
          context.report({ node, message: 'A statement after an export. Declare everything first, then group every export at the end of the file.' });
        }
      },
    };
  },
};

export { exportsLast };
