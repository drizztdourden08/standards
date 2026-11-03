---
"@drizztdourden08/standards": patch
---

`standards test pr` now works in a shallow clone, such as the one actions/checkout makes for a pull request. When no base branch is known, it fetches the base from origin first. The branch name comes from STANDARDS_BASE, then GITHUB_BASE_REF, then main. When the merge base is missing in a shallow repository, it deepens the clone by 200 commits, up to 5 times, and tries again. A failed fetch keeps the old failure message and adds the reason.
