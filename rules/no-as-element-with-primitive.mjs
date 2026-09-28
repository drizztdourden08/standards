/* @layer tooling-scripts @kind logic */
const AS_PRIMITIVE = {
  button: 'Button / IconButton',
  input: 'TextInput / NumberInput / Checkbox / RangeInput',
  select: 'Select',
  textarea: 'TextArea',
  img: 'Image',
};

const noAsElementWithPrimitive = {
  meta: { type: 'problem', docs: { description: 'No `as="<tag>"` when a design-system primitive exists' }, schema: [] },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== 'as') return;
        const v = node.value;
        if (!v || v.type !== 'Literal' || typeof v.value !== 'string') return;
        const prim = AS_PRIMITIVE[v.value];
        if (prim) {
          context.report({ node, message: `No \`as="${v.value}"\`: a primitive exists. Use ${prim} instead of re-rolling a raw <${v.value}>.` });
        }
      },
    };
  },
};

export { noAsElementWithPrimitive };
