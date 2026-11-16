# 工作流

## 分支模型

- 单一主线 `main`，受保护；功能改动走短生命周期分支 + PR。
- 分支前缀：`feat/`、`fix/`、`chore/`、`docs/`；一个主题一个分支。
- 不再保留长期并行线；上游已停维，不再有同步线。

## 开发流程

1. `git worktree list` 现场找空闲 worktree（detached HEAD）；被占用的不碰。
2. 绑定已有或新建分支，完成开发与提交。
3. 跑 [precheck.md](precheck.md) 与 [testing.md](testing.md) 的相关部分。
4. 释放 worktree（detach），更新必要的文档台账。
5. 合并回 `main` 或等待其他会话合并；红灯不带入 main。

## 提交

- Conventional Commits，英文：`feat:`、`fix:`、`chore:`、`docs:`、`test:`、`ci:`、`refactor:`。
- 一个提交一件事；review 反馈用 amend，避免堆 fixup 提交。
- 不提交 `tmp/`、构建产物、用户数据、密钥。

## PR

- 一个 PR 一个主题，diff 只含相关文件。
- PR 必须过 CI；required checks 以仓库设置和 `ci.yml` 为准。
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
