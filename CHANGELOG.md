# @drizztdourden08/standards

## 1.0.5

### Patch Changes

- 5a5657d: Every folder that needs ignoring is a dot-folder. `templates/gitignore` ignores them all with `.*/` and lists the tracked ones as exceptions, and `standards sync --check` reports a `.gitignore` that lacks `.*/` or names one dot-folder it already covers. The explicit dot-folder ignores are gone from the ESLint, jscpd and prose configs; git supplies them. New `standards knip` (and `runKnip` from `@drizztdourden08/standards/knip`) runs knip with the git-ignored paths under `ignore` and `--no-gitignore`, so knip works inside a work tree that lives in a dot-folder; `standards lint` uses it.

## 1.0.4

### Patch Changes

- 714c698: Ban tool and vendor names: a new `TOOL_BRAND_WORDS` list runs as `local/no-tool-brand-words` in ESLint, `BROCK007` in markdownlint, in `standards prose` and in every caller of `findSlop`. `local/no-slop-identifiers` reports the same names as camelCase or snake_case segments. The slop rule descriptions no longer name a tool kind. Every check now skips what git ignores, asked from git itself so `.git/info/exclude` and the global excludes file count; the hard-coded agent worktree folders are gone from the ESLint, stylelint, jscpd and prose ignores.

## 1.0.3

### Patch Changes

- eb6c171: ESLint and stylelint skip a second agent worktree folder, as they already skip `.worktrees/**`.

## 1.0.2

### Patch Changes

- 7e9b48e: `standards sync --check` counts only the copies of standards the install reaches, from the root and each workspace package through the scope's packages, so a folder pnpm leaves in `node_modules/.pnpm` after an upgrade is no longer a false "two copies".

## 1.0.1

### Patch Changes

- 5a37335: The reusable release workflow takes `version` and `publish` inputs (defaults `pnpm changeset version` and `pnpm changeset publish`), so a repo that stamps files after versioning can use it. MIGRATION-CONSUMERS notes that ESLint 10 lints a fixture with its own nested `eslint.config.mjs`.

## 1.0.0

### Major Changes

- The rules Brock and Tessera shared move into one package above both, with the history of `brock-lint-config`. It holds the ESLint factory and rules, the stylelint token rules, the markdownlint rules, the writing gate and its word lists, the structure and prose checks from `brock-build`, tsconfig, knip and jscpd bases, the `.npmrc` and changeset templates, the reusable CI and release workflows, and the `standards lint | structure | prose | sync --check` command.
- One extension API: `structure`, `eslint`, `stylelint`, `markdownlint` and `prose` facets, loaded as core, presets, extensions declared by installed dependencies, then explicit ones from `standards.config.mjs`.
- Presets `base`, `library`, `react-app` and `design-system`. The rules of hooks move from the core into `react-app`.
- `local/file-header`: every source file opens with `/* @layer <layer> @kind <kind> */`.
- The stylelint token rules read their token sheets from the `tokens` option; no package path is built in.
- `{Name}.usage.ts` is allowed in every component folder and required nowhere by the core; Tessera's extension requires it in the `parts` of `tessera.config.json` and supplies `primitivesGlobs`, so the `design-system` preset names no folder.
- The `options` of an `eslint` or `stylelint` facet may be a function `({ rootDir, packageDir }) => options`, called by the factories with the repo root.
- Rule ids stay: `local/*`, `BROCK001` to `BROCK006`, `brock/no-token-*`.

## 0.1.1

Released as `@drizztdourden08/brock-lint-config` inside Brock; see Brock's changelog.
