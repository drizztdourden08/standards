<!-- @layer docs @kind doc -->
# Code structure

One structure for every repo of the family: Tessera, Brock, Archipelia and the apps built on Brock. A file has one obvious home and a boundary cannot be crossed by accident. The rules are enforced by pnpm, `@drizztdourden08/standards` (its ESLint, stylelint and markdownlint rules) and `standards structure`, not by memory. A Brock repo runs the same checks as `brock structure` and `brock prose`, which add Brock's own extension.

## Top level

```
<repo>/
  pnpm-workspace.yaml     packages, catalog of shared versions, overrides
  package.json            root scripts only: lint, lint:md, structure, test, build; no source
  standards.config.mjs    optional: presets, extensions and options for the shared rules
  apps/<app>/             deployables: desktop, mobile, web, site
  packages/<subject>/     one package per bounded context, named after the subject
  tooling/<tool>/         repo scripts, one package each
  docs/                   contributor docs only
  core/                   non-TS code when the repo has any
```

## A package

```
packages/<subject>/
  package.json            name "<scope>/<subject>", exports { ".": "./src/index.ts" } and at most a few subpaths
  src/index.ts            the only public surface
  src/<feature>/<Name>/   Name.tsx, Name.css, Name.type.ts, behavior/, sub-components/, index.ts
  tests/                  the package's own tests
```

A package is one subject. A second subject is a second package. A package with fewer than five files merges into its neighbour.

## A file holds one thing

Every implementation file holds exactly one thing, and its companions sit beside it under its own name. `standards structure` checks the folders; six eslint rules check the files on every write.

```
shell/TitleBar/                       a component folder: recognised by TitleBar/TitleBar.tsx
├── TitleBar.tsx                      one component, imports only ./TitleBar.css
├── TitleBar.css
├── TitleBar.type.ts                  every type and interface of the component
├── TitleBar.constants.ts             every UPPER_SNAKE constant
├── TitleBar.usage.ts                 when to use the component (allowed everywhere; an extension such as Tessera's requires it)
├── behavior/
│   ├── useTitleBar.ts                one hook, named after the file
│   └── title-bar-class.ts            one pure function, kebab-case
├── sub-components/
│   ├── PinButton.tsx                 flat: one component with no companion
│   └── WindowControls/               grew a companion: same shape one level down
└── index.ts                          export { TitleBar } from './TitleBar'

settings/features/                    a module folder: no .tsx of its own name
├── resolver.ts                       export { createFeatureResolver }
├── setting-lock.ts                   export { createSettingLock }
├── feature.type.ts
├── feature.constants.ts
└── index.ts
```

| Rule | Enforced by |
|---|---|
| Every file opens with its header tag, `/* @layer <layer> @kind <kind> */` (after a shebang when there is one) | `local/file-header` |
| One component per `.tsx`; the second one is `sub-components/<Name>.tsx` | `local/one-component-per-file` |
| One exported value per implementation file; `index.ts`, `*.type.ts` and `*.constants.ts` are the lists | `local/one-export-per-file` |
| `type` and `interface` live in `*.type.ts` (`augment.ts` and `*.d.ts` too) | `local/types-in-type-file` |
| `UPPER_SNAKE` constants live in `*.constants.ts` | `local/constants-in-constants-file` |
| A `useX` hook lives alone in `useX.ts` | `local/hook-file-named-after-hook` |
| A component imports only `./<Name>.css`; theme and token sheets are imported by the entry | `local/css-beside-component` |
| A component folder holds `Name.tsx`, `index.ts` and, optionally, `Name.css`, `Name.type.ts`, `Name.constants.ts`, `Name.usage.ts`, `behavior/`, `sub-components/`, plus the files an extension adds; a flat component is `Name.tsx`; a module folder holds kebab-case `.ts` files, `useX.ts`, `<subject>.type.ts`, `<subject>.constants.ts`, `index.ts`, plus the forms an extension adds | `standards structure` |
| In a Tessera app, every component folder of the `parts` folders in `tessera.config.json` holds `Name.usage.ts`, the note on when to use the component; Tessera's extension adds the check | `standards structure` |
| Stories, tests and config files are exempt from the shape rules; a file that is a list by nature goes under `shapeOff: [{ files, why }]` | the ESLint factory |

## Where raw values live

Three tiers of stylesheet, declared in `stylelint.config.mjs`:

