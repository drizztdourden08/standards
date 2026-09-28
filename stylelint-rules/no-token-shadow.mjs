/* @layer tooling-scripts @kind logic */
import stylelint from 'stylelint';
import { tokensForSheet } from './token-index.mjs';

const ruleName = 'brock/no-token-shadow';

const messages = stylelint.utils.ruleMessages(ruleName, {
  shadow: (name, token) =>
    `"${name}" repeats the value of the token ${token}. Use var(${token}) instead of a second name for the same value; if the values only coincide, say why: /* stylelint-disable-next-line ${ruleName} -- <why> */`,
});

const byValue = (tokens) => {
  const index = new Map();
  for (const [name, { value }] of tokens) if (!value.startsWith('var(') && !index.has(value)) index.set(value, name);
  return index;
};

const ruleFunction = (primary, secondary = {}) => (root, result) => {
  const sheet = primary ? tokensForSheet(root, secondary) : null;
  if (!sheet) return;
  const { tokens } = sheet;
  const values = byValue(tokens);
  root.walkDecls(/^--/, (decl) => {
    if (tokens.has(decl.prop)) return;
    const token = values.get(decl.value.trim());
    if (!token) return;
    stylelint.utils.report({ ruleName, result, node: decl, message: messages.shadow(decl.prop, token) });
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = { url: 'https://github.com/drizztdourden08/brock/blob/master/docs/contributing/structure.md' };

export default stylelint.createPlugin(ruleName, ruleFunction);
