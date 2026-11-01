<!-- @layer docs @kind doc -->
# @drizztdourden08/standards

The rules every drizztdourden08 repo shares, in one package: the ESLint rules and factory, the stylelint token rules, the markdownlint rules, the writing gate and its word lists, the structure and prose checks, tsconfig, knip and jscpd bases, the `.npmrc` and changeset templates, and the reusable CI and release workflows. A repo extends it with only what it adds, through one extension API.

The structure guide is [docs/structure.md](docs/structure.md), and the release note standard every repo follows is [docs/release-notes.md](docs/release-notes.md). Moving a repo onto the package is in [MIGRATION-CONSUMERS.md](MIGRATION-CONSUMERS.md).

## Install

```sh
pnpm add -D @drizztdourden08/standards eslint stylelint typescript
```

`eslint`, `stylelint` and `typescript` are peers. `knip`, `jscpd` and `markdownlint-cli2` come with the package; `standards lint` runs the repo's own copy when it has one.

## Use

```js
// eslint.config.mjs
import { standardsEslint } from '@drizztdourden08/standards/eslint';
export default standardsEslint({ presets: ['react-app'], primitivesGlobs: ['src/ui/primitives/**/*.tsx'], allow: ['enhanced'] });

// stylelint.config.mjs
import { standardsStylelint } from '@drizztdourden08/standards/stylelint';
export default standardsStylelint({ uiGlobs: ['src/**/*.css'], tokenGlobs: ['src/theme/**/*.css'], tokens: ['@acme/kit/tokens.css'] });

// .markdownlint-cli2.mjs
import { standardsMarkdownlint } from '@drizztdourden08/standards/markdownlint';
export default standardsMarkdownlint({ ignores: ['vendor/**'] });
```

```json
{ "extends": "@drizztdourden08/standards/tsconfig/react.json", "include": ["src"] }
```

Each factory returns its config synchronously, so a config file default-exports it as is.

## The command

```
standards lint [--all] [--base <ref>]
                               typecheck, eslint, stylelint, prose, knip and jscpd; every step runs, the failures are
                               listed at the end. Only the files changed against the base by default, --all for everything
standards test [changed|pr|e2e] [--base <ref>]
                               the tests related to the files changed against the base, by tag (see Lint and test)
standards run-locked -- <cmd>  a command under the machine-wide heavy check lock, with a hard timeout
standards structure [--check]  package names, barrels, folder names, depth, component and module folder shapes
standards prose                the writing gate over every tracked text file the other linters skip
standards knip [args]          knip with the git-ignored paths under ignore, in place of its own .gitignore reading,
                               plus the compilers and entries of the extensions' knip facets
standards sync --check         .npmrc, .gitignore, the changeset config, .jscpd.json and knip.json against the templates,
                               and a failure when two copies of @drizztdourden08/standards resolve in one install
                               (copies the install reaches; folders pnpm left in .pnpm after an upgrade do not count),
                               and a failure for any changeset that asks for a major bump
standards release-notes check [version]
                               the release note of the version being released: release-notes/v<version>.md,
                               its title, summary, sections and plain-English bullets (docs/release-notes.md);
                               draft, version, body and current serve the release workflow
```

Each command loads its code on first use, so `standards prose` never loads ESLint.

Every check skips what git ignores. The ESLint, stylelint and markdownlint factories, `standards knip` and `standards lint`'s jscpd step ask `git ls-files --others --ignored --exclude-standard --directory` once per run, so `.gitignore` files, `.git/info/exclude` and the global excludes file all count, and `standards prose` reads only the files git tracks or leaves unignored. Outside a git work tree the root `.gitignore` is read instead. Code never points into an ignored folder.

Every folder that needs ignoring is a dot-folder. `templates/gitignore` opens with a note on that rule, ignores every dot-folder with `.*/`, and lists the tracked ones (`.github/`, `.changeset/`, `.vscode/extensions.json`) as exceptions; `standards sync --check` reports a `.gitignore` that lacks `.*/` or names one dot-folder `.*/` already covers. `standards knip` runs knip with `--no-gitignore` and the git-ignored paths under `ignore`, because knip's own `.gitignore` reading matches `.*/` against the folders above a work tree and ignores every file in a work tree that lives inside a dot-folder.

When the repo has a `knip.json` (or `.knip.json`), `standards knip` writes `node_modules/.cache/standards/knip.config.mjs` on every run and passes it to knip with `--config`. The module holds the repo config with the git-ignored paths under `ignore`, loads the repo's extensions with `loadStandards`, and merges in their [`knip` facets](#the-knip-facet); a repo whose extensions have none gets its `knip.json` as is. Configuration hints still name `knip.json`. Without a `knip.json`, knip finds its own config and the knip facets do not apply; `standards knip` says so when an extension has one.