| Tier | Option | May hold |
|---|---|---|
| Raw values | `rawValueGlobs` (the palette, the brand colours, the size scale, font faces) | hex colours, `px` and `rem` lengths |
| Tokens | `tokenGlobs` (`theme.css`, `tokens/**`) | custom properties whose values derive from the raw tier through `var()`, `color-mix()`, `calc()`; `em` only for `--tracking-*` |
| Components | `uiGlobs` (everything else) | `var(--token)` only; a component may alias a token into its own custom property |

Shared component sheets (a field layout used by several composites) live in `theme/` or `tokens/` and are imported once by the package entry; a component imports only its own sheet. A repo without a raw tier leaves `rawValueGlobs` out and its token files stay exempt as a whole.

## A token override says why

A stylesheet that is not a token file and sets a custom property whose name is a token gets a warning from `brock/no-token-override`; a new property that repeats a token's value gets one from `brock/no-token-shadow`. The token names come from the repo's `tokenGlobs` and from the sheets listed in the `tokens` option (a package path such as `@drizztdourden08/tessera/tokens.css`, or a file path), following each `@import` chain, so nothing drifts from the CSS. Brock apps get Tessera's sheet from Brock's extension; a repo sets its own through `options.tokens` in `standards.config.mjs` or the stylelint factory. A warning does not fail the gate. An override that is right stays, with its reason in the one comment form the CSS gate accepts:

```css
/* stylelint-disable-next-line brock/no-token-override -- dense table rows, agreed with design */
.table--dense { --space-sm: var(--space-xs); }
```

A disable without a reason fails (`reportDescriptionlessDisables`).

## Rules

| Rule | Enforced by |
|---|---|
| Import another package by its alias, `@scope/subject`, through its barrel | `local/no-cross-package-relative`, `local/no-deep-package-import`, pnpm strict `node_modules` |
| Every package is named `<scope>/<subject>` and has `exports["."]` pointing at a real file | `standards structure` |
| No folder named `lib`, `utils`, `helpers`, `misc` or `common`; name the subject | `local/no-generic-folder-names`, `standards structure` |
| Nothing deeper than five levels below `src` | `standards structure` |
| No comments, in TS, JS and CSS alike. A comment passes only when it has a working form: the first-line header tag, a tool directive on the allow list (`DEFAULT_COMMENT_ALLOW`, extended per repo through `comments.allow`), and a JSDoc type block in plain JavaScript, which has no other type syntax | `local/no-comments`, stylelint `comment-pattern` |
| A JSDoc type block is types, not prose: every line starts with a type tag (`@param`, `@returns`, `@typedef`, `@property`, `@type`, `@template`, `@callback`, `@import`), at most 10 lines, the note after a tag at most 60 characters and never a sentence. No description line. A `.ts` file carries no JSDoc at all | `local/no-comments` |
| No raw HTML outside the design-system primitives. Every screen is built from design-system components (`Box`, `Text`, `Flex`, `Button`, ...), and a missing piece becomes a new primitive in the design system, not a `<div>` in the app | `local/no-raw-html`, off only under `primitivesGlobs` |
| No `style` prop outside the primitives. A justified exception is listed in `eslint.config.mjs` as `inlineStyle: [{ files, why }]`; the factory refuses an entry without a `why` | `local/no-inline-style` |
| Tokens only in CSS: no hex, named, `rgb()` or `hsl()` colour, no `px`, `rem` or `em` outside a media query, no numeric `font-weight` or `z-index`, no `font-family` but a token, and a custom property set only to another token. Raw values live in the token files (`tokenGlobs`); a documented exception goes under `exemptGlobs` | `@drizztdourden08/standards/stylelint` |
| 200 lines per file, one thing per file, arrow functions, exports grouped at the end, `import type`, raw form controls only in primitives | `@drizztdourden08/standards/eslint` |
| Small units: cyclomatic complexity 10, 60 lines per function, 4 parameters, nesting depth 3, 3 nested callbacks. A function over the line is split at a real seam, never in half | `complexity`, `max-lines-per-function`, `max-params`, `max-depth`, `max-nested-callbacks` |
| No generated-code shapes: no `console` outside a CLI (`consoleGlobs`), no empty block or silent `catch {}`, no nested ternary, no `as any`, no `as unknown as T` outside a listed boundary (`doubleCast: [{ files, why }]`), no default export outside stories, extension modules and the globs a repo lists, no `React.FC`, no enum, no class component, no `@ts-ignore` (`@ts-expect-error` with a reason) | `eslint/quality-rules.mjs`, `@eslint/js` recommended, typescript-eslint recommended and stylistic |
| Typed checks on every `.ts` and `.tsx` (the project service reads the nearest tsconfig, so tests and stories must be in an `include`): no floating or misused promise, no `await` on a non-promise, no `async` without `await`, no condition the types already decide, no unnecessary assertion, `??` and `?.` where they apply, exhaustive `switch`, no `any` leaking through arguments, assignments, calls, member access or returns, no deprecated API. `typed: false` in the config turns the layer off for a repo that cannot carry it yet | `TYPED_RULES` in `eslint/quality-rules.mjs` |
| The rules of hooks in a React repo | the `react-app` and `design-system` presets |
| No dead code: every export is imported somewhere, every file is reachable from an entry, every dependency is used and every used package is declared. Entries per workspace live in `knip.json` | `knip` (`pnpm deadcode`) |
| No duplicated code: no two blocks of 5 lines or 50 tokens alike across TS, JS and CSS | `jscpd` (`pnpm duplicates`), `.jscpd.json` from `jscpd/base.json` |
| Exports are the last statements of a file; nothing follows the export block | `local/exports-last` |
| No generated names: no `Helper`, `Util`, `Wrapper`, `Impl`, `Temp`, `V2` suffix, no `Enhanced`, `Improved`, `New`, `Simple`, `My` prefix, no `foo`, `tmp`, `dummy`, no numbered copies. A name says what the thing is for | `local/no-slop-identifiers` |
| No generated prose anywhere: dashes, smart quotes, emoji and glyphs, hedges (`you may want to`, `for now`, `should work`), stock phrases, connectors, filler adverbs, placeholders (`in a real app`, `implementation goes here`), exclamation marks, and the words a repo bans through a `prose` facet. Applies to comments, strings, JSX text, Markdown, and through `standards prose` to every other tracked text file (json, yaml, toml, html, svg, txt, config files) | `local/no-em-dash`, `local/no-smart-punctuation`, `local/no-slop-prose`, `BROCK001-006`, `standards prose` |
| Markdown has no template shape: no `Overview`, `Summary`, `Key features` or `Conclusion` heading, no `- **Label:** text` bullet runs, no emoji headings | `BROCK004`, `BROCK005`, `BROCK006` |
| Shared files match the templates: `.npmrc`, the changeset config, `.jscpd.json`, `knip.json`, and one copy of `@drizztdourden08/standards` per install | `standards sync --check` |
| Dependency direction is one way: apps depend on packages, packages on lower packages, nothing on an app | the package.json graph |
| Tests live in the package they test; e2e in `apps/<app>/tests`; `*.keep.test.ts` marks a kept test | vitest workspace |

