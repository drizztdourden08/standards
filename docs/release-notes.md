<!-- @layer docs @kind doc -->
# Release notes

Every release of every drizztdourden08 repo has a release note. It is one hand-written markdown file per version, written for the people who use the release. An app shows it in its updater and on its GitHub release; a library shows it on its GitHub release. The format is the same everywhere, and `standards release-notes check` holds every repo to it. Brock apps run the same check as `brock release-notes check`.

## The file

`release-notes/v<version>.md` at the repo root, one per version: `release-notes/v0.9.0.md` for 0.9.0, `release-notes/v1.0.0-beta.1.md` for a pre-release. A repo that releases several products on their own versions keeps each product's notes in its folder, `<product folder>/release-notes/v<version>.md`, as a Brock workspace with several apps does; the format is the same.

```md
# Atlas v1.2.0

The map opens where you left it, and two crashes on start are gone.

## View

- The map opens on the last place you looked at.
- Zoom keeps its level when the window is resized.

## Fixes

- The app no longer closes on start when a profile is empty.
```

| Part | Rule |
|---|---|
| Comment lines | Optional, before the title only: a `<!-- @layer docs @kind doc -->` header. They never reach a release body. |
| Title | The first line: `# <Product> v<version>`. The version is the file's. The product is `options.releaseNotes.product` (Brock apps: `product.name`) when one is configured. |
| Summary | One paragraph right under the title: what the release changes for the people who use it. |
| Sections | `##` headings only, each holding at least one bullet. A section may open with a sentence or two before its bullets, and may hold a fenced code block. |
| Section names | `New`, `Changes`, `View`, `Settings`, `Around the app`, `Platforms`, `Under the hood`, `Upgrading`, `Fixes`, plus the ones a repo adds (below). Each appears once; `Fixes` comes last. `Downloads` is reserved: the release workflow adds it. |
| Bullets | A dash and a space at the start of the line, one level deep. |

## Plain English

Each bullet, each section sentence and the summary is a sentence for a user, not a commit message:

- It opens with a capital letter (or a digit, a quote, a code span or a link) and ends with `.`, `!` or `?`.
- It holds no commit hash, no `#123` issue or pull request number, no `feat:` or `fix:` prefix, no `Minor Changes` or `Patch Changes` changelog heading, and no raw HTML.
- It passes the writing gate: the same word lists and patterns as ESLint, markdownlint and `standards prose`, with the repo's own `allow` and `banned` words.

Code spans and fenced code are not read as prose.

## Repos add sections

A repo with areas of its own (an emulator's `Controllers`, a game's `Save states`) allows them in `standards.config.mjs`, or an extension brings them with its `releaseNotes` facet:

```js
export default defineStandards({ options: { releaseNotes: { product: 'Relic of the Past', sections: ['Controllers', 'Save states'] } } });

export default defineExtension({ id: 'pads', releaseNotes: { sections: ['Controllers'] } });
```

`options.releaseNotes.package` names the package whose version names the release when a repo publishes packages at different versions.

## The version being released

`standards release-notes current` prints it: the root package version when the root is published, else the one version every published workspace package shares (a fixed changeset group). A named version always needs its note. Without one, the check needs the note of the current version as soon as the repo has any note at or below it, so a repo starts the standard with its first note and keeps it from then on. The check reads that note and every newer one; older notes are history and stay as they were written.

## The command

```
standards release-notes check [version]   the format, and that the note exists
standards release-notes draft [version]   write a draft from the CHANGELOG entries of that version
standards release-notes version           run the version command, then draft the note of the new version
standards release-notes body <version>    the note without its comment lines, for a release body
standards release-notes current           the version the repo releases
```

A draft opens with `<!-- release-notes: draft -->`. The check rejects it until someone rewrites the bullets for users and deletes the marker.

## Libraries released with changesets

The reusable `release.yml` (`drizztdourden08/standards/.github/workflows/release.yml@v0`) carries the notes through the changeset flow:

1. With changesets pending, it runs `release-notes version` in place of `changeset version`: the repo's own version command (the `version` input) runs first, then the draft of the new version is written. The version pull request carries `release-notes/v<version>.md` beside the changelogs.
2. Someone rewrites the draft in that pull request and deletes the marker. Its CI does not run on its own (a pull request opened by the workflow token starts no workflow), so read the draft in the diff.
3. After the merge, the run checks the note of the version about to publish before it publishes. A draft or a malformed note stops the run there; fix it on the default branch and the next run publishes.
4. It publishes, then creates (or updates) the GitHub release `v<version>` with the note as the body, in place of one changeset release per package.

The `release-notes` input names the command: `pnpm exec standards release-notes` by default, `pnpm exec brock release-notes` in Brock, `node bin/standards.mjs release-notes` in this repo. An install without the command (standards before 0.8.0) keeps the changeset releases and says so. The reusable `ci.yml` runs `release-notes check` with the same input.
