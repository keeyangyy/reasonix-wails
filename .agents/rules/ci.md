# CI 与 workflow

以 `.github/workflows/` 当前文件为准；本文件只记结构、职责与排查口径。

## 结构

三个入口监听事件，其余文件都是被调用的可复用检查。入口只负责"哪个场景"，检查内容放在复用文件里，便于单独排查。

| 文件 | 类型 | 触发 | 职责 |
|---|---|---|---|
| `ci-docs.yml` | 入口 | PR，diff 全在文档路径 | 文档档：`check-changes` + `check-docs-rules` + `gate` |
| `ci-code.yml` | 入口 | PR（非文档路径）、push main、手动 | 代码档：全部检查 + `gate` |
| `ci-full.yml` | 入口 | 手动、每晚 cron | 全量：全部检查 + `check-memory` + `gate` |
| `check-changes.yml` | 复用 | 被入口调用 | 判定 code / desktop / desktop_direct / full / sdk / workflow |
| `check-docs-rules.yml` | 复用 | 同上 | repolint（文档与注释规范） |
| `check-lint.yml` | 复用 | 同上 | gofmt / golangci / wails pin / 契约脚本 |
| `check-go.yml` | 复用 | 同上 | test / race / coverage / govulncheck / windows-control / sdk |
| `check-desktop.yml` | 复用 | 同上 | prepare / frontend / browser / go / windows / windows-go + desktop 汇总 |
| `check-codeql.yml` | 复用 | 同上 | 三语言安全扫描 |
| `check-memory.yml` | 复用 | 同上 | 前端内存筛查（prepare / shard×3 / aggregate） |
| `pr-metadata.yml` | 独立 | `pull_request_target` | PR 正文字段（docs-impact、cache-impact）与自动打标签 |
| `release.yml` | 独立 | 手动 | 校验资格 → 打 tag → 建 draft → dispatch 构建 |
| `build-release-windows.yml` | 独立 | tag / 手动 | 构建 / 签名 / 上传 / 转正 |
| `build-windows.yml` | 复用 | 被 `build-release-windows` 调用 | 纯构建 |
| `spam-comment-guard.yml` | 独立 | `issue_comment` | 折叠垃圾评论 |

## 档位

| 档 | 判定 | 跑什么 | 时长 |
|---|---|---|---|
| docs | diff 全在 DOC 路径 | docs-rules + metadata + gate | <40 秒 |
| workflow | 命中 `.github/workflows/` | docs-rules + lint（actionlint + 契约脚本）+ gate | 2–3 分钟 |
| code（根模块） | 有代码改动，不含 `desktop/` | docs-rules + lint + go + codeql + gate；桌面只编译 | 10–14 分钟 |
| code（含 desktop） | 命中 `desktop/**` | 上面 + 桌面完整矩阵 | 28–30 分钟 |
| full | 手动 / 每晚 | 全部 + memory | 约 23 分钟 |

DOC 路径：`docs/**`、`plan/**`、`.agents/**`、`release-notes/**`、`benchmarks/**`、`tmp/**`、根级 `*.md`、`LICENSE`、`.gitignore`、`.gitattributes`、`.editorconfig`、`.coderabbit.yaml`、`.github/ISSUE_TEMPLATE/**`、`.github/pull_request_template.md`、`.github/labeler.yml`、`.github/dependabot.yml`。

`ci-docs.yml` 的 `paths` 与 `ci-code.yml` 的 `paths-ignore` 必须完全一致，否则同一个 PR 会同时启动两个入口、产生两个 `gate`。

## 门禁

- required 只有 `gate`；ruleset 另外锁 squash、线程必须 resolve、合并后删除 head 分支、bypass 为空。
- **不允许 skipped**：gate 用 `jq -e 'all(.[]; .result == "success")'` 判定，失败、取消、跳过一律算失败。
- 新增 job 时不要用 job 级 `if` 做按需（会留下灰色 skipped），改成 `always()` + job 级 `env` + 步骤级 `if`。
- 可复用工作流读不到 caller 的 `changes`，diff 判定必须通过 `inputs` 传入；它也不能超过 caller 的 `permissions`（CodeQL 需要入口文件授予 `security-events: write`）。

## 已知例外

- **纯 workflow 改动的 PR**：走 `ci-code`，此时 `desktop=false`，桌面四条 Linux lane 以 `skipped` 结束，`desktop` 汇总按 `desktop` 输出判为通过。这类 PR 不涉及桌面代码，强制 `always()` 只会多起四个空 job；`gate` 仍然要求其余 lane 全绿。
- **同时改文档与代码的 PR**：`ci-docs` 的 `paths` 与 `ci-code` 的 `paths-ignore` 是互补而非互斥（`paths` 任一命中即触发），所以会同时启动两个入口，产生两个同名 `gate`。GitHub 对同名 required check 要求全部 success，两个都绿才放行；合并前看 `gh pr checks` 里 `gate` 出现几行即可确认。

## 失败与重跑

- 先分类：真回归、环境差异、已知 flake。重跑、同提交云端结果、基线证据一起看。
- 手工重跑：`gh run rerun <run-id> -R keeyangyy/reasonix-wails --failed`。自动重跑已移除——它会把真实失败洗成假绿。
- 未知故障先保留现场，不直接改代码。

## 本地盲区

- 前端全量 Vitest 可能压满本机；优先跑相关文件，必要时限制 worker 数。
- 开发机是 session 0，没有桌面；Wails 窗口类验证要投递到用户会话，或改用浏览器 mock。
- Windows Go 测试的历史 flake 与 `GOMAXPROCS` 设置有关；出现相同症状再核对，不要当成固定规则。

## 变更记录

- 2026-11-18：拆成 3 入口 + 7 个可复用检查 + 单一 `gate`；required 从 7 项缩为 1 项；ruleset 锁 squash、清空 bypass、要求线程 resolve；`pr-metadata` 合并两个门卫并改为每个 PR 都运行；`plan/` 纳入文档档；`release.yml` 让内存筛查与"等 CI 绿"并行。