## Exceptions are written down, never silent

Every gate has one place for a justified exception, and that place is the repo's config file, where a review sees it:

```js
export default standardsEslint({
  primitivesGlobs: ['packages/ui/src/primitives/**/*.tsx'],
  inlineStyle: [{ files: ['packages/ui/src/composites/Slider/**'], why: 'thumb position is a live value' }],
  comments: { allow: ['^\\s*\\*?\\s*@generated\\b'] },
  rawColorOffGlobs: ['packages/palette/**'],
});
```

Two more forms, both with a `why`: `glyphContent: [{ files, why }]` in `eslint.config.mjs` for a file whose data is emoji or glyphs (an emoji icon primitive and its stories), and `.proseignore` at the repo root for a verbatim third-party text file that `standards prose` must not read, one entry per line as `<glob>  <why>`:

```
src/fonts/LICENSE.txt   the font's licence, CC BY 3.0, travels unchanged
src/fonts/README.txt    the font author's notes, travel unchanged
```

An `eslint-disable` line in a source file is the wrong place: it hides the exception where nobody looks for it. When a rule is wrong for a whole class of files, the fix is in `@drizztdourden08/standards`, or in the extension that owns the rule, not a disable in the consumer.

## What a repo adds

A repo adds rules through one extension API, described in the README: component files, module file forms, folders it checks itself, structure checks, ESLint and stylelint additions, markdownlint rules and prose words. An extension ships with the package that needs it and loads when that package is installed; a repo lists its own in `standards.config.mjs`.

## pnpm

- `workspace:*` between packages of the repo; `catalog:` for every shared version; one line in `pnpm-workspace.yaml` bumps a dependency everywhere.
- `pnpm -r --filter "./packages/**" lint` runs a script in every package; `--filter "...^@scope/x"` runs it in what depends on `x`; `--filter "[origin/main]"` in what changed on the branch.
- An unpublished sibling repo is linked with an `overrides` entry `"@drizztdourden08/tessera": "link:../tessera"` for a local session, removed once the package is published.
