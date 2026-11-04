/* @layer tooling-scripts @kind logic */
import { CHILD_PROCESS_MODULES, SPAWN_FUNCTIONS, SPAWN_HIDES_WINDOW_MESSAGE } from './spawn-hides-window.constants.mjs';

const keyName = (property) => (property.key.type === 'Identifier' ? property.key.name : property.key.value);

const setsWindowsHide = (node) => node.type === 'ObjectExpression' && node.properties.some(
  (property) => property.type === 'Property' && !property.computed && keyName(property) === 'windowsHide',
);

const spawnName = (callee, named, spaces) => {
  if (callee.type === 'Identifier') return named.get(callee.name);
  const isMember = callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && spaces.has(callee.object.name);
  const name = isMember && (callee.computed ? callee.property.value : callee.property.name);
  return SPAWN_FUNCTIONS.includes(name) ? name : undefined;
};

const importedName = (specifier) => specifier.imported.name ?? specifier.imported.value;

const spawnHidesWindow = {
  meta: {
    type: 'problem',
    docs: { description: 'A child process call from node:child_process passes an options object with a windowsHide property' },
    schema: [],
    messages: { hide: SPAWN_HIDES_WINDOW_MESSAGE },
  },
  create(context) {
    const named = new Map();
    const spaces = new Set();
    return {
      ImportDeclaration(node) {
        if (!CHILD_PROCESS_MODULES.includes(node.source.value)) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') spaces.add(specifier.local.name);
          else if (SPAWN_FUNCTIONS.includes(importedName(specifier))) named.set(specifier.local.name, importedName(specifier));
        }
      },
      CallExpression(node) {
        const name = spawnName(node.callee, named, spaces);
        if (name && !node.arguments.some(setsWindowsHide)) context.report({ node, messageId: 'hide', data: { name } });
      },
    };
  },
};

export { spawnHidesWindow };
