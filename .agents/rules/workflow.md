# 工作流

## 分支模型

- 单一主线 `main`，受保护；所有改动走 PR。
- 分支前缀：`feat/`、`fix/`、`chore/`、`docs/`、`ci/`、`refactor/`；一个主题一个分支。
- release 准备用 `release/vX.Y.Z`，只改 `CHANGELOG.md` 与 `release-notes/**`；该 PR 强制全量 CI，并跑一次 app-memory。
- 不再保留长期并行线；上游已停维，不再有同步线。

## 开发流程

1. `git worktree list` 现场找空闲 worktree（detached HEAD）；被占用的不碰。
2. 绑定已有或新建分支，完成开发与提交。
3. 跑 [precheck.md](precheck.md) 与 [testing.md](testing.md) 的相关部分。
4. 释放 worktree（detach），更新必要的文档台账。
5. 合并回 `main` 或等待其他会话合并；红灯不带入 main。
6. release：代码 PR 全绿后，开 `release/vX.Y.Z` PR，只改 `CHANGELOG.md` 与 `release-notes/**`；release PR 全量 CI + app-memory，确认后合并。合并后的 release commit 只触发轻量 CI，再触发 `release-manual`。

## 提交

- Conventional Commits，英文：`feat:`、`fix:`、`chore:`、`docs:`、`test:`、`ci:`、`refactor:`。
- 一个提交一件事；review 反馈用 amend，避免堆 fixup 提交。
- 不提交 `tmp/`、构建产物、用户数据、密钥。

## PR

- **异步审查要合批处理**：CI 与 CodeRabbit 的结论到达时间不同（CI 约 5–30 分钟，CodeRabbit 约 5 分钟且会基于最新 commit 重审）。先等两边都出结论，再一次性修改提交；中间急着推送只会让两边都重跑，还会让先到的一方基于旧代码重新提意见。
- 一个 PR 一个主题，diff 只含相关文件。
- **required 是两个：`gate` 与 `CodeRabbit`。** `gate` 由入口工作流（`ci-docs` / `ci-code` / `ci-full`）汇总本次运行的顶层 job，任何一项不是 `success` 都会让它失败；`CodeRabbit` 未出结论（pending/cancelled）时同样不能合并。
- **合并门禁：本 PR 产生的所有 check 必须全部通过。**
  - 顶栏应是 `☑️ N/N`（数字随档位变化：docs 约 6、根模块 code 约 20、含 desktop 约 26、full 约 30）。
  - 灰色 `skipped` 在 GitHub 的统计里计入通过，所以可复用工作流内部的子 job 可以用 job 级 `if` 按需跳过；但**顶层必需 job 不能跳过**，它们必须始终给出结论。
  - 任何红项都要处理：要么修代码，要么修检查本身（判定不合理、误报、flaky）。**不允许带着红合并。**
  - 例外仅限：平台 flake 重跑后恢复、第三方服务故障。例外必须在 PR 里写清原因，且不得长期挂着红。
  - 某项长期红 = 系统性问题（真 bug 或检查设计错），当次解决，不能靠下次。
- **合并方式只有 squash**；合并后 head 分支自动删除。
- **没有人可以绕过 gate**：ruleset 的 bypass 名单是空的，包括仓库所有者。
- 未解决的 review 线程会阻止合并：CodeRabbit 或人工的意见要么修，要么回复理由并 `Resolve conversation`。
- PR 正文写清：改了什么、为什么、影响面、验证方式。
- 元数据门禁（以脚本为准）：
  - 缓存敏感改动：`Cache-impact: <none|low|medium|high> - <reason>`、`Cache-guard: <test/command>`。
  - 改 `internal/config/`、`internal/memory/`、`internal/outputstyle/`、`internal/skill/`、`internal/boot/`：`System-prompt-review: <note>`。
  - 用户可见改动：`Documentation-impact: updated - <what>` 或 `none - <why>`。
  - 分隔符必须是 ASCII `-` 或 `:`，不要用 em dash。
- 不再向上游提 PR；上游历史 PR 只作参考。

## 分支清理

- 已合并分支删除；dependabot 分支合并后自动清理。
- 长期未合并的分支先核对 diff，确认无未吸收内容再删；worktree 同步释放。
