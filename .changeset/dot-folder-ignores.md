---
"@drizztdourden08/standards": patch
---

Every folder that needs ignoring is a dot-folder. `templates/gitignore` ignores them all with `.*/` and lists the tracked ones as exceptions, and `standards sync --check` reports a `.gitignore` that lacks `.*/` or names one dot-folder it already covers. The explicit dot-folder ignores are gone from the ESLint, jscpd and prose configs; git supplies them. New `standards knip` runs knip with the git-ignored paths under `ignore` and `--no-gitignore`, so knip works inside a work tree that lives in a dot-folder; `standards lint` uses it.
