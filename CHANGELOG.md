# @drizztdourden08/standards

## 0.14.6

### Patch Changes

- 98202ef: The heavy check lock has slots: `heavy-check.0.lock` to `heavy-check.2.lock`, a caller takes the first free one, `STANDARDS_LOCK_SLOTS` sets the count (3 by default), the wait is 1800 s, and the gave up error names every holder. A live `heavy-check.lock` of an older version counts as one holder. `standards test e2e` no longer takes a slot.

## 0.14.5

### Patch Changes

- d84530e: `standards test` resolves the related test files first and runs each one once, takes files on the command line in place of the changed set, and prints its usage for `--help` before any git or vitest work.

## 0.14.4

### Patch Changes

- d708b93: `defineStandardsVitest` drops the `NODE_PATH` that pnpm's bin shims export, so a test that builds a folder without a package no longer finds the repo's own copy through `.pnpm/node_modules`.

## 0.14.3

### Patch Changes

- bef547d: `standards test` compares with the local default branch when `origin/HEAD` points at a branch that the local one has moved past, so a local-first repo no longer lists every unpushed commit as changed. `--base` and `STANDARDS_BASE` still win. The related files go to vitest in batches of at most 24000 characters, so hundreds of changed files no longer fail with `spawn ENAMETOOLONG` on Windows. The exit code is the first failure of any batch.

  `standards prose` skips a tracked file that is deleted but not committed yet. `standards knip` counts `vitest.*.config.*` as vitest configs, so `vitest.e2e.config.ts` is no longer reported as unused; a `vitest` key in `knip.json` still wins.

## 0.14.2

### Patch Changes

- 00b2869: `standards knip` passes knip a single `--preprocessor`. knip 5.88 crashes with `id.startsWith is not a function` on a second one, and the git-ignored hints plus any extension preprocessor made two. When there is more than one, standards writes a chain module under `node_modules/.cache/standards` that runs them all in order.
- 00b2869: The heavy check lock gives up after 300 s with an error that names the holder. `STANDARDS_LOCK_WAIT_S` sets another limit. The wait line now says how long the holder has held the lock, and it repeats each minute.

## 0.14.1

### Patch Changes

- 150365a: `local/test-has-one-tag` reads the tag on a describe wrapper whose name starts with `describe` and a capital, such as `describeDataset(...)`, and on a conditional suite, `(ready ? describe : describe.skip)(...)`. It skips every annotation call whose last argument is a reason string, such as `test.skip(!ready, 'needs the dataset')`.

## 0.14.0

### Minor Changes

- 2db421d: Four asks from the projects. `local/test-has-one-tag` reads the browser test form `{ tag: '@critical' }` and covers `*.e2e.*` specs and the `tests` and `e2e` folders. The code lint runs in batches of at most 1000 files, one process at a time, each under `--max-old-space-size` (4096 MB, `STANDARDS_LINT_HEAP_MB` overrides). The `./vitest` and `./lock` exports ship type declarations. The knip facet takes `preprocessors`, absolute paths that `standards knip` passes as `--preprocessor`.

## 0.13.0

### Minor Changes

- ff44d64: The lint and test standard. `standards lint` lints the files changed against the base branch by default and everything with `--all`; no `CI` variable forces a full lint. Each lint step has a hard timeout that kills its process tree by pid. Lint, test and the new `standards run-locked -- <cmd>` take one machine-wide lock (`~/.coord/locks/heavy-check.lock`, exported as `@drizztdourden08/standards/lock`), so only one heavy check runs at a time. `standards test [changed|pr|e2e] [--base <ref>]` runs only the tests related to the changed files, filtered by the tags `critical`, `standard` and `e2e`, and no mode runs the whole project. `@drizztdourden08/standards/vitest` exports `defineStandardsVitest`, the shared vitest config with the three tags and their timeouts. The rule `local/test-has-one-tag` fails a test with no tag, two tags or an unknown tag. `templates/package-scripts.json` holds the script block, and the README and `docs/test-standard.md` describe the standard.

## 0.12.0

### Minor Changes

- c1ff2d0: A module folder may hold `<subject>.usage.ts`, the note on when to use the module, where the subject is the folder name, as a component folder holds `Name.usage.ts`. A usage file named after another subject is still rejected, and the shape error now lists the form. The usage file stays optional in a module folder: the Tessera rule that requires `Name.usage.ts` covers component folders only. The form is in `docs/structure.md`.

## 0.11.0

### Minor Changes

