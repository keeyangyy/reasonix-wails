> **已归档（2026-11）**：wails-mine 重建/挂载阶段的历史方案。后续采用按文件搬移，挂载收敛方案已撤销；数字、分支与路径仅作取证，不再维护。

# wails-mine 主题清单（重建 wails-mine-rebuild-v2 的第一轮梳理）

> 基线 `v1.38.2`（`f5745bae2`）→ 源 `wails-mine`（`129029b0c` = `v1.38.53`）
> 生成于 2026-10-14。口径与红线见 [方案文档](2026-10-14-wails-mine-rebuild-v2方案.md)。

## 1. 口径

- **素材**：`wails-mine` 上自 1.38.2 以来的**原始提交**（first-parent 共 169 条 = 97 merge + 72 直提；非 merge 提交共 244）。
- **不复用 `bak/*` 分支**。
- **不复用上一轮 `wails-mine-rebuild`**。
- **红线**：全部主题合并回 v2 后，tree 必须与 `wails-mine` 逐字节一致；任何差异需登记说明。
- 归类依据：主线 97 个 merge 的主题名 + 每条 merge 带入的提交 + 直提提交的文件范围。

## 2. 主题清单

| 主题 | 建议分支 | 条目数 | 非merge提交 | 涉及文件 |
|---|---|---|---|---|
| T1 fork CI 与发版链 | `rebuild/fork-ci-release` | 29 | 29 | 33 |
| T2 transcript 重放/去重/渲染 | `rebuild/transcript-replay` | 35 | 66 | 103 |
| T3 测试隔离与稳定性 | `rebuild/test-isolation` | 8 | 8 | 10 |
| T4 repolint/预算/门禁 | `rebuild/repolint-gate` | 20 | 20 | 12 |
| T5 思考强度会话化 | `rebuild/effort-per-session` | 3 | 4 | 8 |
| T6 压缩 compaction | `rebuild/compaction` | 12 | 22 | 39 |
| T7 会话打开等待与日志轮转 | `rebuild/session-open-wait` | 3 | 4 | 5 |
| T8 会话标题与自动命名 | `rebuild/session-title` | 7 | 11 | 33 |
| T9 配置保存与渲染 | `rebuild/config-save` | 2 | 2 | 6 |
| T10 本地 CI 门 ci-local | `rebuild/ci-local-scripts` | 2 | 2 | 1 |
| T11 过程折叠与折叠索引 | `rebuild/folding` | 2 | 4 | 52 |
| T12 子代理/写锁 | `rebuild/subagent-write-lease` | 4 | 8 | 35 |
| T13 主题与外观 | `rebuild/theme-appearance` | 4 | 7 | 31 |
| T14 回收站与会话删除 | `rebuild/trash-delete` | 2 | 3 | 26 |
| T15 shellsafe 只读白名单 | `rebuild/shellsafe-readonly` | 1 | 1 | 2 |
| T16 大文件拆分重构 | `rebuild/split-large-files` | 1 | 1 | 21 |
| T17 taskmonitor | `rebuild/taskmonitor` | 1 | 1 | 2 |
| T18 提示词历史 nonce | `rebuild/prompt-history-nonce` | 1 | 1 | 3 |
| T19 会话路径安全 | `rebuild/session-path-safety` | 1 | 1 | 3 |
| T20 memory 存储 | `rebuild/memory-store` | 2 | 2 | 6 |
| T21 IME 输入法 | `rebuild/ime-rename` | 1 | 1 | 7 |
| T22 capability 路由 | `rebuild/capability-routing` | 2 | 2 | 11 |
| T23 runtimepolicy | `rebuild/runtimepolicy` | 1 | 1 | 3 |
| T24 event 合并 | `rebuild/event-coalesce` | 2 | 2 | 2 |
| T25 上下文估算与投影 | `rebuild/context-estimate` | 8 | 11 | 15 |
| T26 会话归属与跨线隔离 | `rebuild/session-ownership` | 6 | 6 | 27 |
| T27 自动更新源 | `rebuild/update-source` | 1 | 1 | 5 |
| T28 会话指纹自愈 | `rebuild/session-fingerprint` | 1 | 1 | 6 |
| T29 列表计数投影 | `rebuild/listing-projection` | 1 | 1 | 2 |
| MIX 混主题 merge（待拆分） | （拆分到各主题） | 6 | 21 | 69 |

