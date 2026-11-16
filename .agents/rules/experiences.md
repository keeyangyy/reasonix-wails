# 实战经验

只保留实测的故障成因与识别线索；操作防线见 [testing.md](testing.md)，发布要求见 [release.md](release.md)。

## 用户状态隔离事故

- 隔离失效的测试覆盖了真实 `%APPDATA%/reasonix` 配置，导致凭据配置丢失、测试项目混入侧栏。
- `reasonixHomeDir()` 优先读 `REASONIX_HOME`；宿主注入的值会被子进程继承，`TestMain` 漏清理时重定向失效。
- 运行中的桌面应用还可能聚合测试建立的临时项目；只重定向测试进程目录，不等于整个宿主场景没有副作用。

## 数据与版本兼容

- 本仓库与 Studio 默认共用 `%APPDATA%/reasonix` 下的会话、配置和部分桌面状态；同一项目同时只由一条线打开。
- 上游 Electron 线曾写入项目树状态 `version: 2`，Wails 旧线只接受 `version: 1`，导致保存被拒。修复前核对文件来源、当前 schema 和字段兼容；备份后只按已验证版本处理，不能把改低 version 当作通用修复。
- 新宿主恢复旧会话时曾继续使用缓存的工具面，导致新增工具不出现。先检查恢复/缓存路径，确认后重新加载会话重建工具面。

## 历史字段以证据为准

- 整理历史文档时，不要按新规范改写旧分支名、提交 id、PR 号；以 `git log --merges`、tag 指向和远端记录为准，查不到就注明“未记”，不推测补全。
- 命名规范只约束将来。

## 多会话共用 worktree 的改动丢失

- worktree 的空闲/占用只能靠 `git worktree list` 现场判断；任何登记约定都不可信，另一个会话仍可能切走同一 worktree。
- 实测一次未提交改动被抹掉，只剩未跟踪的新文件；同一 worktree 的 index 也可能被别人的 `git reset` 波及。
- 识别线索：`git worktree list` 的分支与预期不符；`git reflog` 出现 `checkout: moving from <你的分支> to <别处>`。
- 防线：落点后尽快提交；发现被抢占就换一个 detached 的空闲 worktree 重放；对别人的 worktree 只读。

## GitHub 自动化约束

- `GITHUB_TOKEN` 不能推送改动 `.github/workflows/` 的提交；需要自备 PAT（含 Workflows 权限）或 deploy key。
- `schedule` 与 `workflow_dispatch` 只认默认分支上的 workflow；本仓库默认分支是 `main`。
- `GITHUB_TOKEN` 推的分支/PR 不会自动触发 `on: push` / `on: pull_request`；需要显式 `gh workflow run <wf> --ref <分支>`。

## 构建异常

- 本机 pnpm 11 曾出现 `ERR_PNPM_IGNORED_BUILDS` 并生成额外 workspace 文件；按 `packageManager` / `engines` 使用 pnpm 10。
- 构建产物、缓存和临时目录不要提交；测试结束清理中间文件。

## 历史行身份被整轮覆盖

- 现象：某会话两轮之间的内容整段不显示，上滑看不到、重启无效；换机器或换数据目录渲染正常。
- 真因：会话目录里的目录级 sidecar `.planner-display.json` 把一整轮 planner 显示消息挂在某条 user 消息下，历史转换后整轮被盖上宿主 messageId，前端按 messageId 去重合并时吞掉正文。
- 识别线索：后端返回的一页里 `order` / `messageId` / `entryId` 前缀收敛到同一个值，而 role 包含 user/assistant/tool/notice；离线只读 `.jsonl` 验证不出问题，必须比对后端真实返回值与前端渲染结果。
- 防线：历史行 messageId 逐行唯一；非 provider 来源的行用派生 id（`<宿主id>:p<行号>`），不要让宿主 id 无差别覆盖。排查时先列全会话目录的 sidecar 文件。
