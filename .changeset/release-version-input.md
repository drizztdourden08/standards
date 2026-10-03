---
'@drizztdourden08/standards': patch
---

The reusable release workflow takes `version` and `publish` inputs (defaults `pnpm changeset version` and `pnpm changeset publish`), so a repo that stamps files after versioning can use it. MIGRATION-CONSUMERS notes that ESLint 10 lints a fixture with its own nested `eslint.config.mjs`.
