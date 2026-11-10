# Reasonix documentation

<a href="../README.md">README</a>
&nbsp;·&nbsp;
<a href="./guide/GUIDE.zh-CN.md">简体中文指南</a>

This directory is the product documentation bundled into every build. Files are
filed by purpose; each area keeps its own documents flat, with an English file
and its `zh-CN` counterpart side by side.

## Areas

| Area | What lives here | Start with |
| --- | --- | --- |
| [`guide/`](./guide/) | Setup, configuration, providers, models, sessions, permissions, extensions, themes | [`guide/GUIDE.md`](./guide/GUIDE.md) |
| [`spec/`](./spec/) | Contracts the code must follow: tool, task, reasoning, extension protocol, app shell, management pages | [`spec/SPEC.md`](./spec/SPEC.md) |
| [`design/`](./design/) | How the internals work: session ownership, transcript, catalogs, subagents, billing, extensions runtime | [`design/SESSION_OWNERSHIP.md`](./design/SESSION_OWNERSHIP.md) |
| [`ops/`](./ops/) | Release, recovery, production checklists and signing operations for maintainers | [`ops/RELEASING.md`](./ops/RELEASING.md) |
| [`assets/`](./assets/) | Screenshots, mocks and diagram sources referenced by the documents | — |
| [`eval/`](./eval/) | Optional paired evaluations, not release gates | — |
| [`research/`](./research/) | Design notes that describe the current implementation | — |
| [`superpowers/`](./superpowers/) | Specs and golden fixtures kept for tests | — |

## Conventions

- A document is either **rewritten in place** (the four areas above) or it does
  not belong here. Append-only records — experiment logs, one-off acceptance
  evidence, branch reports — go to the changelog or the pull request instead.
- English and `zh-CN` files live in the same area, so a translation never drifts
  into a different section.
- [`spec/TOOL_CONTRACT.md`](./spec/TOOL_CONTRACT.md) and
  [`spec/EXTENSION_PROTOCOL.generated.md`](./spec/EXTENSION_PROTOCOL.generated.md)
  are generated from the runtime registry; edit the source, not the output.
