# CI 与 workflow

以 `.github/workflows/` 当前文件为准；本文件只记职责、粒度与排查口径。

## workflow 职责

| workflow | 职责 |
|---|---|
| `ci.yml` | 主 CI：push / PR 到 `main`，按改动分三档跑 |
| `release-manual.yml` | 手动发版：先跑 app-memory，再校验 release commit 只改文档，等 CI 绿，创建 tag 与 draft Release |
| `release-windows.yml` | tag 驱动：构建 Windows 桌面端、安装器、CLI，签名、上传、写更新清单 |
| `build-windows.yml` | 手动 Windows 构建，也被 `release-windows` 复用 |
| `build-probe-windows.yml` | 手动 canary 诊断构建，平时不跑 |
| `cache-impact.yml` | PR 缓存影响门禁（纯文档路径不触发） |
| `docs-impact.yml` | PR 文档影响门禁 |
| `ci-rerun.yml` | 失败自动重跑（仅带已知 flake 特征的 job） |
| `codeql.yml` | 代码扫描：push / PR / 每周 cron |
| `app-memory.yml` | 前端内存筛查：`workflow_call`（发版调用）+ `workflow_dispatch`，不在 PR 上跑 |
| `release-notes.yml` | PR 校验发布说明文件与脚本（路径过滤） |
| `pr-auto-label.yml` | PR 打开/同步时按路径打 area 标签（`actions/labeler`，无外部 key） |
| `spam-comment-guard.yml` | 防垃圾评论（仅 `issue_comment`） |

## 改动分层

`ci.yml` 的 `changes` 闸门把 diff 分成四类，输出 `code` / `desktop` / `sdk` / `workflow`：

| 类别 | 路径 |
|---|---|
| DOC | `docs/**`、`release-notes/**`、`benchmarks/**`、`tmp/**`、根级 `*.md`、`LICENSE`、`.gitignore`、`.gitattributes`、`.editorconfig` |
| META | `.github/**` 但非 `workflows/`（模板、labeler、dependabot、CODEOWNERS） |
| WF | `.github/workflows/**` |
| CODE | 其他全部 |

实际档位：

| 档 | 判定 | 跑什么 |
|---|---|---|
| docs | 全部 DOC/META | 只有 `lint` 的 repolint + 两个 impact guard + label；Go/桌面各 lane 步骤秒过（job 仍报 success） |
| workflow | 全部 DOC/META/WF 且含 WF | `lint` 全量（actionlint + 契约脚本）、CodeQL actions；Go/桌面跳过 |
| code | 任一 CODE | 全量 |
| release | head 分支 `release/*` | 强制全量 |

## required checks

ruleset `protect-main` 的必需检查（7 项）：

- `test (windows-latest)`
- `race`
- `lint`
- `sdk (windows-latest)`
- `desktop`（汇总 6 条桌面 lane）
- `coverage`（PR 侧根模块全量测试）
- `govulncheck`

规则：

- 必需 job 必须 `if: always()`，靠步骤级 `RUN_STEPS` 门控。job 级 `if` 跳过会让必需检查停在 skipped/Expected，挡住合并。
- 改 job id、matrix 维度或 check 名会让必需检查静默失效，必须同步 ruleset。
- `desktop` 汇总必须覆盖全部桌面 lane（prepare / frontend / browser / go / windows / windows-go）；新增 lane 要同时加进 `needs` 与校验循环。
- `coverage` 是 PR 上唯一的根模块全量测试；`test` 只跑 Windows smoke 子集。
- `govulncheck` 依赖 `go.mod` 的 `toolchain`。升 Go 补丁版本是修 stdlib 漏洞的正规手段，不要用 `continue-on-error` 绕过。
- `cache-impact` / `docs-impact` 因 `paths-ignore` 在纯文档 PR 不触发，设为必需会让那类 PR 卡在 Expected，故保持非阻断；红了仍然给信号。

## 规则

- `ci.yml` 是唯一 required checks 来源；路径过滤只为省时间，不能绕过必需检查。
- 修改 workflow 后，`lint` job 会跑 `actionlint .github/workflows/*.yml` 与契约脚本；本地改完先在开发机跑同一组命令。
- 优化耗时先查关键路径、`needs` 与重复编译成本；先测收益再拆。当前关键路径是 `desktop-windows-go`（约 15 分钟）。
- 自动重跑由 `ci-rerun.yml` 生效；改分类规则时同步 CI 与重跑配置。
- 新增检查先问三件事：是否必需、跳过时是否仍有结论、是否会在纯文档 PR 出现。

## 失败与重跑

- 先分类：真回归、环境差异、已知 flake。重跑、同提交云端结果、基线证据一起看。
- 白名单只表示允许自动重试，不表示失败可以忽略。
- 手工重跑：`gh run rerun <run-id> -R keeyangyy/reasonix-wails --failed`。
- 未知故障先保留现场，不直接改代码。

## 本地盲区

- 前端全量 Vitest 可能压满本机；优先跑相关文件，必要时限制 worker 数。
- 开发机是 session 0，没有桌面；Wails 窗口类验证要投递到用户会话，或改用浏览器 mock。
- Windows Go 测试的历史 flake 与 `GOMAXPROCS` 设置有关；出现相同症状再核对，不要当成固定规则。

## 变更记录

- 2026-11-18：分三档（docs / workflow / code）+ release 强制全量；删 `test` 中永不执行的 gofmt 与全量测试步骤（gofmt 移入 lint）；`coverage`、`govulncheck`、`desktop` 汇总转正为必需；toolchain 升 1.26.11 修 GO-2026-6859；app-memory 改为发版调用；清掉 labeler 的 `internal/codegraph` 死规则。
