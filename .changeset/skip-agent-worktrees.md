---
'@drizztdourden08/standards': patch
---

ESLint and stylelint skip `.claude/worktrees/**`, where Claude Code keeps agent worktrees, as they already skip `.worktrees/**`.
