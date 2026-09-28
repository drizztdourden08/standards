/* @layer tooling-scripts @kind logic */
const COLOR_KEYS = /^(color|background|backgroundColor|border|borderColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor|outline|outlineColor|fill|stroke|boxShadow|textShadow|caretColor|accentColor|columnRuleColor|textDecorationColor)$/;
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb)\(/;

const keyName = (key) => {
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'Literal') return String(key.value);
  return '';
};

const noRawColor = {
  meta: { type: 'problem', docs: { description: 'Use design tokens, not raw color literals, in inline styles' }, schema: [] },
  create(context) {
    return {
      Property(node) {
        if (!COLOR_KEYS.test(keyName(node.key))) return;
        const v = node.value;
        if (v.type === 'Literal' && typeof v.value === 'string' && RAW_COLOR.test(v.value)) {
          context.report({ node: v, message: `No raw color '${v.value}' in an inline style. Use a design token, e.g. 'var(--c-*)'.` });
        }
      },
    };
  },
};

export { noRawColor };
