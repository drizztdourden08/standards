/* @layer tooling-scripts @kind logic */
const HEADER_TAG = /^\s*@layer\s+[\w-]+\s+@kind\s+[\w-]+\s*$/;
const HEADER_FORM = '/* @layer <layer> @kind <kind> */';

const fileHeader = {
  meta: {
    type: 'problem',
    docs: { description: 'Every file opens with the header tag naming its layer and kind' },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    return {
      Program(program) {
        const first = sourceCode.getAllComments().find((comment) => comment.type !== 'Shebang');
        const firstToken = sourceCode.getFirstToken(program);
        const leads = first && (!firstToken || first.range[0] < firstToken.range[0]);
        if (leads && HEADER_TAG.test(first.value)) return;
        context.report({
          loc: { line: 1, column: 0 },
          message: `Missing file header. The first line of the file is ${HEADER_FORM}, for example /* @layer tooling-scripts @kind logic */.`,
        });
      },
    };
  },
};

export { fileHeader };
