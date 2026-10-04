#!/usr/bin/env node
/* @layer tooling-scripts @kind logic */
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = `standards <command> [--root <dir>]

  lint                 typecheck, eslint, stylelint, prose, knip and jscpd in one run
  structure [--check]  the folder standard: package names, barrels, folder names, depth, component and module shapes
  prose                the writing gate over every tracked text file the other linters skip
  knip [args]          knip with every git-ignored path under ignore, in place of its own .gitignore reading
  sync [--check]       compare .npmrc, the changeset config, .jscpd.json and knip.json with the templates,
                       and fail when two copies of @drizztdourden08/standards resolve in one install

Options:
  --root <dir>         repo root (default: the current directory)
  --scope <@scope>     structure: the npm scope packages are named under
  -h, --help
`;

const COMMANDS = {
  lint: async () => (await import('../cli/lint.mjs')).runLint,
  structure: async () => (await import('../structure/index.mjs')).runStructure,
  prose: async () => (await import('../prose/index.mjs')).runProse,
  sync: async () => (await import('../sync/index.mjs')).runSync,
  knip: async () => (await import('../cli/knip.mjs')).runKnip,
};

const OPTIONS = {
  root: { type: 'string' },
  scope: { type: 'string' },
  check: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

const main = async () => {
  if (process.argv[2] === 'knip') return (await COMMANDS.knip())({ rootDir: process.cwd(), args: process.argv.slice(3) });
  const { values, positionals } = parseArgs({ args: process.argv.slice(2), options: OPTIONS, allowPositionals: true });
  const [command] = positionals;
  if (values.help || !COMMANDS[command]) {
    console.log(USAGE);
    return values.help ? 0 : 1;
  }
  const run = await COMMANDS[command]();
  return run({ rootDir: resolve(values.root ?? process.cwd()), check: values.check, scope: values.scope });
};

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`standards: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  },
);
