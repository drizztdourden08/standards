/* @layer tooling-scripts @kind logic */
import { hasKind, oneExportExempt } from '../file-shape.mjs';

const valueSpecifiers = (node) => (node.specifiers ?? []).filter((s) => s.exportKind !== 'type');

const oneExportPerFile = {
  meta: { type: 'problem', docs: { description: 'An implementation file exports one value; lists live in index.ts, *.type.ts and *.constants.ts' }, schema: [] },
  create(context) {
    if (hasKind(context.filename, oneExportExempt(context.settings), context.settings)) return {};
    const exported = [];
    return {
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return;
        for (const specifier of valueSpecifiers(node)) exported.push({ node: specifier, name: specifier.exported.name ?? specifier.exported.value });
      },
      ExportDefaultDeclaration(node) {
        exported.push({ node, name: 'default' });
      },
      'Program:exit'() {
        if (exported.length <= 1) return;
        const names = exported.map((e) => e.name).join(', ');
        for (const extra of exported.slice(1)) {
          context.report({ node: extra.node, message: `This file exports ${exported.length} values (${names}). One thing per file: move "${extra.name}" to its own file, or make this file a *.constants.ts or index.ts if it is a list.` });
        }
      },
    };
  },
};

export { oneExportPerFile };
