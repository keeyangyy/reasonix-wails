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
6. release：代码 PR 全绿后，开 `release/vX.Y.Z` PR，只改 `CHANGELOG.md` 与 `release-notes/**`；release PR 全量 CI + app-memory，确认后合并。合并后的 main push 执行全量基线，再通过 `release.yml` 手动发版。

## 提交

- Conventional Commits，英文：`feat:`、`fix:`、`chore:`、`docs:`、`test:`、`ci:`、`refactor:`。
- 一个提交一件事；review 反馈用 amend，避免堆 fixup 提交。
- 不提交 `tmp/`、构建产物、用户数据、密钥。

## 计划

- `tmp/plan/`：本地短期计划，不提交 Git。
- `plan/`：需要跨会话协作、可版本化的长期计划，属于工作材料，不当作持久化设计文档；PR 中仍接受轻量 CI 与 CodeRabbit 评审。
- 计划完成后及时清理：有长期价值的结论提炼到 `docs/` 对应位置（需要保留历史证据的按需归档），无留存价值的计划删除。不为统一结构创建空目录。

## PR

- **异步审查要合批处理**：CI 与 CodeRabbit 的结论到达时间不同（CI 约 5–30 分钟，CodeRabbit 约 5 分钟且会基于最新 commit 重审）。先等两边都出结论，再一次性修改提交；中间急着推送只会让两边都重跑，还会让先到的一方基于旧代码重新提意见。
- 一个 PR 一个主题，diff 只含相关文件。
- **文档 PR 不夹带无关源码**：分类规则以 `scripts/ci-classify-changes.sh` 为准。普通 Markdown（包括 `desktop/`、`sdk/` 内的说明）不触发源码构建；`.github/workflows/**`、`.github/actions/**` 和 CI 分类器及其测试仅触发 `workflow`，其余 `scripts/**` 源码按代码影响处理；`docs/**`、`benchmarks/**` 内源码不能仅凭目录当文档。`desktop/**` 非说明文件触发桌面验证，`sdk/**` 非说明文件触发 SDK，`internal/extension/**` 的源码同时影响根模块与 SDK，普通 Markdown/TXT 说明不触发这些源码检查。未知路径按源码保守处理，混合变更由唯一 `ci.yml` 入口执行所需检查并集。
- **required 是两个：`gate` 与 `CodeRabbit`。** `gate` 由单一 PR 入口 `ci.yml`（或手动/定时的 `ci-full.yml`）汇总分类结果：需要执行的 lane 必须 `success`，非适用 lane 必须 `skipped`；`CodeRabbit` 未出结论（pending/cancelled）时同样不能合并。
- **合并门禁：本 PR 产生的所有 check 必须全部通过。**
  - 顶栏应是 `☑️ N/N`（数字随档位变化：docs 约 6、根模块 code 约 20、含 desktop 约 26、full 约 30）。
  - 灰色 `skipped` 在 GitHub 的统计里计入通过，所以可复用工作流内部的子 job 可以用 job 级 `if` 按需跳过；其中 `changes`、`docs-rules`、`gate` 必须成功；分类未选择的顶层 lane 可以 `skipped`，被选择的 lane 必须成功。
  - 任何红项都要处理：要么修代码，要么修检查本身（判定不合理、误报、flaky）。**不允许带着红合并。**
  - 例外仅限：平台 flake 重跑后恢复、第三方服务故障。例外必须在 PR 里写清原因，且不得长期挂着红。
  - 某项长期红 = 系统性问题（真 bug 或检查设计错），当次解决，不能靠下次。
- **合并方式只有 squash**；合并后 head 分支自动删除。
- **没有人可以绕过 gate**：ruleset 的 bypass 名单是空的，包括仓库所有者。
- 未解决的 review 线程会阻止合并：CodeRabbit 或人工的意见要么修，要么回复理由并 `Resolve conversation`。
- **CodeRabbit 的意见是参考，不是必须全盘接受**：它可能误报、超出本 PR 范围，或把实现细节穷举进规则。收到 finding 先判断是否成立、是否属于本 PR 范围：成立且相关就修；不成立、范围外或过度细化，就回复理由并 `Resolve conversation`。不要为了让它变绿而改坏设计或扩大 PR。
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
