---
'@drizztdourden08/standards': patch
---

`standards lint` gives stylelint the style files git lists, in batches, as it does for ESLint. A full run no longer walks the whole folder tree for `**/*.css`, which could pass the 180 s limit in a repo with many worktrees or linked `node_modules`. Without git, it falls back to the configured globs.
