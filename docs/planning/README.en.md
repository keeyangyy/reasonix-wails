# Reasonix Wails

> **Status: preparing independent maintenance; the new repository and its official releases are not yet published.**
>
> An independently maintained, **unofficial** Windows desktop derivative of [DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix). The project retains the applicable upstream MIT license and attribution; it is not an official Reasonix distribution.

[简体中文](README.zh-CN.md) · [Implementation plan (中文)](docs/IMPLEMENTATION_PLAN.md) · [Decisions (中文)](docs/DECISIONS.md)

## Overview

Reasonix Wails will turn the existing [`wails-mine`](https://github.com/keeyangyy/DeepSeek-Reasonix/tree/wails-mine) codebase into a dedicated **Windows x64** Go + Wails + WebView2 AI-agent desktop application. Its goal is to preserve the capable Go agent core and its desktop workflows while removing product surfaces that are no longer needed: standalone CLI/TUI releases, Serve/Web remote workspaces, SSH/SFTP, ACP integration, upstream-hosted cloud services, and non-Windows desktop release targets.

This derivative will have **its own repository, installer identity, issues, releases, and update channel**. It will not impersonate or update the upstream application.

## Planned capabilities

- **Agents and models:** multiple providers, configurable API endpoints, quality presets, Output Styles, permissions, Guardian review, Hooks, slash commands, Skills, and plugin commands.
- **Conversations:** streaming, long-session virtualization, parallel tabs, Inbox/Steer, task monitoring, search, Todo, checkpoints/undo, Markdown/KaTeX, code and diff views, attachments, and export to Markdown/JSON/PDF/PNG.
- **Context and memory:** context budgets, manual/automatic compaction, long-term memory and retrieval, compatible session/history indexing.
- **Development tools:** local Windows terminals (PowerShell, CMD, Bash), Git Worktree, LSP, image understanding, `web_search`, and `web_fetch`.
- **Extensions and automation:** MCP manual configuration, Extension Protocol sidecars, existing Reasonix/Codex/Claude plugin formats, IM bots, Heartbeat, and related background task monitoring.
- **Desktop experience:** system tray, notifications, customizable shortcuts, themes, typography, scaling, Simplified/Traditional Chinese and English, onboarding, and WebView2 failure recovery.

These are **confirmed target features**, not claims that a new independent release has already passed validation.

## Two-stage implementation

| Stage | Scope |
| --- | --- |
| **1. Independent Windows product** | Preserve Git history, create the independent repository and Windows installation identity, remove unused services/targets, establish the Windows installer/portable update/release pipeline, and verify Studio data compatibility. Keep the existing frontend architecture largely intact. |
| **2. Conversation/frontend architecture** | Incrementally refactor the Wails bridge, session state ownership, streaming projection, transcript virtualization, scrolling and recovery. Preserve agent capabilities and on-disk compatibility. |

See [the executable milestone plan](docs/IMPLEMENTATION_PLAN.md) and [the complete decisions](docs/DECISIONS.md).

## Windows distribution and updates (planned)

- Windows x64 NSIS installer **and** versioned portable ZIP, both under a separate product/install identity.
- Portable in-place updates retain signature verification and failure recovery.
- Stable/Beta use the **existing single fixed release anchor and client-side filtering algorithm**, rather than a newly designed dual-anchor system.
- Releases and update manifests move to the independent repository, retaining strict Minisign and payload-integrity verification. Authenticode is optional.
- Local, redacted diagnostics only; no automatic crash/telemetry uploads to upstream or other services.
- **Shared user data, separate application processes:** required Reasonix Studio-compatible configuration, sessions, memories and plugins stay interoperable; installer files, registry entries, runtime locks and product-specific/rebuildable caches stay isolated. Uninstalling this desktop app must never erase shared Studio data.

The proposed default installation root is `%LOCALAPPDATA%\Programs\Reasonix-Wails`, and the proposed desktop executable is `reasonix-wails.exe`. These are **proposed names**, not yet a completed migration. The shared user-data root is intentionally **not renamed**.

## What is not distributed

This project will not ship standalone CLI/TUI builds, Serve/Web remote UI, SSH/SFTP remote workspaces, ACP adapters, npm/Homebrew CLI packages, or the former Cloudflare cloud backends. This does **not** remove the local terminal, Go agent runtime, MCP, model HTTP requests, SDKs, or developer-only test runners.

## Development baseline

The independent repository is planned as `keeyangyy/reasonix-wails` on `main`, preserving the complete ancestry of `wails-mine`. As verified in the source branch, the baseline uses Go `1.26.0` (`toolchain go1.26.10`), pnpm `10.34.5`, React/TypeScript/Vite, Wails v2, NSIS and WebView2. Reproducible **new-repository** build commands will be documented only after the Stage 1 baseline audit and first successful build; do not use upstream release/npm installation instructions for this product.

## Provenance and license

Upstream: [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix). Existing customization branch: [keeyangyy/DeepSeek-Reasonix · wails-mine](https://github.com/keeyangyy/DeepSeek-Reasonix/tree/wails-mine). Keep upstream and third-party license/copyright notices, including the MIT license. The MIT license does not automatically grant trademark rights or a separate license for logos/brand assets; verify naming and artwork permissions before public release. The derivative must clearly identify itself as unofficial.

Issues, download links, website links, release badges and build instructions will be updated when the new repository and its pipelines are operational.
