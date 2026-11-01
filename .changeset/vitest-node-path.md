---
"@drizztdourden08/standards": patch
---

`defineStandardsVitest` drops the `NODE_PATH` that pnpm's bin shims export, so a test that builds a folder without a package no longer finds the repo's own copy through `.pnpm/node_modules`.
