/* @layer tooling-scripts @kind logic */
const DEFAULT_TAGS = ['critical', 'standard', 'e2e'];
const TEST_ROOTS = new Set(['it', 'test']);
const SUITE_ROOTS = new Set(['describe', 'suite']);
const MODIFIERS = new Set(['only', 'skip', 'concurrent', 'sequential', 'fails', 'each', 'for', 'runIf', 'skipIf', 'shuffle', 'todo', 'serial', 'parallel', 'fixme']);
const TAG_KEYS = { tags: { prefix: '' }, tag: { prefix: '@' } };

const branchRoot = (node, rootOf) => {
  const [yes, no] = [rootOf(node.consequent), rootOf(node.alternate)];
  return yes && no && yes.name === no.name ? { name: yes.name, todo: yes.todo && no.todo, group: yes.group || no.group } : null;
};

const unwrap = (callee) => {
  let node = callee;
  let todo = false;
  let group = false;
  for (;;) {
    if (node.type === 'CallExpression') node = node.callee;
    else if (node.type === 'MemberExpression' && !node.computed && (MODIFIERS.has(node.property.name) || node.property.name === 'describe')) {
      todo ||= node.property.name === 'todo';
      group ||= node.property.name === 'describe';
      node = node.object;
    } else break;
  }
  return { node, todo, group };
};

const rootOf = (callee) => {
  const { node, todo, group } = unwrap(callee);
  if (node.type === 'ConditionalExpression') return branchRoot(node, rootOf);
  return node.type === 'Identifier' ? { name: node.name, todo, group } : null;
};

const keyName = (property) => property.key?.name ?? property.key?.value;

const staticStrings = (value) => {
  if (value.type === 'Literal' && typeof value.value === 'string') return [value.value];
  if (value.type === 'TemplateLiteral' && value.expressions.length === 0) return [value.quasis[0].value.cooked];
  if (value.type === 'ArrayExpression' && value.elements.every((el) => el && staticStrings(el))) return value.elements.flatMap(staticStrings);
  return null;
};

const isText = (node) => (node.type === 'Literal' && typeof node.value === 'string') || node.type === 'TemplateLiteral';

const isAnnotation = (call) => {
  const first = call.arguments[0];
  if (isText(call.arguments.at(-1))) return true;
  return first.type === 'ArrowFunctionExpression' || first.type === 'FunctionExpression' || (first.type === 'Literal' && typeof first.value === 'boolean');
};

const isSuiteRoot = (root) => SUITE_ROOTS.has(root.name) || /^describe[A-Z_]/.test(root.name) || (root.group && root.name === 'test');

const isTestCall = (root, call) => TEST_ROOTS.has(root.name) && call.arguments.length >= 2 && !isAnnotation(call);

const tagsOf = (call) => {
  const found = [];
  for (const arg of call.arguments) {
    if (arg.type !== 'ObjectExpression') continue;
    for (const property of arg.properties) {
      const key = property.type === 'Property' ? keyName(property) : undefined;
      if (key && Object.hasOwn(TAG_KEYS, key)) found.push({ property, key, names: staticStrings(property.value) });
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
      for (const { property, key, names: found } of tagsOf(call)) {
        const { prefix } = TAG_KEYS[key];
        if (!found) context.report({ node: property, message: `Write the tags as string literals so the check can read them: { ${key}: ['${prefix}${known[0]}'] }.` });
        for (const name of found ?? []) {
          if (name.startsWith(prefix) && known.includes(name.slice(prefix.length))) names.push(name);
          else context.report({ node: property, message: `Unknown tag "${name}". The tags are ${known.map((tag) => prefix + tag).join(', ')}.` });
        }
      }
      return names;
    };
    return {
      CallExpression(node) {
        const root = rootOf(node.callee);
        if (!root || root.todo) return;
        if (isSuiteRoot(root)) {
          suites.push(own(node));
          return;
        }
        if (!isTestCall(root, node)) return;
        const names = [...new Set([...suites.flat(), ...own(node)])];
        if (names.length === 0) context.report({ node, message: `A test carries exactly one tag (${listed}), on itself or on its describe. Add { tags: ['${known[0]}'] } (Playwright: { tag: '@${known[0]}' }) as the second argument.` });
        if (names.length > 1) context.report({ node, message: `A test carries exactly one tag, this one has ${names.length} (${names.join(', ')}). Keep one.` });
      },
      'CallExpression:exit'(node) {
        const root = rootOf(node.callee);
        if (root && !root.todo && isSuiteRoot(root)) suites.pop();
      },
    };
  },
};

export { testHasOneTag };
