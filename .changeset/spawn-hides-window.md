---
'@drizztdourden08/standards': minor
---

New lint rule `local/spawn-hides-window`, an error on `js`, `mjs`, `cjs`, `ts` and `tsx` files. A `child_process` call must pass an options object with a `windowsHide` key, so no console window flashes on Windows. Use `true` for a console tool and `false` only for a GUI app whose window must show.
