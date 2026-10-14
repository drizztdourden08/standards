/* @layer tooling-scripts @kind logic */
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const CHAIN_LINKS = new Set(['not', 'resolves', 'rejects']);

const isExpectCall = (node) => {
  if (node?.type !== 'CallExpression') return false;
  const { callee } = node;
  if (callee.type === 'Identifier') return callee.name === 'expect';
  return callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'expect' && callee.property.name === 'soft';
};

const isMatcherCallee = (callee) => {
  if (callee.type !== 'MemberExpression' || callee.computed) return false;
  let receiver = callee.object;
  while (receiver.type === 'MemberExpression' && !receiver.computed && CHAIN_LINKS.has(receiver.property.name)) receiver = receiver.object;
  return isExpectCall(receiver);
};

const isAsymmetricMatcher = (callee) => callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'expect' && !callee.computed;

const stepUp = (node) => {
  const { parent } = node;
  if (parent.type === 'TemplateLiteral' || parent.type === 'ArrayExpression' || parent.type === 'ObjectExpression') return parent;
  if (parent.type === 'Property' && parent.value === node) return parent;
  return null;
};

const isExpectedArgument = (node) => {
  let current = node;
  while (current?.parent) {
    const { parent } = current;
    if (parent.type !== 'CallExpression' || !parent.arguments.includes(current)) current = stepUp(current);
    else if (isMatcherCallee(parent.callee)) return true;
    else current = isAsymmetricMatcher(parent.callee) ? parent : null;
  }
  return false;
};

/**
 * @param {{ filename: string }} context
 * @returns {(node: object) => boolean}
 */
const expectedValueCheck = (context) => (TEST_FILE.test(context.filename) ? isExpectedArgument : () => false);

export { expectedValueCheck };
