# CI 与 workflow

以 `.github/workflows/` 当前文件为准；本文件只记职责与排查口径。

## workflow 职责

| workflow | 职责 |
|---|---|
| `ci.yml` | 主 CI：push / PR 到 `main`；普通 PR 按路径过滤，`release/*` PR 强制全量；docs-only push 只跑轻量 |
| `release-manual.yml` | 手动发版：校验 release commit 只改文档，等轻量 CI 绿，创建 tag 与 draft Release |
| `release-windows.yml` | tag 驱动：构建 Windows 桌面端、安装器、CLI，签名、上传、写更新清单 |
| `build-windows.yml` | 手动 Windows 构建 |
| `build-probe-windows.yml` | 手动 canary 诊断构建 |
| `cache-impact.yml` | PR 缓存影响门禁 |
| `docs-impact.yml` | PR 文档影响门禁 |
| `ci-rerun.yml` | 失败自动重跑 |
| `codeql.yml` | 代码扫描 |
| `app-memory.yml` | 前端内存筛查：仅 `release/*` PR 或手动触发 |
| `release-notes.yml` | PR 校验发布说明文件与脚本 |
| `pr-auto-label.yml` | PR 打开/同步时按路径打 area 标签 |
| `spam-comment-guard.yml` | 防垃圾评论 |

## 规则

- `ci.yml` 是唯一 required checks 来源；PR 路径过滤只为省时间，不能绕过必需检查。
- 修改 workflow 后，对照 lint job 跑实际契约步骤，确认每个必需 job 能从 aggregate 到达。
- 优化耗时先查关键路径、`needs` 与重复编译成本；先测收益再拆。
- 自动重跑由 `ci-rerun.yml` 生效；改分类规则时同步 CI 与重跑配置。

## 失败与重跑

- 先分类：真回归、环境差异、已知 flake。重跑、同提交云端结果、基线证据一起看。
- 白名单只表示允许自动重试，不表示失败可以忽略。
- 手工重跑：`gh run rerun <run-id> -R keeyangyy/reasonix-wails --failed`。
- 未知故障先保留现场，不直接改代码。

## 本地盲区

- 前端全量 Vitest 可能压满本机；优先跑相关文件，必要时限制 worker 数。
- 开发机是 session 0，没有桌面；Wails 窗口类验证要投递到用户会话，或改用浏览器 mock。
- Windows Go 测试的历史 flake 与 `GOMAXPROCS` 设置有关；出现相同症状再核对，不要当成固定规则。
