<!-- @layer docs @kind doc -->
# Moving a repo onto @drizztdourden08/standards

Brock switches on its branch `agent/standards`. This page lists the exact changes for Tessera and Archipelia, and the GitHub steps the owner takes once the `drizztdourden08/standards` repo exists. Until the package is published, a repo links the local checkout with `link:X:/standards`; once it is published, the same line becomes `^1.0.0`.

## Tessera

Tessera is a design system: it takes the `design-system` preset and lists its own extension, `./standards.extension.mjs`, which reads `tessera.config.json` for the usage file check, `primitivesGlobs` and the theme token file. Standards ships no usage extension any more. It needs no Brock package for its rules after this change.

### devDependencies

```diff
-    "@drizztdourden08/brock-build": "^0.1.0",
-    "@drizztdourden08/brock-lint-config": "^0.1.0",
+    "@drizztdourden08/standards": "^1.0.0",
-    "eslint-plugin-react-hooks": "^7.1.1",
-    "typescript-eslint": "^8.60.1",
```

`eslint`, `stylelint` and `typescript` stay: they are the peers. `typescript-eslint` and `eslint-plugin-react-hooks` go, because standards carries them and knip reports them unused otherwise. `stylelint-config-standard`, `knip`, `jscpd` and `markdownlint-cli2` stay, so the scripts keep Tessera's own versions. Before the package is published, use `"@drizztdourden08/standards": "link:X:/standards"`.

### scripts

```diff
-    "lint": "pnpm typecheck && eslint . && stylelint \"src/**/*.css\" \"fonts/**/*.css\" \"stories/**/*.css\" && brock prose && knip && jscpd",
+    "lint": "pnpm typecheck && eslint . && stylelint \"src/**/*.css\" \"fonts/**/*.css\" \"stories/**/*.css\" && standards prose && knip && jscpd",
-    "structure": "brock structure --check",
+    "structure": "standards structure --check",
-    "prose": "brock prose",
+    "prose": "standards prose",
+    "sync": "standards sync --check",
```

### standards.config.mjs (new, at the root)

```js
/* @layer root-config @kind config */
import { defineStandards } from '@drizztdourden08/standards';

export default defineStandards({
  presets: ['design-system'],
  extensions: ['./standards.extension.mjs'],
  options: {
    eslint: {
      rawControls: [
        { selector: "JSXOpeningElement[name.name='input']", message: 'No raw <input> outside primitives. Use TextInput / NumberInput / Checkbox / RangeInput.' },
        { selector: "JSXOpeningElement[name.name='select']", message: 'No raw <select> outside primitives. Use Select / NativeSelect.' },
        { selector: "JSXOpeningElement[name.name='textarea']", message: 'No raw <textarea> outside primitives. Use TextArea.' },
      ],
    },
  },
});
```

`rawControls` keeps the messages that name Tessera's own components; without it the core messages name the design system in general. Discovery reads dependencies only, so Tessera lists the extension its own `package.json` declares; every app that installs Tessera gets it with no line at all. The extension requires `Name.usage.ts` in the `parts` folders of `tessera.config.json` (`src/primitives` and `src/composites`), so the line lands with the usage files or right after them.

### eslint.config.mjs

```diff
-import { brockEslint } from '@drizztdourden08/brock-lint-config';
+import { standardsEslint } from '@drizztdourden08/standards/eslint';
 ...
-export default brockEslint({
+export default standardsEslint({
   ignores: ['dist-storylite/**'],
-  primitivesGlobs: ['src/primitives/**/*.tsx'],
   defaultExportGlobs: ['.storylite/config.ts'],
```

`primitivesGlobs` comes from Tessera's extension, built from the `parts` of `tessera.config.json`; the preset no longer names a folder; the rest of the file (consoleGlobs, glyphContent, inlineStyle) stays as it is. A read-only run of the new factory over the tree reports no file without the `@layer … @kind …` header.

### stylelint.config.mjs

```diff
-import { brockStylelint } from '@drizztdourden08/brock-lint-config/stylelint';
+import { standardsStylelint } from '@drizztdourden08/standards/stylelint';
 ...
-const base = brockStylelint({
+const base = standardsStylelint({
```

The factory stays synchronous, so `export default { ...base, overrides: [...base.overrides, logoScalesByEm] }` keeps working. The token rules used to add `@drizztdourden08/tessera/tokens.css` on their own; in Tessera that sheet is `src/tokens/index.css`, which `tokenGlobs` already covers, so no `tokens` option is needed.

### .markdownlint-cli2.mjs

```diff
-import { brockMarkdownlint } from '@drizztdourden08/brock-lint-config/markdownlint';
+import { standardsMarkdownlint } from '@drizztdourden08/standards/markdownlint';
 
-export default brockMarkdownlint();
+export default standardsMarkdownlint();
```

### tsconfig.json

```diff
-  "extends": "@drizztdourden08/brock-lint-config/tsconfig/react.json",
+  "extends": "@drizztdourden08/standards/tsconfig/react.json",
```

### knip.json and .jscpd.json

`knip.json` needs no change: `ignoreDependencies` is empty and the entries do not name Brock. `standards sync --check` reports two lines of `.jscpd.json`; add both globs to its `ignore`:

```diff
-  "ignore": ["**/node_modules/**", "**/dist/**", "**/out/**", "**/release/**", "**/.brock/**", "**/.user-data/**", "fonts/**", "splash-tokens.css"],
+  "ignore": ["**/node_modules/**", "**/dist/**", "**/out/**", "**/release/**", "**/.brock/**", "**/.user-data/**", "fonts/**", "splash-tokens.css", "**/fonts/**", ".worktrees/**"],
```

`.npmrc` and `.changeset/config.json` already match the templates.

### CI, once the standards repo exists

```yaml
# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  gate:
    uses: drizztdourden08/standards/.github/workflows/ci.yml@v1
    permissions:
      contents: read
      packages: read
    with:
      scripts: lint lint:md structure test storylite:build
```

```yaml
# .github/workflows/release.yml
name: release
on:
  push:
    branches: [main]
concurrency: release
jobs:
  release:
    uses: drizztdourden08/standards/.github/workflows/release.yml@v1
    permissions:
      contents: write
      packages: write
      pull-requests: write
```

## Archipelia

Archipelia is a Brock app workspace. It keeps `brock-lint-config` and `brock-build`, which now sit on standards, so its configs do not change: `brockEslint`, `brockStylelint` and `brockMarkdownlint` keep their names, and `brock structure` and `brock prose` keep their output. What changes is how it gets the packages. It lists no usage extension: installing Tessera is enough, and Tessera's extension reads the root `tessera.config.json` for the usage file check in `packages/design` and the views of each app, `primitivesGlobs` and the theme token file.

### Version ranges instead of link specs

Once Brock's packages and standards are published, every `link:X:/brock/...` spec becomes the published range, in the root and in each workspace package:

```diff
-    "@drizztdourden08/brock-lint-config": "link:X:/brock/packages/lint-config",
-    "@drizztdourden08/brock-build": "link:X:/brock/packages/build",
-    "@drizztdourden08/brock-thread": "link:X:/brock/packages/thread",
+    "@drizztdourden08/brock-lint-config": "^0.2.0",
+    "@drizztdourden08/brock-build": "^0.2.0",
+    "@drizztdourden08/brock-thread": "^0.2.0",
+    "@drizztdourden08/standards": "^1.0.0",
```

The same goes for `brock-core`, `brock-electron`, `brock-react` and `brock-secrets` in `apps/desktop` and the packages. The Brock version is the one the changesets on `agent/standards` produce (a minor bump of the fixed group). `@drizztdourden08/standards` is a direct root devDependency so `standards sync --check` runs from the root scripts; pnpm then resolves one copy for the Brock packages and the root. The `ignoreDependencies` entries for `brock-lint-config` and `brock-thread` in `knip.json` exist because of the `link:` specs and go with them.

While Archipelia still links `X:/brock`, the linked `packages/lint-config` resolves standards through Brock's own `node_modules`; once `agent/standards` merges, run `pnpm install` in `X:\brock` before linting Archipelia.

### Shared files

`standards sync --check` reports two drifts: `.npmrc` lacks `@drizztdourden08:registry=https://npm.pkg.github.com` (needed as soon as the packages come from GitHub Packages), and `.jscpd.json` lacks `**/fonts/**` in `ignore`. Add a `"sync": "standards sync --check"` script.

### CI

Archipelia has no workflow yet. When it gets one, it calls `ci.yml@v1` from the standards repo the same way as Tessera, with `scripts: lint lint:md structure test`.

## GitHub steps for the owner

1. Create the private repo `drizztdourden08/standards` and push `X:\standards` (`main`). The history starts with the `brock-lint-config` commits.
2. Release 1.0.0: the `self` workflow runs the gate and then the reusable release workflow, and `changeset publish` publishes `@drizztdourden08/standards@1.0.0` to GitHub Packages, since that version is not there yet. Tag the commit `v1` (and move the tag on later 1.x releases) so consumers can pin `@v1`.
3. Package access: on the package page (`github.com/users/drizztdourden08/packages/npm/package/standards`), under Package settings, Manage Actions access, add `brock`, `tessera` and `archipelia` with the Read role, so their workflows install it with `GITHUB_TOKEN`. Keep the `standards` repo itself as Admin (it publishes). Add any future consumer repo the same way.
4. Reusable workflows: in the standards repo, Settings, Actions, General, Access, choose "Accessible from repositories owned by the user drizztdourden08". A private repo's workflows cannot be called from another repo without it.
5. Brock, after the publish: remove the `overrides` entry `'@drizztdourden08/standards': 'link:X:/standards'` from `pnpm-workspace.yaml`, run `pnpm install` so the lockfile records 1.0.0, and drop `@drizztdourden08/standards` from `ignoreDependencies` in `knip.json` (it is there only because of the link).
6. Brock's CI switch: replace the `gate` job of `.github/workflows/ci.yml` with `uses: drizztdourden08/standards/.github/workflows/ci.yml@v1` and `scripts: lint lint:md structure test app:build`; keep the `upgrade` job, which only Brock runs. Replace `release.yml` with the reusable release workflow as shown for Tessera.
7. Local machines already authenticate to GitHub Packages for the Brock packages (`read:packages`); the same token installs standards.
