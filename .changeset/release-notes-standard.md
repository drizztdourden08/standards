---
'@drizztdourden08/standards': minor
---

The release note standard. Every release has `release-notes/v<version>.md`: a `# <Product> v<version>` title, a one-paragraph summary, `##` sections from a fixed list (New, Changes, View, Settings, Around the app, Platforms, Under the hood, Upgrading, Fixes, plus the ones a repo or a `releaseNotes` facet adds) and plain-English bullets that pass the writing gate. `standards release-notes check [version]` holds a repo to it, and `draft`, `version`, `body` and `current` serve the release workflow; `@drizztdourden08/standards/release-notes` exports the same functions. `defineExtension` takes a `releaseNotes: { sections, product }` facet, and `standards.config.mjs` takes `options.releaseNotes` (`sections`, `product`, `package`). The format is in `docs/release-notes.md`.