## Lint and test

### Changed files by default

`standards lint` lints the files changed against the base branch: the merge base with the default branch (`main`, `master`, or what `origin/HEAD` names), plus staged, unstaged and untracked files. `--base <ref>` or `STANDARDS_BASE` names another base. Typecheck is always project-wide. ESLint and stylelint get the changed files of their kinds, jscpd the changed code files, and prose reads the whole tree because one pass is cheap. Knip needs the whole project to find unused files, so it runs with `--all` only. A change to a config file that can change every result (`eslint.config`, `tsconfig`, `package.json`, `standards.config`) or more than 400 changed files lints everything, and so does a repo whose changed files cannot be found (no git, no default branch). The run says which mode it chose.

`--all` lints everything, for main and releases. No environment variable, `CI` included, forces a full lint: the caller passes `--all` or `--changed`.

### Timeouts

Each lint step has a hard timeout: typecheck 5 min, eslint 10, stylelint 3, prose 2, knip 5, jscpd 5. Override them with `options: { lint: { timeouts: { eslint: 900000 } } }` in `standards.config.mjs`. On timeout the run prints which step timed out, kills the process tree that step started by its own pid (`taskkill /PID <pid> /T /F` on Windows, the process group on POSIX; never by image name), carries on with the other steps and exits non-zero. A test run has one overall timeout per mode: changed 10 min, pr 20, e2e 30, set with `options: { test: { timeouts: { pr: 1800000 } } }`.

### One heavy check at a time

Lint, test and `standards run-locked` take one lock for the whole machine, so two projects never build, lint and test at once. The lock is the file `~/.coord/locks/heavy-check.lock`, holding the pid, project root, command and start time of the holder (`STANDARDS_LOCK_DIR` names another folder). A run that finds a live holder waits, prints one line when it starts to wait and one when it gets the lock, and never fails for waiting. A lock whose pid is dead is stale and is taken over. The lock is released when the run ends, on SIGINT, SIGTERM and SIGHUP, and on timeout. A run started inside a locked run sees `STANDARDS_LOCK_HOLDER=<pid>` in its environment and does not wait on itself.

A project locks its build the same way: `"build": "standards run-locked -- vite build"`. Code reaches the same lock through `@drizztdourden08/standards/lock` (`withHeavyLock`, `acquireLock`, `runLocked`, `lockPath`).

### Tests and tags

Every test carries exactly one tag (the tables are in [docs/test-standard.md](docs/test-standard.md)):

| Tag | Runs with | Timeout |
|---|---|---|
| `critical` | `standards test` | 5 s |
| `standard` | `standards test pr` (critical and standard) | 30 s |
| `e2e` | `standards test e2e`, one test at a time | 120 s |

Every mode runs only the tests related to the files changed against the base (`vitest related` with `--tags-filter`); no mode runs the whole project. `--base <ref>` moves the base, so a release passes the last release tag. Other arguments go to vitest. The vitest config is one call:

```js
// vitest.config.mjs
import { defineStandardsVitest } from '@drizztdourden08/standards/vitest';
export default defineStandardsVitest({ test: { include: ['src/**/*.test.ts'] } });
```

It sets the forks pool, at most 3 workers, the three tags with their timeouts (e2e with `concurrent: false`), `strictTags`, hook and teardown timeouts and `bail: 3`. The `test` keys you pass replace those keys.

Write the tag in the options argument, on the test or on its `describe`: `it('rejects a path outside the root', { tags: ['critical'] }, () => {})`. The lint rule `local/test-has-one-tag` is on for `*.test.*`, `*.spec.*`, `*.e2e.*` and `*.e2e.test.*` files and for every file under a `tests` or `e2e` folder. It fails a test with no tag, two tags or an unknown tag. Playwright specs use their own form on `test(...)` and `test.describe(...)`: `{ tag: '@critical' }` or `{ tag: ['@e2e'] }`, with the same one-tag rule. A test that mixes the vitest form and the Playwright form has two tags. `testTags: false` in the ESLint factory turns it off, and `testTags: ['critical', 'standard', 'e2e', 'bench']` changes the names it accepts.

### Cargo projects

The tags are vitest's, so a Rust crate maps them to cargo: `cargo test` runs critical and standard, and an e2e test is marked `#[ignore]` or put behind a cargo feature. `cargo test -- --ignored` or `cargo test --features e2e` runs e2e. Wrap the cargo scripts in `standards run-locked -- cargo test` so they share the lock.

### The script block

`templates/package-scripts.json` is the block every project gets:

```json
{
  "test": "standards test",
  "test:pr": "standards test pr",
  "test:e2e": "standards test e2e",
  "lint": "standards lint",
  "lint:all": "standards lint --all"
}
```

## Presets

| Preset | Adds to the core |
|---|---|
| `base` | nothing: the quality, shape, boundary, header and writing rules and the generic structure checks |
| `library` | keeps the boundary rules on for a published package without React |
| `react-app` | the rules of hooks (`react-hooks/rules-of-hooks`) |
| `design-system` | `react-app`; the primitives tier that may use raw HTML and the `style` prop comes from `primitivesGlobs` or from the design system's extension, Tessera's for a Tessera app |

## The extension API

An extension is a plain object with an `id` and any of seven facets. `defineExtension` checks the shape and returns it.

```js
// node_modules/@acme/module-widgets/standards.extension.mjs
import { defineExtension } from '@drizztdourden08/standards';

export default defineExtension({
  id: 'module-widgets',
  structure: {
    componentFiles: [{ file: '{Name}.preview.ts', required: false }],
    moduleFiles: [{ pattern: /^[a-z][a-z0-9-]*\.widget\.ts$/, label: '<id>.widget.ts' }],
    appMarkers: ['widgets.config.ts'],
    ownedDirs: (packageDir) => [`${packageDir}/src/widgets`],
    checks: [async ({ label, kind }) => (kind === 'app' ? [`${label}: no widgets.config.ts`] : [])],
  },
  eslint: {
    plugins: {},
    rules: {},
    configs: [{ files: ['**/*.widget.ts'], rules: { 'max-lines': ['error', 120] } }],
    options: { defaultExportGlobs: ['**/*.widget.ts'] },
  },
  stylelint: { plugins: [], rules: {}, options: { tokens: ['@acme/kit/tokens.css'] } },
  markdownlint: { customRules: [], config: {} },
  prose: { banned: ['frobnicate'], allow: ['widgetize'] },
  knip: { compilers: { ts: widgetImports }, entry: ({ rootDir }) => widgetFilesOf(rootDir) },
  releaseNotes: { sections: ['Widgets'] },
});
```

