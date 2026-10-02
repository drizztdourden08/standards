/* @layer tooling-scripts @kind config */
const NO_INLINE_EXPORT = {
  selector: 'ExportNamedDeclaration[declaration]',
  message: 'No inline export. Declare locally, then group `export { ... }` / `export type { ... }` at the END of the file.',
};

const NO_DEFAULT_EXPORT = {
  selector: 'ExportDefaultDeclaration',
  message: 'No default export. Name the thing and export it by name at the end of the file; a file a host tool loads by default export is listed in defaultExportGlobs.',
};

const NO_REACT_FC = {
  selector: 'TSTypeReference[typeName.name=/^(FC|FunctionComponent|VFC)$/], TSTypeReference > TSQualifiedName[right.name=/^(FC|FunctionComponent|VFC)$/]',
  message: 'No React.FC. Write `const Name = ({ a, b }: Props) => ...`; the props type is the contract.',
};

const NO_AS_ANY = {
  selector: 'TSAsExpression[typeAnnotation.type="TSAnyKeyword"], TSTypeAssertion[typeAnnotation.type="TSAnyKeyword"]',
  message: 'No `as any`. Type the value, or narrow it with a type guard.',
};

const NO_DOUBLE_CAST = {
  selector: 'TSAsExpression > TSAsExpression[typeAnnotation.type="TSUnknownKeyword"]',
  message: 'No `as unknown as T`. A double cast hides a type the code does not have; parse or validate the value instead.',
};

const NO_ENUM = {
  selector: 'TSEnumDeclaration',
  message: 'No enum. A union of string literals, or an `as const` object, gives the same names without a runtime table.',
};

const ERROR_BOUNDARY = ':has(MethodDefinition[key.name="componentDidCatch"], MethodDefinition[key.name="getDerivedStateFromError"], PropertyDefinition[key.name="getDerivedStateFromError"])';

const NO_CLASS_COMPONENT = {
  selector: `ClassDeclaration[superClass.name=/^(Component|PureComponent)$/]:not(${ERROR_BOUNDARY}), ClassDeclaration[superClass.property.name=/^(Component|PureComponent)$/]:not(${ERROR_BOUNDARY})`,
  message: 'No class component. Functional components only; the one class React still needs is an error boundary, which declares componentDidCatch or getDerivedStateFromError.',
};

const RAW_CONTROLS = [
  { selector: "JSXOpeningElement[name.name='input']", message: 'No raw <input> outside primitives. Use the text, number, checkbox or range input of the design system.' },
  { selector: "JSXOpeningElement[name.name='select']", message: 'No raw <select> outside primitives. Use the select of the design system.' },
  { selector: "JSXOpeningElement[name.name='textarea']", message: 'No raw <textarea> outside primitives. Use the text area of the design system.' },
];

const RESTRICTED_SYNTAX = [NO_INLINE_EXPORT, NO_DEFAULT_EXPORT, NO_REACT_FC, NO_AS_ANY, NO_DOUBLE_CAST, NO_ENUM, NO_CLASS_COMPONENT];

const QUALITY_RULES = {
  complexity: ['error', 10],
  'max-depth': ['error', 3],
  'max-params': ['error', 4],
  'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true }],
  'max-nested-callbacks': ['error', 3],
  'func-style': ['error', 'expression', { allowArrowFunctions: true }],
  'no-nested-ternary': 'error',
  'no-unneeded-ternary': ['error', { defaultAssignment: false }],
  'no-else-return': ['error', { allowElseIf: false }],
  'no-lonely-if': 'error',
  'no-implicit-coercion': 'error',
  'no-param-reassign': 'error',
  'no-useless-return': 'error',
  'no-useless-rename': 'error',
  'no-useless-concat': 'error',
  'no-empty': ['error', { allowEmptyCatch: false }],
  'no-console': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-template': 'error',
  'prefer-arrow-callback': 'error',
  'object-shorthand': 'error',
  'default-case-last': 'error',
  eqeqeq: ['error', 'always', { null: 'ignore' }],
};

const TS_QUALITY_RULES = {
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
  '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false, minimumDescriptionLength: 12 }],
  '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
  '@typescript-eslint/no-inferrable-types': 'error',
  '@typescript-eslint/consistent-type-definitions': 'off',
  '@typescript-eslint/array-type': 'off',
  '@typescript-eslint/no-empty-function': 'off',
};

const TYPED_RULES = {
  '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
  '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/require-await': 'error',
  '@typescript-eslint/return-await': ['error', 'in-try-catch'],
  '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-unnecessary-type-arguments': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-redundant-type-constituents': 'error',
  '@typescript-eslint/no-deprecated': 'error',
};

export { QUALITY_RULES, TS_QUALITY_RULES, TYPED_RULES, RESTRICTED_SYNTAX, NO_INLINE_EXPORT, NO_DEFAULT_EXPORT, NO_DOUBLE_CAST, RAW_CONTROLS };
