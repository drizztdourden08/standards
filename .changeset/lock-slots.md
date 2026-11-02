---
"@drizztdourden08/standards": patch
---

The heavy check lock has slots: `heavy-check.0.lock` to `heavy-check.2.lock`, a caller takes the first free one, `STANDARDS_LOCK_SLOTS` sets the count (3 by default), the wait is 1800 s, and the gave up error names every holder. A live `heavy-check.lock` of an older version counts as one holder. `standards test e2e` no longer takes a slot.
