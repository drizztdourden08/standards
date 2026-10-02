/* @layer tooling-scripts @kind logic */
import stylelint from 'stylelint';
import { tokensForSheet } from './token-index.mjs';

const ruleName = 'brock/no-token-override';

const messages = stylelint.utils.ruleMessages(ruleName, {
  override: (name, file) =>
    `"${name}" is a token (${file}). Setting it here changes every consumer below this selector. If that is the intent, keep it and say why: /* stylelint-disable-next-line ${ruleName} -- <why> */`,
});

const ruleFunction = (primary, secondary = {}) => (root, result) => {
  const sheet = primary ? tokensForSheet(root, secondary) : null;
  if (!sheet) return;
  const { tokens } = sheet;
  root.walkDecls(/^--/, (decl) => {
    const token = tokens.get(decl.prop);
    if (!token) return;
    stylelint.utils.report({ ruleName, result, node: decl, message: messages.override(decl.prop, token.file.replace(/\\/g, '/').split('/').slice(-2).join('/')) });
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = { url: 'https://github.com/drizztdourden08/standards/blob/main/docs/structure.md' };

export default stylelint.createPlugin(ruleName, ruleFunction);
