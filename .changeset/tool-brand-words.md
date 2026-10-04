---
"@drizztdourden08/standards": patch
---

Ban tool and vendor names: a new `TOOL_BRAND_WORDS` list runs as `local/no-tool-brand-words` in ESLint, `BROCK007` in markdownlint, in `standards prose` and in every caller of `findSlop`. `local/no-slop-identifiers` reports the same names as camelCase or snake_case segments. The slop rule descriptions no longer name a tool kind. Every check now skips what git ignores, asked from git itself so `.git/info/exclude` and the global excludes file count; the hard-coded agent worktree folders are gone from the ESLint, stylelint, jscpd and prose ignores.
