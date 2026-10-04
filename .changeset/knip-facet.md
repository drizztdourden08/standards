---
"@drizztdourden08/standards": minor
---

New `knip` facet: `defineExtension` takes `knip: { compilers, entry }`, where `compilers` maps a file extension to `(text, path) => string` and `entry` is a list of patterns or a function of the run context. `standards knip` now writes `node_modules/.cache/standards/knip.config.mjs` in place of the cached `knip.json`, and knip reads it through `--config`. The module loads the extensions of the repo, runs the compilers several extensions give one file extension in load order, and joins their entries into `entry`. A repo whose extensions have no knip facet gets the same config as before.