合计：各主题非 merge 提交相加 = **244**，与全量一致（无遗漏）。

## 3. 各主题的条目号（追溯用）

条目号 = first-parent 顺序序号（见附件骨架，`tmp/DeepSeek-Reasonix/theme-inventory.md`）。

- **T1** 1,2,4,5,7,8,10,12,18,19,20,21,22,23,27,74,88,100,102,123,130,131,132,148,149,152,153,156,157
- **T2** 3,14,30,31,32,33,36,40,41,46,48,49,50,53,55,58,75,77,78,79,80,84,120,124,143,144,158,159,160,161,162,163,164,166,169
- **T3** 6,87,114,115,117,118,154,155
- **T4** 11,13,15,16,17,37,38,43,44,45,47,51,54,60,67,68,71,76,85,109
- **T5** 24,25,26
- **T6** 28,42,59,63,65,83,86,91,92,93,99,136
- **T7** 29,81,82
- **T8** 34,35,61,62,64,69,135
- **T9** 39,134
- **T10** 52,56
- **T11** 57,151
- **T12** 89,90,98,116
- **T13** 72,73,96,97
- **T14** 94,145
- **T15** 95
- **T16** 101
- **T17** 103
- **T18** 104
- **T19** 105
- **T20** 106,107
- **T21** 108
- **T22** 110,167
- **T23** 111
- **T24** 112,113
- **T25** 119,121,122,125,126,127,128,129
- **T26** 137,138,139,140,141,142
- **T27** 146
- **T28** 147
- **T29** 150
- **MIX** 9,66,70,133,165,168

## 4. 提交处置策略

- **压缩合并**（试错迭代，净效果不变）：
  - T6 的 `[91]`（Revert+Reapply 循环）、`[92]/[93]`（测试加后即撤）；
  - T4 的预算微调族（`[13][43][44][51]` 等）；
  - T2 的 CI 修复尾巴、各主题的 gofmt/类型补丁。
- **拆分**：**MIX 的 6 条 merge**（见 §5）。
- **原样保留**：单一逻辑的干净提交；**外来提交**（取自上游/其他分支者）原样保留。

### 关于「外来提交」

实测 wails-mine 上 341 个提交作者**全为本机身份**（`wujinyang`/`keeyang`），**无上游作者**——即使是 port 来的也是重写后提交的。故**无法靠作者判定**，需按内容比对 / patch-id / merge 结构判定，逐主题核对。此为阶段 1 的核查项。

## 5. MIX：6 条混主题 merge（待拆分）

| 条目 | merge | 带入 | 混入的主题 |
|---|---|---|---|
| 9 | `00ffe7241` dev 合入 main-v2 | 6 | 会话列表闪动(T2/T26) + fork 新会话(T2) + 默认折叠偏好(T11) |
| 66 | `877f07e9e` 会话自动命名自愈等 | 4 | 会话标题(T8) + 压缩卡片(T6) + AI 重命名预算(T8) |
| 70 | `adf3dff6c` 子代理并行/写锁/重命名 | 5 | 写锁(T12) + 重命名列表(T8) + repolint(T4) |
| 133 | `78f22990e` fix/config-retired-cli-channel | 7 | 配置保存(T9) + doctor 脱敏(T3) + 投影(T2) |
| 165 | `4d04e2dcc` Ask notes and transcript race | 3 | transcript 重放(T2) + Ask 补充说明(T2) |
| 168 | `9b97c2433` fix/sidebar-hover-slot | 4 | 侧栏 hover(T13/T2) + Ask 续接顺序(T2) + Ask 补充(T2) |

## 6. 待确认

1. 主题粒度与命名是否认可（尤其 T1、T2、T4 三个大主题是否要再细分）。
2. MIX 6 条的拆分归属。
3. 「外来提交」的判定标准（默认按 patch-id 与内容比对，等同一律保留）。
