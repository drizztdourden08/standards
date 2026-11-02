---
"@drizztdourden08/standards": patch
---

The heavy check lock no longer waits on a dead holder whose pid another process took over. A holder counts as alive only if its pid exists and that process began no later than the time in the lock plus 2 s. The lock now records `processStartedAt`. The start time of a live process is read with `ps -o etime=` on Linux and macOS and with `cscript` and a small WMI script on Windows, with no shell and no PowerShell. When the start time cannot be read, a pid that exists still counts as alive. This holds for the slot files and for a legacy `heavy-check.lock`.
