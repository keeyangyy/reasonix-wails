<p align="center">
  <img src="docs/logo-ghost-wave-effect.svg" alt="Reasonix" width="360"/>
</p>

<h1 align="center">Reasonix Wails</h1>

<p align="center">
  <strong>Windows desktop coding agent: one exe, ready to run.</strong>
</p>

<p align="center">
  Read code, edit files, run commands and tests — all on your machine.<br />
  No data migration, no upstream desktop-architecture change.
</p>

<p align="center">
  <a href="./README.md">简体中文</a>
  &nbsp;·&nbsp;
  <strong>English</strong>
  &nbsp;·&nbsp;
  <a href="./docs/GUIDE.md">Guide</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/keeyangyy/reasonix-wails/issues">Issues</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/keeyangyy/reasonix-wails.svg?style=flat-square&color=8b949e&labelColor=161b22" alt="license"/></a>
</p>

---

## Introduction

Reasonix Wails is a Windows desktop coding agent: it reads repositories, edits files, runs commands and tests. The UI and its assets are packaged into a single exe that runs without installation.

This project originates from the **Wails desktop implementation on the Reasonix 1.x (`main-v2`) line**. Upstream's desktop app has migrated to Electron, and 2.x (Studio) is built on Electron as well; this project continues on the Go + Wails + WebView2 stack: the UI reuses the system-provided WebView2 without shipping Chromium or Node runtimes, and the current build is a single ~75 MB executable that is smaller, starts faster and uses less resident memory. Features evolve independently on that stack, without following upstream desktop-architecture changes.

Relationship to upstream:

| | Upstream 1.x | Upstream 2.x (Studio) | This project |
| --- | --- | --- | --- |
| Desktop stack | Wails early, Electron now | Electron | **Wails** |
| Shipped as | CLI + desktop | Desktop | **Windows desktop app** |
| Status | Still maintained | Still in development | Independently maintained |
| Releases | Upstream | Upstream | **This repository** |

This is not an official Reasonix release; feature scope and release cadence are decided independently by this repository. The original copyright notices, MIT license and contributor credits are preserved.

## Features

| Code with context | Stay in control | Extend your workflow |
| --- | --- | --- |
| Read a repository, edit files, run commands and tests, inspect changes and results | Review a plan before execution, approve tool permissions item by item, rewind file edits by turn | Connect MCP tools, load skills, use compatible plugins and extensions |

- **Single-file distribution**: the UI and its assets are packaged into one exe — no installer, launcher, version directory or auxiliary files; upgrades replace it in place and roll back to the previous file if the replacement fails.
- **Go + Wails + WebView2: small and fast**: the UI reuses the system-provided WebView2 (the Edge engine) without shipping Chromium or Node runtimes; the current build is a single ~75 MB executable that starts faster and uses less resident memory. When WebView2 is missing, the installer reads the registry during setup and silently runs the embedded bootstrapper only if needed, while the portable build prompts for confirmation on first launch when the runtime is missing or outdated. This process requires network access.
- **Models and providers**: DeepSeek presets, any OpenAI-compatible endpoint, custom APIs and model switching.
- **Sessions**: parallel tabs, streaming output, Inbox / Steer, history search, todos, checkpoints and rewind, export (Markdown / JSON / PDF / PNG).
- **Context and memory**: context budgets and compaction, long-term memory and retrieval, local history index.
- **Local tools**: Windows terminal (PowerShell / CMD / Bash), Git worktrees, LSP, file references and attachments, image understanding, `web_search` / `web_fetch`.
- **Extensions and automation**: MCP, Extension Protocol sidecar, Reasonix / Codex / Claude plugin compatibility, hooks, slash commands, IM bots, heartbeat.
- **Desktop**: tray, notifications, shortcuts, themes, font and scaling, zh-CN / zh-TW / en, WebView2 failure detection and recovery.

## Shared configuration and sessions with upstream

This project, upstream 1.x and Reasonix Studio share the same `%APPDATA%\reasonix` directory (`REASONIX_HOME` overrides it). Shared parts are used in place; sessions that do not belong to this project are left untouched:

- **Configuration file**: the same `config.toml`. Load order is command-line flag > project-level `./reasonix.toml` > user-level `config.toml` > built-in defaults; models and providers already configured in Studio or 1.x carry over directly.
- **Memory and project data**: the same `REASONIX.md`, `memory/`, `skills/`, `plugins/` and other directories under that home are shared by both lines.
- **Session format**: this build writes format 2 (the DAG event log in `<id>.events.jsonl`). Format 1 (before 1.39.0) opens normally, but the first save upgrades it in place to format 2, after which 1.x clients older than 1.39.0 can no longer open that session — the compatibility is one-way.
- **Newer formats**: later 1.x versions continued to evolve the session format; an unsupported version is reported as an error without modifying a single byte.
- **Studio-line sessions**: identified by sidecar keys unique to the other line (`archived`, `superseded`, `imported_from`, `recovery_root_id`) and then skipped: never listed, opened, silently migrated or rewritten.
- **Install identity**: a separate install directory, uninstall entry, shortcuts and single-instance lock, coexisting with upstream and older Wails builds; existing installs are never migrated or overwritten automatically.

## Download and installation

Download from [this repository's Releases](https://github.com/keeyangyy/reasonix-wails/releases). Both forms are based on the same self-contained binary:

- **Portable** `Reasonix-windows-amd64.exe`: download and run directly; the UI and its assets are all contained in that file — no installer, launcher, version directory or auxiliary files.
- **Installer** `Reasonix-windows-amd64-installer.exe`: per-user installation without administrator rights; installs the same exe into its own directory and creates shortcuts and an uninstall entry.

Upgrades happen in place: download the new version → the running file is renamed aside → the new file takes its name → restart; if the replacement fails, the previous file is restored. Update metadata is served by this repository.

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

- The agent runs locally; the configured model provider only receives the context required to complete a request.
- **No automatic upload of crash reports, telemetry or session content**: the desktop build does not wire in the telemetry or crash-report paths; crash and diagnostic data is written to local files only and can be exported manually on demand.
- For how configuration and sessions are shared, and which sessions this project will not open, see "Shared configuration and sessions with upstream" above.

## Documentation

- [Guide](./docs/GUIDE.md)
- [Config paths](./docs/CONFIG_PATHS.md)
- [Checkpoints and rewind](./docs/CHECKPOINTS.md)
- [Capability diagnostics](./docs/CAPABILITY_DIAGNOSTICS.md)
- [Bot guide](./docs/BOT_GUIDE.md)
- [Extensions and plugins](./docs/EXTENSIONS.md)

Product documentation lives in `docs/`; development plans, audits and process notes are kept out of the repository.

## Credits

This project builds on [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) 1.x. Thanks to the original authors and all upstream contributors; see the [upstream contributor list](https://github.com/esengine/DeepSeek-Reasonix/graphs/contributors?all=1).

Thanks also to [Bernardxu123](https://github.com/Bernardxu123) for the project icon.

## License

MIT, see [LICENSE](./LICENSE). Original copyright notices are preserved.
