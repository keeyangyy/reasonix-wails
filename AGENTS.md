# Reasonix Wails

Windows 桌面编码 Agent，单 exe 分发，基于 Go + Wails v2 + WebView2。本仓库是独立项目，不跟随上游 Electron 桌面架构。

## 定位

- 只发 Windows amd64 桌面端；保留 CLI 与 ACP 入口，不做 serve / web / remote。
- 单 exe，自更新走本仓库 `wails-latest`；安装版可选。
- 上游 `esengine/DeepSeek-Reasonix` 已于 2026-11-12 归档（最终 v2.61.0）；本仓库不再同步上游，也不再向上游提 PR。

## 开工顺序

1. 读本文件。
2. 按 Rules Index 读对应规则。
3. 改 `desktop/frontend` 前必须读 [.agents/rules/desktop.md](.agents/rules/desktop.md)。

## 高频红线

- 不擅自发版；发版只能由用户明确发起。
- 不主动跑完整测试或完整构建；本地只做改动相关的快速预检，完整测试交云端 CI。
- 系统提示前缀（base prompt + tools + memory）必须字节稳定；不要中途改写。
- 注释默认不写，只写 why；行数与 repolint 门禁不得放宽基线。
- 仓库在开发机；本机不在共享盘上执行 git、构建、测试或全库搜索。

## Rules Index

| 何时 | 读什么 |
|---|---|
| 写/改 Go、注释、分层、缓存相关 | [code.md](.agents/rules/code.md) |
| 分支、worktree、提交、PR、合并 | [workflow.md](.agents/rules/workflow.md) |
| 提交前本地预检 | [precheck.md](.agents/rules/precheck.md) |
| 证明功能正确、修 bug、GUI 验证 | [testing.md](.agents/rules/testing.md) |
| 用户要求发版 | [release.md](.agents/rules/release.md) + [docs/ops/RELEASING.md](docs/ops/RELEASING.md) |
| CI 红了、改 workflow | [ci.md](.agents/rules/ci.md) |
| 需要对照上游历史实现 | [upstream.md](.agents/rules/upstream.md) |
| 改 desktop 前端（尤其 transcript 滚动） | [desktop.md](.agents/rules/desktop.md) |
| 排查踩过的坑 | [experiences.md](.agents/rules/experiences.md) |
| 查已知技术风险与回归点 | [docs/analysis/技术风险与回归点.md](docs/analysis/技术风险与回归点.md) |

## 工作区

- 主仓库：开发机 `<dev-host>` 上的仓库根（`main`）。
- worktree：开发机 `<worktree-root>/<project>-devN`。
- 本机经共享盘只读写文件；git、构建、测试、全库搜索一律在开发机执行。

## 文档

- 产品文档：`docs/guide/`（用户）、`docs/spec/`（契约）、`docs/design/`（实现设计）、`docs/ops/`（发布与运维）。
- 开发台账：`docs/decisions/`、`docs/analysis/`、`docs/archive/`。
- 架构导航：`docs/architecture.md`。
