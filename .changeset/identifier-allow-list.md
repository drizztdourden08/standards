---
'@drizztdourden08/standards': minor
---

`local/no-slop-identifiers` takes an `allow` option, and the ESLint factory fills it from the same `allow` list the prose rules read: `options.allow` in `standards.config.mjs`, `allow` in the factory call, and every `prose` facet. A declared name passes when it equals an entry whole and in its exact case, so a product name (`AdvancedEdition`) or a key that saved files already hold (`layoutV2`) passes without a disable, and `AdvancedSearch` beside it is still reported. The list and its examples are in `docs/structure.md`.
