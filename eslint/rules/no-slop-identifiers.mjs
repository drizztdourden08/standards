/* @layer tooling-scripts @kind logic */
const PREFIX = /^(?:Enhanced|Improved|Better|Advanced|Smart|Simple|Basic|Modern|My|Optimized|Refactored|Updated|Final|Temp|Tmp|New|Custom|Generic|Real|Actual|Proper)[A-Z]/;
const SUFFIX = /(?:Helper|Helpers|Util|Utils|Utility|Utilities|Wrapper|Impl|Temp|Tmp|Backup|Refactored|Updated|Enhanced|Improved|V\d|Final|Legacy)$/;
const PLACEHOLDER_NAMES = /^(?:foo|baz|qux|quux|dummy|temp|tmp|thing|stuff|blah|whatever|something|myVar|myValue|someValue|someData|data2|result2|test123|asdf|xyz)$/i;
const NUMBERED_COPY = /^(?:.+)(?:Data|Info|Object|Obj|Value|Val|Result|Thing|Stuff|Item|Var|Manager|Handler|Processor|Service)2$/;

const DECLARATIONS = [
  'VariableDeclarator > Identifier.id',
  'FunctionDeclaration > Identifier.id',
  'ClassDeclaration > Identifier.id',
  'TSTypeAliasDeclaration > Identifier.id',
  'TSInterfaceDeclaration > Identifier.id',
  'TSEnumDeclaration > Identifier.id',
  'Property[shorthand=false] > Identifier.key',
  'PropertyDefinition > Identifier.key',
  'MethodDefinition > Identifier.key',
  'TSPropertySignature > Identifier.key',
].join(', ');

const problemOf = (name) => {
  if (PLACEHOLDER_NAMES.test(name)) return 'a placeholder name; name what it holds';
  if (PREFIX.test(name)) return 'a qualifier prefix; the qualifier says this is the second version of something. Replace the original or name the difference';
  if (SUFFIX.test(name)) return 'a suffix that names a shape instead of a subject. Name what it is for';
  if (NUMBERED_COPY.test(name)) return 'a numbered copy; there is one of each thing';
  return null;
};

const noSlopIdentifiers = {
  meta: { type: 'problem', docs: { description: 'No placeholder, qualifier-prefixed, shape-suffixed or numbered-copy names at declaration sites' }, schema: [] },
  create(context) {
    return {
      [DECLARATIONS](node) {
        const problem = problemOf(node.name);
        if (problem) context.report({ node, message: `"${node.name}" is ${problem}.` });
      },
    };
  },
};

export { noSlopIdentifiers };