| Facet | Key | What it does |
|---|---|---|
| `structure` | `componentFiles` | `{ file, required?, reason? }` with `{Name}` for the folder name: allowed in every component folder, and required outside `sub-components/` when `required` is true |
| | `moduleFiles` | a `RegExp`, or `{ pattern, label }`; the label joins the list a finding prints |
| | `ownedDirs` | `(packageDir) => string[]`, folders the extension checks itself; the generic shape walk skips them |
| | `checks` | `(ctx) => string[]` or `{ findings, notes }`, sync or async; `ctx` is `{ rootDir, packageDir, label, pkg, kind }` with `kind` `'app'` or `'package'` |
| | `appMarkers` | files that make a workspace folder an app: no package name or barrel check |
| `eslint` | `plugins`, `rules` | one flat-config block over every source file, after the core blocks |
| | `configs` | flat-config blocks appended after the core exceptions |
| | `options` | factory options, or a function `(ctx) => options` (see below): arrays join, objects merge, `rawControls` and `consoleGlobs` replace |
| `stylelint` | `plugins`, `rules`, `options` | plugin paths, rules, factory options such as `tokens`, or a function that returns them |
| `markdownlint` | `customRules`, `config` | markdownlint-cli2 custom rules and rule config |
| `prose` | `banned`, `allow` | words the writing gate reports or skips, in ESLint, markdownlint and `standards prose` alike; an `allow` entry that equals a declared name, case included, also passes that name through `local/no-slop-identifiers` ([docs/structure.md](docs/structure.md#exceptions-are-written-down-never-silent)) |
| `knip` | `compilers` | `{ [ext]: (text, path) => string }`, what knip reads in place of each file of that extension (see below) |
| | `entry` | entry patterns, or a function `(ctx) => string[]` |
| `releaseNotes` | `sections` | `##` sections a release note may use beside the base ones ([docs/release-notes.md](docs/release-notes.md)) |
| | `product` | the product a note title names, when the repo's `options.releaseNotes.product` does not set it |

### Options computed from the repo

An extension loads once, when `require()` first reads it, and at that point it does not know which repo the factory lints. So the `options` of the `eslint` and `stylelint` facets may also be a function. The factories call it with the context of the run and merge what it returns like plain options:

```js
export default defineExtension({
  id: 'kit',
  eslint: { options: ({ rootDir, packageDir }) => ({ primitivesGlobs: primitivesOf(packageDir ?? rootDir) }) },
  stylelint: { options: ({ rootDir }) => ({ tokenGlobs: [themeOf(rootDir)] }) },
});
```

| Key | Value |
|---|---|
| `rootDir` | the `rootDir` given to `standardsEslint` or `standardsStylelint`, else the folder of the nearest `standards.config.mjs` or `pnpm-workspace.yaml` above the working folder, else the working folder |
| `packageDir` | the `packageDir` given to the factory, else the workspace package below `rootDir` that holds the working folder; absent when the run starts at the root |

A monorepo linted from its root gets `rootDir` alone and returns globs relative to it; a package that runs its own config gets its `packageDir` too. Plain-object options keep working, and both forms mix in one repo. `facetOptions(extensions, name, ctx)` exposes the same merge; without `ctx` it uses the nearest root above the working folder.

### The knip facet

A knip config file in JSON cannot hold a function, so `standards knip` hands knip a generated module (see [the command](#the-command)) that merges the `knip` facets of the loaded extensions into the repo's `knip.json`:

- `compilers` join knip's `compilers` by file extension, with or without the leading dot. When several extensions give the same extension a compiler, they run in load order, each one reading what the one before returned. A function replaces a `true` the repo config gives the same extension.
- `entry` joins the top-level `entry` list; a function is called with the context of the run, as `options` functions are. In a config with `workspaces`, the entries also join every workspace that lists its own `entry`, and the function is called again for each with `packageDir` set to that workspace folder; a workspace without an `entry` list keeps knip's default entries.

```js
export default defineExtension({
  id: 'kit',
  knip: { compilers: { ts: usageExampleImports }, entry: ({ packageDir, rootDir }) => usageFilesOf(packageDir ?? rootDir) },
});
```

Here `usageExampleImports(text, path)` turns the example imports of a usage file into re-exports, so knip counts an export that only the examples name as used.

The existing rule ids stay: `local/*` in ESLint, `BROCK001` to `BROCK006` in markdownlint (`BROCK007`, `no-tool-brand-words`, is new beside `local/no-tool-brand-words`), `brock/no-token-*` in stylelint, so disable comments keep working.

### Where extensions come from

Four layers load in this order, and the first extension of each `id` wins:

1. the core, always;
2. presets, from the factory call and from `standards.config.mjs`;
3. extensions found automatically: any dependency, devDependency or peerDependency of the root `package.json` or of a workspace package whose own `package.json` has `"standards": { "extension": "./standards.extension.mjs" }`;
4. explicit extensions, from `standards.config.mjs` and then from the factory call.

Installing a package that declares an extension is enough; no config changes. A repo that wants none turns discovery off with `discover: false`.

```js
// standards.config.mjs, optional, at the repo root
import { defineStandards } from '@drizztdourden08/standards';

export default defineStandards({
  presets: ['design-system'],
  extensions: ['./tooling/standards.extension.mjs'],
  options: {
    scope: '@acme',
    tokens: ['./src/tokens/index.css'],
    allow: ['widgetize'],
    eslint: { typed: true },
    lint: { stylelint: ['src/**/*.css'], skip: ['typecheck'] },
  },
});
```

Extensions load with `require()`, which Node 24 runs on ES modules, so the factories stay synchronous. An extension module has no top-level `await`.

### Usage files

The core allows `{Name}.usage.ts` in every component folder and requires it nowhere. A design system that wants one in each of its parts says so in its own extension: Tessera's requires it in the `parts` folders of `tessera.config.json`, so a Tessera app gets the rule by installing Tessera. Discovery reads dependencies only, so the package that declares an extension lists it in its own repo: `extensions: ['./standards.extension.mjs']`.

## Templates and bases

| Path | Use |
|---|---|
| `tsconfig/base.json`, `node.json`, `react.json` | `extends` targets |
| `knip/base.json`, `jscpd/base.json` | the shared keys `standards sync --check` compares |
| `templates/npmrc`, `templates/changeset-config.json` | the `.npmrc` lines and changeset keys every repo carries |
| `templates/package-scripts.json` | the test and lint script block every project gets |
| `.github/workflows/ci.yml`, `release.yml` | reusable workflows (`workflow_call`); both take `release-notes`, the command of the release note standard, and `release.yml` drafts the note in the version pull request and releases `v<version>` from it |

```yaml
jobs:
  gate:
    uses: drizztdourden08/standards/.github/workflows/ci.yml@v0
    with:
      scripts: lint lint:md structure test
```

## Versions

Every package of the family stays below 1.0. A breaking change bumps minor (0.9 to 0.10, with no ceiling) and a fix bumps patch; no changeset says `major`, and `standards sync --check` reports one that does. The shared workflows are tagged `v0`.
