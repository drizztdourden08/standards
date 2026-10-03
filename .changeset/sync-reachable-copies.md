---
'@drizztdourden08/standards': patch
---

`standards sync --check` counts only the copies of standards the install reaches, from the root and each workspace package through the scope's packages, so a folder pnpm leaves in `node_modules/.pnpm` after an upgrade is no longer a false "two copies".
