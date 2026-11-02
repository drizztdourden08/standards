---
"@drizztdourden08/standards": patch
---

The heavy check lock no longer waits on a dead holder whose pid another process took over. A running holder now rewrites the modification time of its lock file every 10 s and records `heartbeat: true` in it. A holder is alive only if its pid exists and, when the lock has `heartbeat: true`, the file was touched in the last 60 s. A lock without `heartbeat` (a slot file from 0.14.6 or older, or a legacy `heavy-check.lock`) keeps the old rule: the pid existing means alive. This holds for the slot files and for a legacy `heavy-check.lock`. The check reads no process start time, so it runs no script host.