- dae1aff: `local/no-tool-brand-words` takes the `skipStringValues` option, off unless set, and a file listed under `verbatimText: [{ files, why }]` now skips string values for it and for `local/no-em-dash`, `local/no-smart-punctuation` and `local/no-slop-prose`. Text copied word for word from an outside source can spell a banned tool or vendor name in another language, such as a word in a French dictionary entry. Comments, the header, JSX text and identifiers of a listed file are read as before by every rule, the vendor-name rule included. The rule is in `docs/structure.md`.

## 0.10.0

### Minor Changes

- 3739813: A source file that holds text reproduced word for word from an outside source (a game's dialogue table, a licence text, the strings a protocol defines) can be listed under `verbatimText: [{ files, why }]` in the ESLint factory; the factory refuses an entry without a `why`. In a listed file, `local/no-em-dash`, `local/no-smart-punctuation` and `local/no-slop-prose` skip string literals and the text parts of template literals, through their new `skipStringValues` option, which has no default. Comments, the header, JSX text and identifiers are read as before, and `local/no-tool-brand-words` does not take the option, so vendor names stay banned in those strings. The header tag may now name a source after the kind, `/* @layer <layer> @kind <kind> @source <short text> */`, and `local/file-header` and `local/no-comments` accept it. The rule is in `docs/structure.md`.

## 0.9.0

### Minor Changes

- 00ad561: A test may assert the real text an app shows. In a `*.test.*` or `*.spec.*` file, a string that is the argument of a matcher called on `expect(actual)` (directly, in an array or object value, or in an asymmetric matcher such as `expect.stringContaining`) is not read by `local/no-em-dash`, `local/no-smart-punctuation` or `local/no-slop-prose`, so `expect(toast.text).toBe('File saved!')` passes. The actual value, test names, every other string in the test and the same text in source code are read as before, and `local/no-tool-brand-words` still reads the expected value. The rule is in `docs/structure.md`.
- 00ad561: `local/no-slop-identifiers` takes an `allow` option, and the ESLint factory fills it from the same `allow` list the prose rules read: `options.allow` in `standards.config.mjs`, `allow` in the factory call, and every `prose` facet. A declared name passes when it equals an entry whole and in its exact case, so a product name (`AdvancedEdition`) or a key that saved files already hold (`layoutV2`) passes without a disable, and `AdvancedSearch` beside it is still reported. The list and its examples are in `docs/structure.md`.

## 0.8.0

### Minor Changes

- 694d7a3: The release note standard. Every release has `release-notes/v<version>.md`: a `# <Product> v<version>` title, a one-paragraph summary, `##` sections from a fixed list (New, Changes, View, Settings, Around the app, Platforms, Under the hood, Upgrading, Fixes, plus the ones a repo or a `releaseNotes` facet adds) and plain-English bullets that pass the writing gate. `standards release-notes check [version]` holds a repo to it, and `draft`, `version`, `body` and `current` serve the release workflow; `@drizztdourden08/standards/release-notes` exports the same functions. `defineExtension` takes a `releaseNotes: { sections, product }` facet, and `standards.config.mjs` takes `options.releaseNotes` (`sections`, `product`, `package`). The format is in `docs/release-notes.md`.
- 45eac87: The reusable workflows carry the release note standard. `release.yml` runs `release-notes version` in place of the version command, so the version pull request holds a draft `release-notes/v<version>.md` written from the changelogs; after the merge it refuses to publish while that note is a draft or malformed, then creates the GitHub release `v<version>` from it in place of one changeset release per package. `ci.yml` runs `release-notes check`. Both take a `release-notes` input naming the command (`pnpm exec standards release-notes` by default), and an install without the command keeps the old behaviour with a notice.

## 0.7.0

### Minor Changes

- f5b1249: New `knip` facet: `defineExtension` takes `knip: { compilers, entry }`, where `compilers` maps a file extension to `(text, path) => string` and `entry` is a list of patterns or a function of the run context. `standards knip` now writes `node_modules/.cache/standards/knip.config.mjs` in place of the cached `knip.json`, and knip reads it through `--config`. The module loads the extensions of the repo, runs the compilers several extensions give one file extension in load order, and joins their entries into `entry`. A repo whose extensions have no knip facet gets the same config as before.

## 0.6.0

- Standards moves to 0.x, like every package of the family: versions stay below 1.0 and bump minor for a breaking change and patch for a fix. 0.6.0 holds everything 1.0.5 did. Depend on `^0.6.0`, and call the shared workflows at `@v0`.
- `standards sync --check` reports any changeset that asks for a major bump.

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
