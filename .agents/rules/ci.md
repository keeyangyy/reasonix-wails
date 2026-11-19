# CI 与 workflow

以 `.github/workflows/` 和 `scripts/ci-classify-changes.sh` 为准；本文件记录分类规则和门禁边界。

## 入口与检查

| 文件 | 触发 | 职责 |
|---|---|---|
| `ci.yml` | 所有 PR、push main、手动 | **唯一 CI 入口**；分类后调度必要检查，产生唯一 `gate` |
| `pr-metadata.yml` | PR opened/synchronize/reopened/ready_for_review/edited | 可信元数据工作流；一个 `pr-metadata` Job 顺序执行 docs/cache/Blast Radius 声明检查 |
| `ci-full.yml` | 手动、每日定时 | 全量代码、桌面、SDK、CodeQL 与 memory 回归 |
| `check-changes.yml` | 入口调用 | 调用分类脚本输出 code / desktop / sdk / workflow / full |
| `check-docs-rules.yml` | 入口调用 | repolint、发行说明目录检查 |
| `check-lint.yml` | 入口调用 | Go/桌面 lint 与 workflow 契约检查（按输入执行） |
| `check-go.yml` | 入口调用 | Go 测试、race、coverage、漏洞、SDK（按输入执行） |
| `check-desktop.yml` | 入口调用 | 前端、Linux/Wails 编译和桌面原生回归 |
| `check-codeql.yml` | 入口调用 | 按涉及语言运行 CodeQL |
| `check-memory.yml` | main push、手动/定时 full、full PR | 内存筛查；Release 不重复执行 |
| `pr-auto-label.yml` | 每个 PR | 自动标签（独立辅助流程） |

## 分类

- **docs**：普通 Markdown、说明、计划与发行说明，运行 docs-rules + pr-metadata + CodeRabbit + gate。
- **workflow**：`.github/workflows/**`、`.github/actions/**`、CI 分类器、PR 元数据校验脚本及其回归测试，运行 actionlint、契约测试与 Actions CodeQL；不运行 Go/Desktop。
- **code**：普通根模块源码，运行 Go lint、测试、race、coverage 与 CodeQL；根模块可能影响桌面，需验证其编译。
- **desktop**：`desktop/**` 改动，运行前端及完整桌面回归。
- **sdk**：`sdk/**` 运行 SDK 专项；`internal/extension/**` 同时影响根模块和 SDK。
- **full**：main push、手动运行、`release/*` PR 执行全量代码验证并行执行 memory；定时/手动 `ci-full.yml` 也执行全部检查。Release 只等待该 main push CI，不重复测试。
- **目录例外**：`docs/**`、`benchmarks/**` 内的源码（例如 `docs/embed.go`、`benchmarks/compaction/main.go`）也归入代码；未知路径默认按代码处理，避免漏检。

PR 用 base/head 的 merge-base 比较，而不是对 GitHub 合成的 PR merge commit 与旧 base 直接比较。`git diff --no-renames --name-only -z` 保留重命名两端并按 NUL 读取路径，避免中文、空格、引号和换行导致误分类。任何无法计算 diff 的情况都应失败。

一个 PR 可同时涉及多类修改，按分类并集执行检查，但只启动一次 `ci.yml` 和一个 `gate`。元数据由独立 `pr-metadata.yml` 检查，不取消或重跑代码 CI。

## 门禁

- Ruleset required：`gate`、`PR metadata / pr-metadata` 与 `CodeRabbit`；无 bypass；只允许 squash；未解决的 review 线程不得合并。Strict status checks 保持关闭。
- `gate` 只汇总 CI 检查：`changes` 和 `docs-rules` 必须 success；选中的 lint/Go/Desktop/CodeQL/Memory lane 必须 success，未选中的 lane 必须 skipped。PR 元数据不属于此 Gate。
- `pr-metadata` 是独立的必需检查，一个 Job 顺序执行 `docs-impact`、`cache-impact` 和 `Blast-radius` 声明验证。它在 PR 创建、提交更新和描述编辑时运行。
- `pr-metadata.yml` 使用 `pull_request_target`，只 checkout PR base SHA 并执行 base 分支中的可信脚本；禁止 checkout 或执行 PR head 中的不可信代码。其独立 concurrency group 只取消旧的元数据运行，不影响 `ci.yml`。
- `docs-impact` 仅在用户可见产品文件变化时要求 Documentation-impact；`cache-impact` 仅在缓存敏感文件变化时要求 Cache-impact / Cache-guard，系统提示词敏感改动还要求 System-prompt-review。
- 每个 PR 都必须声明 `Blast-radius: local|cross-component|broad - reason`。CI 只验证唯一声明、合法等级和非空理由；影响范围是否低估由 CodeRabbit/人工审查判断，不能按文件数量自动推断。
- 可复用 workflow 内按需跳过不相关任务；Gate 检查预期的 success/skipped，避免漏检。
- `CodeRabbit` 保持独立必需状态；不强制 CodeRabbit Approve，意见按现有阻塞机制处理。
- `metrics` 仅在代码、SDK、工作流改动或 main push 执行；`prune-cache` 只在 main push 执行，均不属于 required gate。

## Release 安全约束

- Release 只复用目标 tag commit 对应的官方 main-push CI 成功结果，不重复执行 Memory。
- 版本 Release 必须先以 draft 准备二进制、签名、不可变版本 manifest 和版本目录，全部准备完成后才公开。
- 已公开的版本 Release 资产不可被重跑覆盖。普通发布流程遇到已公开版本必须失败，不得对版本资产使用 `--clobber`。
- 如果版本 Release 已公开但 `wails-latest` 锚点更新失败，手动 dispatch `build-release-windows.yml`，传入 `tag` 和 `anchor_only=true`。该模式跳过构建与版本资产上传，验证并复用已公开版本的 `latest.json`，只更新可变锚点和版本目录。
- `wails-latest` 是可变更新锚点，不得成为 GitHub 仓库 Latest Release；创建或公开时都显式使用 `--latest=false`。

## 回归测试

`node --test scripts/ci-classify.test.mjs scripts/ci-workflow.test.mjs` 覆盖中文、特殊文件名、混合 YAML、源码重命名、嵌在文档目录里的代码、SDK、Release、并发更新 base 后的 merge-base 行为，以及 CI Gate 动态 lane、PR metadata 单 Job、Blast Radius 声明和 Release 发布顺序的契约。`check-lint.yml` 的工作流检查执行这些测试。
