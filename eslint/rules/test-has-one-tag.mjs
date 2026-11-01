/* @layer tooling-scripts @kind logic */
const DEFAULT_TAGS = ['critical', 'standard', 'e2e'];
const TEST_ROOTS = new Set(['it', 'test']);
const SUITE_ROOTS = new Set(['describe', 'suite']);
const MODIFIERS = new Set(['only', 'skip', 'concurrent', 'sequential', 'fails', 'each', 'for', 'runIf', 'skipIf', 'shuffle', 'todo']);

const rootOf = (callee) => {
  let node = callee;
  let todo = false;
  for (;;) {
    if (node.type === 'CallExpression') node = node.callee;
    else if (node.type === 'MemberExpression' && !node.computed && MODIFIERS.has(node.property.name)) {
      todo ||= node.property.name === 'todo';
      node = node.object;
    } else break;
  }
  return node.type === 'Identifier' ? { name: node.name, todo } : null;
};

const keyName = (property) => property.key?.name ?? property.key?.value;

const staticStrings = (value) => {
  if (value.type === 'Literal' && typeof value.value === 'string') return [value.value];
  if (value.type === 'TemplateLiteral' && value.expressions.length === 0) return [value.quasis[0].value.cooked];
  if (value.type === 'ArrayExpression' && value.elements.every((el) => el && staticStrings(el))) return value.elements.flatMap(staticStrings);
  return null;
};

const tagsOf = (call) => {
  const found = [];
  for (const arg of call.arguments) {
    if (arg.type !== 'ObjectExpression') continue;
    for (const property of arg.properties) {
      if (property.type === 'Property' && keyName(property) === 'tags') found.push({ property, names: staticStrings(property.value) });
    }
  }
  return found;
};

const testHasOneTag = {
  meta: {
    type: 'problem',
    docs: { description: 'Every it and test carries exactly one known tag, on itself or on an enclosing describe' },
    schema: [{ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } }, additionalProperties: false }],
  },
  create(context) {
    const known = context.options[0]?.tags ?? DEFAULT_TAGS;
    const listed = known.join(', ');
    const suites = [];
    const own = (call) => {
      const names = [];
      for (const { property, names: found } of tagsOf(call)) {
        if (!found) context.report({ node: property, message: `Write the tags as string literals so the check can read them: { tags: ['${known[0]}'] }.` });
        for (const name of found ?? []) {
          if (known.includes(name)) names.push(name);
          else context.report({ node: property, message: `Unknown tag "${name}". The tags are ${listed}.` });
        }
      }
      return names;
    };
    return {
      CallExpression(node) {
        const root = rootOf(node.callee);
        if (!root || root.todo) return;
        if (SUITE_ROOTS.has(root.name)) suites.push(own(node));
        if (!TEST_ROOTS.has(root.name) || node.arguments.length < 2) return;
        const names = [...new Set([...suites.flat(), ...own(node)])];
        if (names.length === 0) context.report({ node, message: `A test carries exactly one tag (${listed}), on itself or on its describe. Add { tags: ['${known[0]}'] } as the second argument.` });
        if (names.length > 1) context.report({ node, message: `A test carries exactly one tag, this one has ${names.length} (${names.join(', ')}). Keep one.` });
      },
      'CallExpression:exit'(node) {
        const root = rootOf(node.callee);
        if (root && !root.todo && SUITE_ROOTS.has(root.name)) suites.pop();
      },
    };
  },
};

export { testHasOneTag };
