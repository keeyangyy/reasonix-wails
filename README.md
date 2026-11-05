<p align="center">
  <img src="docs/logo-ghost-wave-effect.svg" alt="Reasonix" width="360"/>
</p>

<h1 align="center">Reasonix Wails</h1>

<p align="center">
  <strong>Based on the Wails desktop code of Reasonix 1.x, independently maintained.</strong>
</p>

<p align="center">
  A coding agent that runs on your computer: read code, edit files, run commands and tests.<br />
  Windows desktop only — no CLI, TUI, browser UI or ACP integration.
</p>

<p align="center">
  <strong>English</strong>
  &nbsp;·&nbsp;
  <a href="./README.zh-CN.md">简体中文</a>
  &nbsp;·&nbsp;
  <a href="./docs/GUIDE.md">Guide</a>
  &nbsp;·&nbsp;
  <a href="./docs/planning/IMPLEMENTATION_PLAN.md">Implementation plan</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/keeyangyy/reasonix-wails/issues">Issues</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/keeyangyy/reasonix-wails.svg?style=flat-square&color=8b949e&labelColor=161b22" alt="license"/></a>
</p>

---

## What this is

Reasonix Wails was forked from the **Wails desktop phase of Reasonix 1.x (`main-v2`)**. Upstream 1.x is still maintained, but its desktop app has since moved to Electron as well, and 2.x (Studio) uses Electron too. This project stays on the Go + Wails + WebView2 form, maintains its own features, and no longer follows upstream desktop-architecture changes.

How it relates to upstream:

| | Upstream 1.x | Upstream 2.x (Studio) | This project |
| --- | --- | --- | --- |
| Desktop stack | Wails early, Electron now | Electron | **Wails** |
| Main entry | CLI + desktop | Desktop | **Desktop only** |
| Status | Still maintained | Still in development | Independently maintained |
| Releases | Upstream | Upstream | **This repository** |

This is not an official Reasonix release; features and release cadence are decided here. The original copyright, MIT license and contributor credits are preserved.

## What you can do

| Code with context | Stay in control | Extend your workflow |
| --- | --- | --- |
| Read a repository, edit files, run commands and tests, inspect changes and results | Preview a plan first, approve tool permissions, rewind file edits by turn | Connect MCP tools, load skills, use compatible plugins and extensions |

In more detail:

- **Models and providers**: DeepSeek presets, any OpenAI-compatible endpoint, custom APIs and model switching.
- **Sessions**: parallel tabs, streaming output, Inbox / Steer, history search, todos, checkpoints and rewind, export (Markdown / JSON / PDF / PNG).
- **Context and memory**: context budgets and compaction, long-term memory and retrieval, local history index.
- **Local tools**: Windows terminal (PowerShell / CMD / Bash), Git worktrees, LSP, file references and attachments, image understanding, `web_search` / `web_fetch`.
- **Extensions and automation**: MCP, Extension Protocol sidecar, Reasonix / Codex / Claude plugin compatibility, hooks, slash commands, IM bots, heartbeat.
- **Desktop**: tray, notifications, shortcuts, themes, font and scaling, zh-CN / zh-TW / en, WebView2 failure detection and recovery.

## Download and install

**No public release yet.** The first version will ship after the independence work is complete, as:

- an NSIS installer (per-user, no admin rights)
- a versioned portable ZIP

Installation identity is separate from upstream Reasonix and older Wails builds: own install directory, uninstall entry, shortcuts and single-instance lock. They can coexist. **Existing installs are never migrated or overwritten automatically.**

> The first release is planned as `0.1.0`, with update metadata served from this repository. It will not update itself to an upstream build.

## Build from source

Requires **Go 1.26+**, **Node 24+**, **pnpm 10** and the **Wails v2 CLI** (matching `.wails-version`).

```sh
git clone git@github.com:keeyangyy/reasonix-wails.git
cd reasonix-wails
make wails-install
cd desktop
wails build
```

Frontend only:

```sh
cd desktop/frontend
pnpm install
pnpm build
```

## Data and privacy

- The agent runs locally. Your configured model provider only receives the context needed for a request.
- Config, sessions and memory live in `%APPDATA%\reasonix` by default, shared with Reasonix Studio. This project will not rewrite that data without verified compatibility.
- **No automatic upload of crash reports, telemetry or session content**: the related endpoints are empty in the current code; diagnostics stay local and can be exported manually.
- Separate install identity, data isolation and compatibility verification are still in progress; see the [implementation plan](./docs/planning/IMPLEMENTATION_PLAN.md).

## Documentation

- [Guide](./docs/GUIDE.md)
- [Config paths](./docs/CONFIG_PATHS.md)
- [Checkpoints and rewind](./docs/CHECKPOINTS.md)
- [Capability diagnostics](./docs/CAPABILITY_DIAGNOSTICS.md)
- [Bot guide](./docs/BOT_GUIDE.md)
- [Extensions and plugins](./docs/EXTENSIONS.md)
- [Baseline audit](./docs/BASELINE_AUDIT.md) · [Decisions](./docs/planning/DECISIONS.md) · [Implementation plan](./docs/planning/IMPLEMENTATION_PLAN.md)

`docs/` in this repository is the single source of truth for documentation.

## Credits

This project builds on [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) 1.x. Thanks to the original authors and all upstream contributors; see the [upstream contributor list](https://github.com/esengine/DeepSeek-Reasonix/graphs/contributors?all=1).

Thanks also to [Bernardxu123](https://github.com/Bernardxu123) for the project icon.

## License

MIT, see [LICENSE](./LICENSE). Original copyright notices are preserved.
