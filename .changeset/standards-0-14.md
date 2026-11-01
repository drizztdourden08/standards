---
"@drizztdourden08/standards": minor
---

Four asks from the projects. `local/test-has-one-tag` reads the browser test form `{ tag: '@critical' }` and covers `*.e2e.*` specs and the `tests` and `e2e` folders. The code lint runs in batches of at most 1000 files, one process at a time, each under `--max-old-space-size` (4096 MB, `STANDARDS_LINT_HEAP_MB` overrides). The `./vitest` and `./lock` exports ship type declarations. The knip facet takes `preprocessors`, absolute paths that `standards knip` passes as `--preprocessor`.
