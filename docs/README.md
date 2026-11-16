# Reasonix documentation

<a href="../README.md">README</a>
&nbsp;·&nbsp;
<a href="./guide/GUIDE.zh-CN.md">简体中文指南</a>

This directory is the product documentation bundled into every build. Files are
filed by purpose; each area keeps its own documents flat, with an English file
and its `zh-CN` counterpart side by side.

## Product areas

These are bundled into every build; a document is either **rewritten in place**
in one of these areas or it is a development record (below).

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

Developer architecture entry: [`architecture.md`](./architecture.md) — main call chain, layers, callback points and boundary rules.

## Development records

Not bundled into the build; kept for maintainers.

| Area | What lives here | Start with |
| --- | --- | --- |
| [`decisions/`](./decisions/) | Major choices: selection, constraints, abandoned routes | [`decisions/README.md`](./decisions/README.md) |
| [`analysis/`](./analysis/) | Technical analysis, evaluations and investigation reports | [`analysis/README.md`](./analysis/README.md) |
| [`archive/`](./archive/) | Retired documents: closed, superseded or no longer maintained | [`archive/README.md`](./archive/README.md) |

## Conventions

- A product document is rewritten in place in the four product areas above.
  Development records — decisions, one-off analyses, branch reports — go to
  `decisions/`, `analysis/` or `archive/`, never into the product areas.
- English and `zh-CN` files live in the same area, so a translation never drifts
  into a different section.
- [`spec/TOOL_CONTRACT.md`](./spec/TOOL_CONTRACT.md) and
  [`spec/EXTENSION_PROTOCOL.generated.md`](./spec/EXTENSION_PROTOCOL.generated.md)
  are generated from the runtime registry; edit the source, not the output.
