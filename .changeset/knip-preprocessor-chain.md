---
"@drizztdourden08/standards": patch
---

`standards knip` passes knip a single `--preprocessor`. knip 5.88 crashes with `id.startsWith is not a function` on a second one, and the git-ignored hints plus any extension preprocessor made two. When there is more than one, standards writes a chain module under `node_modules/.cache/standards` that runs them all in order.
