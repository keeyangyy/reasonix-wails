# CI and release execution

[中文](CI_PERFORMANCE.zh-CN.md)

## Workflow layout

`ci.yml` is the single entry for all PRs and pushes to main. The path
classifier selects only the applicable documentation, workflow, Go, SDK and
desktop checks; main pushes run a complete code baseline, but skip the memory lane.
`ci-full.yml` runs the nightly
and manually triggered complete sweep. The `gate` requires selected lanes to
succeed and unselected lanes to be skipped. Branch protection requires both
`gate` and `CodeRabbit`.

The work itself lives in reusable workflows — `check-changes`,
`check-docs-rules`, `check-lint`, `check-go`, `check-desktop`, `check-codeql`,
`check-memory` — so each file has one responsibility and can be debugged on its
own. A reusable workflow cannot read the caller's `changes` job, so diff flags
arrive as inputs; it also cannot raise permissions above the caller's, which is
why the entry points grant `security-events: write` for the CodeQL lane.

## Desktop PR checks

`desktop / desktop-prepare` generates Wails bindings and builds the Linux
frontend once. Its artifact is consumed by the independent
`desktop / desktop-frontend`, `desktop / desktop-browser` and
`desktop / desktop-go` jobs. The `desktop` aggregate inside `check-desktop.yml`
rejects failures, cancellations and unexpected skips, and accepts a path-based
skip only when the changes detector succeeds; `gate` then requires that
aggregate together with every other lane.

`node desktop/frontend/scripts/run-ci-tests.mjs --list` prints the unit test
plan. It expands the existing dedicated scripts and lifecycle hooks, discovers
new tests, and schedules each TypeScript suite once with its original loader.
Unsupported script syntax and conflicting explicit invocations fail closed.
CI runs two isolated processes at a time; the history performance benchmark
runs alone after them. Local dedicated `pnpm test:*` commands remain available.

## Memory screening

Protocol v2 still requires three independent processes, each completing
128 full, 128 windowed, 128 safety and 512 mixed round trips, with the same
checkpoints, five heap snapshots, GC, frame settling and screening thresholds.
Only the explicit mock memory-soak URL removes the fixture's artificial
1.5-second hydration latency. Hydration still crosses an asynchronous timer
task. Default browser and native geometry fixtures retain the delayed path.

The pointer rests outside topic rows and the warmed baseline follows a complete
round trip after layout switching, avoiding samples of temporary menu state.
Reports declare the protocol, and aggregation rejects older protocols.
`timings.json` records host-side counts, total time and maximum time for
navigation, frame settling, GC and heap capture/analysis. Short profiling runs
are diagnostic only and cannot pass the complete screening gate. A green gate
still does not prove offline heap-retainer attribution.