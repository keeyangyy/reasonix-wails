# CI 与 workflow

以 `.github/workflows/` 和 `scripts/ci-classify-changes.sh` 为准；本文件记录分类规则和门禁边界。

## 入口与检查

| 文件 | 触发 | 职责 |
|---|---|---|
| `ci.yml` | 所有 PR、push main、手动 | **唯一 PR 入口**；分类后只调度必要检查，产生一个 `gate` |
| `ci-full.yml` | 手动、每日定时 | 全量代码、桌面、SDK、CodeQL 与 memory 回归 |
| `check-changes.yml` | 入口调用 | 调用分类脚本输出 code / desktop / sdk / workflow / full |
| `check-docs-rules.yml` | 入口调用 | repolint、发行说明目录检查 |
| `check-lint.yml` | 入口调用 | Go/桌面 lint 与 workflow 契约检查（按输入执行） |
| `check-go.yml` | 入口调用 | Go 测试、race、coverage、漏洞、SDK（按输入执行） |
| `check-desktop.yml` | 入口调用 | 前端、Linux/Wails 编译和桌面原生回归 |
| `check-codeql.yml` | 入口调用 | 按涉及语言运行 CodeQL |
| `check-memory.yml` | full / release PR / release 流程 | 内存筛查 |
| `pr-metadata.yml` / `pr-auto-label.yml` | 每个 PR | PR 元数据与标签（独立，不属于 Gate 的 needs） |

## 分类

- **docs**：普通 Markdown、说明、计划与发行说明，运行 docs-rules + PR 元数据 + CodeRabbit + gate。
- **workflow**：`.github/workflows/**`、`.github/actions/**`、CI 分类器及其回归测试，运行 actionlint、契约测试与 Actions CodeQL；不运行 Go/Desktop。
- **code**：普通根模块源码，运行 Go lint、测试、race、coverage 与 CodeQL；根模块可能影响桌面，需验证其编译。
- **desktop**：`desktop/**` 改动，运行前端及完整桌面回归。
- **sdk**：`sdk/**` 运行 SDK 专项；`internal/extension/**` 同时影响根模块和 SDK。
- **full**：main push、手动运行、`release/*` PR 执行全量代码验证；release PR 另加 memory。
- **目录例外**：`docs/**`、`benchmarks/**` 内的源码（例如 `docs/embed.go`、`benchmarks/compaction/main.go`）也归入代码；未知路径默认按代码处理，避免漏检。

PR 用 base/head 的 merge-base 比较，而不是对 GitHub 合成的 PR merge commit 与旧 base 直接比较。`git diff --no-renames --name-only -z` 保留重命名两端并按 NUL 读取路径，避免中文、空格、引号和换行导致误分类。任何无法计算 diff 的情况都应失败。

一个 PR 可同时涉及多类修改，按分类并集执行检查，但只启动一次 `ci.yml` 和一个 `gate`。不再维护两个入口相互覆盖的路径过滤表。

## 门禁

- Ruleset required：`gate` 与 `CodeRabbit`；无 bypass；只允许 squash；未解决的 review 线程不得合并。
- `gate` 要求 `changes` 和 `docs-rules` success；**选中的 lane 必须 success，未选中的 lane 必须 skipped**，否则失败。
- 可复用 workflow 内按需跳过不相关任务；GitHub 页面可能显示正常的 `skipped` 子检查，不代表遗漏。
- `CodeRabbit` check success 不等于正式 Approve；当前 `required_approving_review_count=0`，Ruleset 没有强制指定审查者 Approve。
- `docs-impact`、`cache-impact`、自动标签均是独立 PR 工作流；不在 `gate` 的依赖内，合并前需核验产生的有效检查均无失败。
- `metrics` 仅在代码、SDK、工作流改动或 main push 执行；`prune-cache` 只在 main push 执行，均不属于 required gate。

## 回归测试

`node --test scripts/ci-classify.test.mjs scripts/ci-workflow.test.mjs` 覆盖中文、特殊文件名、混合 YAML、源码重命名、嵌在文档目录里的代码、SDK、Release、并发更新 base 后的 merge-base 行为，以及 Gate 的严格判断。`check-lint.yml` 的工作流检查执行这些测试。
