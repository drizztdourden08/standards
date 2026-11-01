---
"@drizztdourden08/standards": patch
---

`standards test` compares with the local default branch when `origin/HEAD` points at a branch that the local one has moved past, so a local-first repo no longer lists every unpushed commit as changed. `--base` and `STANDARDS_BASE` still win. The related files go to vitest in batches of at most 24000 characters, so hundreds of changed files no longer fail with `spawn ENAMETOOLONG` on Windows. The exit code is the first failure of any batch.
