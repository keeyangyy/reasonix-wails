> **已归档（2026-11）**：wails-mine 重建/挂载阶段的历史方案。后续采用按文件搬移，挂载收敛方案已撤销；数字、分支与路径仅作取证，不再维护。

# wails-mine 重建施工图（方法 A：以原 merge 为骨架）

> 基线 `v1.38.2` · 源 `wails-mine`（`v1.38.53`）· 目标 `wails-mine-rebuild-v2`
> 生成于 2026-10-14 · 配套：主题清单、方案文档、主题文件清单（同目录）

## 0.5 历史已重做（2026-10-14）

初版重建的分支名（`rebuild/Tnn`）与 merge message 未按规范，已整线重做：

- **分支名**：改为 `<type>/<短描述>`（对齐 wails-mine 既有风格，如 `fix/transcript-replay-dedup`）。
- **merge message**：按 git-workflow 规范补全（标题 `merge: 合并 <分支名> 分支` + `变更汇总：` + `原因：`）。
- **MIX**：原 6 条混主题 merge 已按改动文件拆入各主题，不再有 `rebuild/MIX`。

| 主题 | 分支 | 主题 | 分支 |
|---|---|---|---|
| T1 | ci/fork-release-pipeline | T16 | refactor/split-large-files |
| T2 | fix/transcript-replay-dedup | T17 | fix/taskmonitor-snapshot |
| T3 | fix/test-isolation | T18 | fix/prompt-history-nonce |
| T4 | chore/repolint-budget | T19 | fix/session-path-safety |
| T5 | feat/session-effort | T20 | fix/memory-store |
| T6 | fix/compaction-visibility | T21 | fix/ime-rename |
| T7 | fix/session-open-wait | T22 | fix/capability-routing |
| T8 | fix/session-title-sync | T23 | fix/runtimepolicy-prose |
| T9 | fix/config-preserve | T24 | perf/event-coalesce |
| T10 | feat/ci-local-gate | T25 | fix/context-estimate |
| T11 | feat/process-folding | T26 | feat/session-ownership |
| T12 | fix/subagent-write-lease | T27 | feat/update-source |
| T13 | feat/theme-appearance | T28 | feat/session-fingerprint |
| T14 | feat/trash-delete | T29 | fix/listing-projection |
| T15 | feat/shellsafe-readonly | | |

下方 §5 施工卡中的 `rebuild/Tnn` 即指本表对应分支。

## 0. 红线

全部主题合并回 `wails-mine-rebuild-v2` 后，`git diff wails-mine-rebuild-v2 wails-mine` 必须为空。
任何差异都要登记造册并说明原因，经确认。上一轮失败即败在此（内容错位 + 越界改功能）。

## 1. 方法 A 一句话

**不要逐个重放 244 个散提交**。把 wails-mine 的原始 merge 段按主题聚拢，整组重放成该主题分支，
冲突一律取终态，最后用 tree 等价兜底。每主题 = 一个小任务。

## 2. 前置

1. **先备份唯一真相**：`git branch backup/wails-mine-20261014 wails-mine`
2. 工作区：worktree 池任取空闲槽（`git worktree list` 中为 `detached HEAD` 的那个；当时 `dev3` 可用）
3. 分支：每主题从 `wails-mine-rebuild-v2` 当前 HEAD 拉 `rebuild/<主题>`，完成后 `--no-ff` 合并回 v2
4. 顺序：严格按 §5 的顺序（= first-parent 时间序，后主题依赖前主题的文件上下文）

## 3. 冲突与外来提交策略

- **冲突文件一律取终态**：`git checkout wails-mine -- <file>` 后 `git add`（终态唯一正确；记账/预算/文案类本就该如此）
- **空/已覆盖提交**：`cherry-pick --empty=drop`，或 `--skip`
- **外来提交**（取自上游/其他线者）**原样保留**：按同提交内容判定（本仓库无上游作者，只能靠内容/patch-id）
- **记账类文件例外**：`tools/repolint/baseline.json`、`desktop/frontend/scripts/check-bundle-budget.mjs` 建议全部主题走完后终态统一对齐，不在每主题纠缠

## 4. 每主题施工步骤

```powershell
cd <worktree>
git checkout wails-mine-rebuild-v2
git checkout -b rebuild/Tnn
git cherry-pick <§5 中该主题的 sha 列表，按序>    # 冲突则：git checkout wails-mine -- <file> && git add <file>
git checkout wails-mine-rebuild-v2
git merge --no-ff rebuild/Tnn -m "merge: Tnn rebuild/Tnn"
```

## 5. 主题施工卡（按施工顺序）

### 1. T1 · fork CI 与发版链  →  `rebuild/T1`

- 源提交: **29** 个 · 文件: **33**（独占 30 / 共享 3）
- 源 merge 条目: 1, 2, 4, 5, 7, 8, 10, 12, 18, 19, 20, 21, 22, 23, 27, 74, 88, 100, 102, 123, 130, 131, 132, 148, 149, 152, 153, 156, 157
- 命令:
  ```powershell
  git cherry-pick 27e9082599a05f9ddf81fc05b890a5a4ef08fa66 a65bccd35a1a1e9999f1d9dcde8097ef834fad99 e7e18e75c0a32b5cf85b7721e8c29add4773145c f91626e56eb809f5650181dc09e9607822e561e9 e7dcf6fa62abbdda2ac2c12171743e03556c8bcd e9c0ec442e510f7fe05e56a1f81e8bd9b2b9f43b c1aba209ec13cb09ef1fd0e41a6375726a28a779 6aa95c8198b953e70c910740de32143efc5ff909 9176749ea7ee78b2ec40439b4b95c1b0eec20700 c77cf0a860eab5f4c69c32559744267e1f1ade41 e7a9e42cfd44a7b4f8eed099526f157978e88d08 1069890030f1560f1160c8efb0c903812a25ea10 4df33b2164ce3f44a9aec0537707fa4619ee6792 81166fa72f627588d95e1acd0eae12e00e0a568f 903f1b2cf8ace3ebb233e68436b2f3f334a0aea9 dfa8c937a1d7d9770def387057bbf214b3f2307c af11dc4fb7ccd17aff76ba1973e0fc4476262f95 dd4b5ae9aac213f4382d7b009b255a8f7a7b803a 73b10cf45a30cf58aec80a8179c2b29026721b14 b50cc04c1e14c946eea422d9ef2fff3bf8572d7a a8f0eb744fd17e1ab51dbd11b4a27975daad1b37 78b52f5effb931a1581df9bb61901b8d4b6c2b63 4918f4d6d2495c15c03a34d4377c160ccb85d6ab 629d0512cf2182cf035264fdde4febac98ff0eab 1fd91723b04499bae4cbad82582549f0b0cfa054 9e6ba82173d2521df8fce9b4f90d4f0ed7fcfd90 2ea89978f6d9895ac8c73317e8c187aaf62e10f1 3202e8c1796114b9f7b17052ba4ec2bc8d7b91e4 f32321d6ebdae552c47959f977321f1a035b92cc
  ```
- 共享文件（冲突高发）: .github/workflows/ci-rerun.yml, .github/workflows/release-manual.yml, .github/workflows/release-windows.yml

### 2. T2 · transcript 重放/去重/渲染  →  `rebuild/T2`

- 源提交: **66** 个 · 文件: **103**（独占 76 / 共享 27）
- 源 merge 条目: 3, 14, 30, 31, 32, 33, 36, 40, 41, 46, 48, 49, 50, 53, 55, 58, 75, 77, 78, 79, 80, 84, 120, 124, 143, 144, 158, 159, 160, 161, 162, 163, 164, 166, 169
- 命令:
  ```powershell
  git cherry-pick 4c3294e78ed9680bb4fe9555d2242f298752f55a f00ba16cde0f448438712f65fe974b0b92c94d16 97c60e886f80fba98ad256a28e9b6200625a6f99 45d7fc824cdc38989aa89f69aa76ef8621dbe232 279cf58e5f4a393bf42b8135d1c643958d5933c6 968543e8a5026eb29d78edef841b374d96a1d8c9 fd75f49deb20de82bccb7a4da8b51e61724a77d4 fcb6b4393cf3c0e393e1177808aa7154411cc491 60118295e2d2da25197211ff308c4d3a6f286657 2886d29a8a582fc57aa9b03fd26c67950038b66b 8d7f912df22c60370e9584109361ea1308af0dad bef99890446d28af36310b63be5df21a20c5043a bde394a11b0b63dee830f84052257a2bea271ff6 0d6d101b76d4f035266cf328c13d06f157fb37d5 2e16532e22ea2f9617e98750f1ee4a7e549310a2 c0b83d27b3f0bdb55913523d102649da80e96cb6 01a8834aaec023e9fa3581799b7193a2ea5fc698 513d80729922441f5e901375fc58befc3909b6fd 35d92384c3349b922290bf33190e56fd50123913 5a876e336b8001e053d6d877cbd1ed4ba9e70f5d 6dd46cd0bd209a6947fe416ba4c2fdd881fb8667 f149f9af8924f718f0294691b913aede2df29267 d25b16c0e25c77c0022ea5b3951da2cd0c210f82 15505b19274b3f1f9f51294aaeadf13f5acbce4b f1572658ab8b43a6d343ef60a1b0d1fd47a9fcdf 8ddbf1b724610b0f82cbeddf7d39828e0f703a81 0fcaf3c80f285baeaeaff20673d781964880af0b ebfcea8cc125ae24855c1e3a75362091cfdd0514 271aaf1347cce699b36ae5a31bece04a466caaf1 ba45da5afcf275d5ec07f4f4deba0a9c6fc71a5b b433401c90b9e7c7fa4a094faa9c621cd7375daa 5f9523c21c4e97ddfed00154b2f9ebdb38609599 229d9c3e2f53fcf88ef46a6b5b2691eed58c7fd2 fbf328d748ae0adf88b3f77aa77cf10fdcba7613 f6517465f199b8c3a766550cda090dfb75de7560 4b46d89c9799c6abaca52230f9d2eb021c6b6116 1e1e330c3baf39189241ef98f6450f08a0c9ee8d 8b4eeec47f130f9583be30c5958a9b093acea4ce 0a75192c395c0b45512aeee61d69245330c4304b 4cb3f5cc35dbd478f25da426201fba6b971b87b4 8ccaa085c7f1193da10cbede1ede39813a27c20a 682818de6f52862759a1201f9f503193577183b6 bce388d75670485218e9896b643d1df71db207ea 089fa42f7a7a66a25185c846cd2bcd89ab34cc76 bc56a9b86266e1d2894562f6a534ad3b8c5e77c6 f7025cfc114ee0ec09846ada1c3ad59643cc3be0 650e7bb90d50ad537c258fb8222addb61726bea4 23fa11ef369141f8df74e50e46ffe3b77bc9e01f a246c64928f2edf97363bbc509051bf6e3741db1 19506608bc50ab7f5534b6c3de9613dae080ce48 21c5a804e8dd78959cec0041b78af96f26e79990 ca957aeed2898b4dacff91b612b1f0cb64c21fed 170bace5a0df2b46cfeb787bf0604d695dc0a889 ac0d22c59e3fd8e2adde13814401b9a7eb2caa09 971a036c9867899efc50b3db4e6e04a90089b550 a137817aa41af4eb34c384392dbc9110c8d5ea36 b24825135a968bcc257c0cf10436b664133c6b6f 5c618d8895ba5db4e5922bee14296f7bd1b504aa 33a610ce6bfe1006d49720cbaba97629bfc04aad a02759e91be589fa31ad56d769964d9be374b2cb 6a87f759aefef1f4d5b562bd3545af207981d756 2ce36e131590276e4a74e83b4dff2d8b52b30c23 3f5107b55c1ef8bf671d4ad8f19a4e40c7223967 dd9056d5c2689213b28c077b11a6c5ddd8f38e15 400251af0024e0f4f10cf8c55f75216071562838 bc553762b6eafb735fa93a6a36e2d826576f9de7
  ```
- 共享文件（冲突高发）: desktop/app.go, desktop/frontend/bench/transcript-session-replay.mjs, desktop/frontend/package.json, desktop/frontend/scripts/check-bundle-budget.mjs, desktop/frontend/src/__tests__/ask-order-self-repro.test.ts, desktop/frontend/src/__tests__/hydrate-history-apply.test.ts, desktop/frontend/src/__tests__/transcript-process-fold.test.ts, desktop/frontend/src/app-shell/AppRuntimeView.tsx, desktop/frontend/src/components/ProcessFoldHeader.tsx, desktop/frontend/src/components/ProjectTree.tsx, desktop/frontend/src/components/Transcript.tsx, desktop/frontend/src/lib/hydrateHistoryApply.ts, desktop/frontend/src/lib/transcriptRows.ts, desktop/frontend/src/lib/turnEventProjection.ts, desktop/frontend/src/lib/types.ts, desktop/frontend/src/lib/useController.ts, desktop/frontend/src/locales/en.ts, desktop/frontend/src/locales/zh-TW.ts, desktop/frontend/src/locales/zh.ts, desktop/frontend/src/styles.css, desktop/history_slice.go, desktop/scripts/ci-local.ps1, desktop/tabs.go, desktop/turn_runtime_api.go, internal/event/event.go, internal/eventwire/wire.go, tools/repolint/baseline.json

### 3. T3 · 测试隔离与稳定性  →  `rebuild/T3`

- 源提交: **8** 个 · 文件: **10**（独占 10 / 共享 0）
- 源 merge 条目: 6, 87, 114, 115, 117, 118, 154, 155
- 命令:
  ```powershell
  git cherry-pick 74024485737ca55ef92eba1f6798f1c5f7c3e497 52d6fd6056ba10284dfc730bdb54d7b86358e84a 6e3e9296b9b5a8716784325dc15ae56ec21d667a 79d1b83a66d75c337f2f5f66c528998d3ef49b0c 0892d25c94de80c9c9b356e4126f1c07050c5872 55f2a330eae954d1d922bcb7227fa8f55eb43e02 e1fbf270df3bb995a22da60bf3f24523c5238800 4e50848a38f1392e7b07ae145a4ae1f0041b5ee3
  ```

### 4. T4 · repolint/预算/门禁  →  `rebuild/T4`

- 源提交: **20** 个 · 文件: **12**（独占 2 / 共享 10）
- 源 merge 条目: 11, 13, 15, 16, 17, 37, 38, 43, 44, 45, 47, 51, 54, 60, 67, 68, 71, 76, 85, 109
- 命令:
  ```powershell
  git cherry-pick e58c2f365797a801658600e949967678c9ccb060 6c01d9ac71083bb24d2d314812fedcf07741beab b5547c4142757422d6f3ae7f5ce0bba54ea06f41 ba1d8fdd779747ea2031649376b09fe5ef6a1302 86ca3a82b4a5b67ad0690e91dcc4d34ffb08fb77 44282b5a1e17b560669ce674add2f7ce57df873a d7808e5ec307026078d82aba043ad1685489b770 6d872358ad9e290996e276b97f9a0a0a54fd5a20 2586c414e50b20a040d2d6e48f896d7566035895 5e0bc9f51b3950b4fc19df4386c864d21d995694 d4abfba74d5ea8ee32bf46549b0ca33741b09535 ec425c1496198d60edb6484dab4cb964f55b934a 198dd7a02cd43c58b11d951d73a916ed0627e847 4dfa9036c6d359bf44034b13b04358baeaeec09b 1aa0e6664f4bdf02f637756dd9d1d00abd8e387a 598e1c4d7725a12a5d094b1b95439d426d611edb edf455167548c5462c265577682c0f32450ee653 d580bcaf21072fa7cc5208e468d5e0d107d1d28f 75627f7f2366dddf0a0004879fdd9d7f76069326 1ea006f130342713ed07bd408ef7b1815a3e452f
  ```
- 共享文件（冲突高发）: desktop/app.go, desktop/fork_boundary_inherit_test.go, desktop/fork_tab.go, desktop/frontend/scripts/check-bundle-budget.mjs, desktop/session_catalog.go, desktop/tabs_topic_test.go, desktop/tabs.go, desktop/turn_runtime_api.go, internal/agent/parallel_writer_claim_test.go, tools/repolint/baseline.json

### 5. T5 · 思考强度会话化  →  `rebuild/T5`

- 源提交: **4** 个 · 文件: **8**（独占 4 / 共享 4）
- 源 merge 条目: 24, 25, 26
- 命令:
  ```powershell
  git cherry-pick a07b5bac040e0c4a30dddae8959ba05a7b14d14a 6dab347c350866033db8994e1ce47419b81b1309 6ca233f81f415a3d4010ca22c18c606a96a9320b 1790f11e52eb66ff8c377f21b27c52dedabaead7
  ```
- 共享文件（冲突高发）: desktop/app.go, desktop/fork_tab.go, desktop/tabs.go, internal/agent/branch.go

### 6. T6 · 压缩 compaction  →  `rebuild/T6`

- 源提交: **22** 个 · 文件: **39**（独占 18 / 共享 21）
- 源 merge 条目: 28, 42, 59, 63, 65, 83, 86, 91, 92, 93, 99, 136
- 命令:
  ```powershell
  git cherry-pick 4bba24d2376424c3893a8c8ac68d0e243f701fab 0e71d6b7865f146ceb194bcd3380c172e45ef127 bf7a090db756f39dc3c87009fb4ec502bd34679a ee2dbeb9bc0b3e8dc4c6fa9dcd94c2f2dc009fa7 6f15670e03dd63870d17f09e10c96698e5968e97 4407cecae06fe146d1958026a220878f446cb412 e0a5e806a242d1650046a5b9682d73684c68af80 762f03e45c28a9076e11b724c7c2f3309ec0ff54 653a67bc4e459508e712eeec5e569601799dafc2 ed74316c55c9b7b904047384f344bf1bb072dd1a b71adf9c245b209754e8cba8c6951c1d9838a891 d853ec345c409cf7fd68773fc7c53c7e85feb904 a838e63eb26d2914fc1d6925967a6c70cffd5d3b d31f55bb99d6ed25031ddff939d237a2bb7b1937 dc276000c6ac4c26ba3d7a0cc396d1eadeb2d6bb 1481995fe24810909b3c2b89980991ec3f35f6e0 1cdf1bdd0e9ec95396915ebd9aa4dc51f37c5cc8 319d1c41fa1e6da99a8b3165df68e6bb854b8fd3 d5f2ab2ca01bf085b000e2dd03da12ce6e61b259 c10d9936daf3546509575e9d238f69168fa9265b 6e71207e24acdf28bbf89a40073184993f653190 b8b1ea5551192ba7d23137e1782dac34ce4390d8
  ```
- 共享文件（冲突高发）: desktop/fork_boundary_inherit_test.go, desktop/fork_tab.go, desktop/frontend/scripts/check-bundle-budget.mjs, desktop/frontend/src/__tests__/ask-order-self-repro.test.ts, desktop/frontend/src/lib/bridge.ts, desktop/frontend/src/lib/transcriptRows.ts, desktop/frontend/src/lib/turnEventProjection.ts, desktop/frontend/src/lib/useController.ts, desktop/frontend/src/locales/en.ts, desktop/frontend/src/locales/zh-TW.ts, desktop/frontend/src/locales/zh.ts, internal/agent/agent.go, internal/agent/compact_projection.go, internal/agent/compact.go, internal/agent/context_receipt.go, internal/agent/fork_projection.go, internal/control/controller.go, internal/control/turn_events.go, internal/event/event.go, internal/eventwire/wire.go, tools/repolint/baseline.json

### 7. T7 · 会话打开等待与日志轮转  →  `rebuild/T7`

- 源提交: **4** 个 · 文件: **5**（独占 4 / 共享 1）
- 源 merge 条目: 29, 81, 82
- 命令:
  ```powershell
  git cherry-pick 5c3b41bf4c58061355632612bb6a0a2d20b21869 1d84c7a8f5083f290ca9693c6e1a321516d19ad2 f79312e379d0f1ea857a7f9d6b74873bc2788af9 08a5897766137492c9797d9b7f394ed57776060c
  ```
- 共享文件（冲突高发）: desktop/app.go

### 8. T8 · 会话标题与自动命名  →  `rebuild/T8`

- 源提交: **11** 个 · 文件: **33**（独占 17 / 共享 16）
- 源 merge 条目: 34, 35, 61, 62, 64, 69, 135
- 命令:
  ```powershell
  git cherry-pick b2f590aa1573d6fd18c9352c41a90100f9f5204a 852d260015d539bffcd121f9c32a402febccf4a8 e7aaa0cacda20b46d29c04cb10f6a43abc41b054 70a22596ce0522c673014c298cf3a59d56c2f387 1ebf919945b59d8cbdd6957c97625ba12d16975e 5f32f397423269764375ca1789c2a0d9c7e44782 69c199d20f59e7df82d3f789a927fbe4a79d6194 17a78d5c4ba0713be6ef7736ad545c95c325d5ae 81b6d30d7ff226cac76971f60874ed56cc72bafe ad5180272b148003ab6b5d5a3e4b07fe4aa52218 f9cb618d1debf4b131ab8be743d169962951a8ca
  ```
- 共享文件（冲突高发）: .github/workflows/release-manual.yml, desktop/app.go, desktop/frontend/src/lib/turnEventProjection.ts, desktop/frontend/src/lib/types.ts, desktop/frontend/src/lib/useController.ts, desktop/session_catalog.go, desktop/tabs.go, internal/agent/compact.go, internal/agent/session_foreign_test.go, internal/agent/session_foreign.go, internal/control/controller.go, internal/control/session_title_test.go, internal/control/session_title.go, internal/control/turn_events.go, internal/event/event.go, tools/repolint/baseline.json

### 9. T9 · 配置保存与渲染  →  `rebuild/T9`

- 源提交: **2** 个 · 文件: **6**（独占 3 / 共享 3）
- 源 merge 条目: 39, 134
- 命令:
  ```powershell
  git cherry-pick 27ccaf66de36267646d1516d1a877a7a8d9686d2 63bafd76344365b9a6933a3a8255c3329ec22acf
  ```
- 共享文件（冲突高发）: internal/config/preserve.go, internal/config/render.go, tools/repolint/baseline.json

### 10. T10 · 本地 CI 门 ci-local  →  `rebuild/T10`

- 源提交: **2** 个 · 文件: **1**（独占 0 / 共享 1）
- 源 merge 条目: 52, 56
- 命令:
  ```powershell
  git cherry-pick e2003e6d8b85d098b60e31f5b0541b15f55dac58 29b5827de3276a0d8250593762cc97321a194691
  ```
- 共享文件（冲突高发）: desktop/scripts/ci-local.ps1

### 11. T11 · 过程折叠与折叠索引  →  `rebuild/T11`

- 源提交: **4** 个 · 文件: **52**（独占 26 / 共享 26）
- 源 merge 条目: 57, 151
- 命令:
  ```powershell
  git cherry-pick 5eb451abd54e9a3fdd2e1e17df626a60262f105a e6e28ae086aea434600c39b26cc6f0142dc7a029 93f8efb99b1601953ddd18bfc4695ec0090bacfe f69e704a6682cc77ac90a2705c0f08dc056f6342
  ```
- 共享文件（冲突高发）: desktop/frontend/scripts/check-bundle-budget.mjs, desktop/frontend/src/__tests__/session-experience-settings.test.tsx, desktop/frontend/src/__tests__/transcript-process-fold.test.ts, desktop/frontend/src/components/SessionExperienceSettings.tsx, desktop/frontend/src/components/SettingsPanel.tsx, desktop/frontend/src/components/Transcript.tsx, desktop/frontend/src/lib/bridge.ts, desktop/frontend/src/lib/transcriptRows.ts, desktop/frontend/src/lib/types.ts, desktop/frontend/src/locales/en.ts, desktop/frontend/src/locales/zh-TW.ts, desktop/frontend/src/locales/zh.ts, desktop/settings_app.go, internal/agent/agent.go, internal/agent/compact_projection.go, internal/agent/compact.go, internal/agent/context_receipt.go, internal/agent/execute_one.go, internal/agent/fork_projection.go, internal/agent/projection.go, internal/agent/task.go, internal/boot/boot_test.go, internal/boot/boot.go, internal/config/config.go, internal/config/edit.go, tools/repolint/baseline.json

### 12. T13 · 主题与外观  →  `rebuild/T13`

- 源提交: **7** 个 · 文件: **31**（独占 17 / 共享 14）
- 源 merge 条目: 72, 73, 96, 97
- 命令:
  ```powershell
  git cherry-pick 0a771454cf0a8e92bd0b539ced9e9172c99f5093 759578e8625f84925e05ebf2cd69d2c8bf41992b 1f0edec88a60eefd2a46b5197fa2eb5c900d8f94 a29db7b7235056b354a2a064cf3a1df2231d6b34 ea26b691906557597fa4a458e1a584ade7a08865 861d08f0bdcc6479646fb606f125795489cdf245 14ca2dd457edb422787d7158e70c3f308e2e7e05
  ```
- 共享文件（冲突高发）: desktop/frontend/scripts/check-bundle-budget.mjs, desktop/frontend/src/app-shell/AppRuntimeView.tsx, desktop/frontend/src/components/SettingsPanel.tsx, desktop/frontend/src/lib/bridge.ts, desktop/frontend/src/lib/types.ts, desktop/frontend/src/locales/en.ts, desktop/frontend/src/locales/zh-TW.ts, desktop/frontend/src/locales/zh.ts, desktop/frontend/src/styles.css, desktop/settings_app.go, internal/config/config.go, internal/config/edit.go, internal/config/render.go, tools/repolint/baseline.json

### 13. T12 · 子代理/写锁  →  `rebuild/T12`

- 源提交: **8** 个 · 文件: **35**（独占 19 / 共享 16）
- 源 merge 条目: 89, 90, 98, 116
- 命令:
  ```powershell
  git cherry-pick 84c15f3835da0205a62613c8ad9c0a409210424a f848dbc2a16f54526d52bed0c7683e1ba9448239 d39e07a4f33b8dfbad3c4d467daaba4d25af0bcf d8b7f376002726a71a01dc0b563f8e6dc39b007c fb495ae3560081595dbedb12846629b1fffc1328 5730ddb38d3721835cb628c178ec879147bb03ea 046b971d6e3a24ebdfc321e537315ebe4f18ec6c c92752b3e520ec2b993bb6f6afa5d1b6bacea56e
  ```
- 共享文件（冲突高发）: desktop/frontend/package.json, desktop/frontend/scripts/check-bundle-budget.mjs, desktop/frontend/src/app-shell/AppRuntimeView.tsx, desktop/frontend/src/components/ProcessFoldHeader.tsx, desktop/frontend/src/lib/bridge.ts, desktop/frontend/src/lib/transcriptRows.ts, desktop/frontend/src/lib/types.ts, desktop/frontend/src/locales/en.ts, desktop/frontend/src/locales/zh-TW.ts, desktop/frontend/src/locales/zh.ts, internal/agent/agent.go, internal/agent/task.go, internal/agent/tool_write_coordination.go, internal/agent/workspace_lease_regression_test.go, internal/boot/boot.go, tools/repolint/baseline.json

### 14. T14 · 回收站与会话删除  →  `rebuild/T14`

- 源提交: **3** 个 · 文件: **26**（独占 15 / 共享 11）
- 源 merge 条目: 94, 145
- 命令:
  ```powershell
  git cherry-pick ede50d8b3ab9a552c4555fffd8555dab36047eb9 ea32f9f89715ac4509c24f4e75990d80a61a724a 29621b96cd6f2b9ab6014c5a91103148c5039ae2
  ```
- 共享文件（冲突高发）: desktop/app.go, desktop/frontend/scripts/check-bundle-budget.mjs, desktop/frontend/src/components/HistoryPanel.tsx, desktop/frontend/src/components/ProjectTree.tsx, desktop/frontend/src/lib/bridge.ts, desktop/frontend/src/locales/en.ts, desktop/frontend/src/locales/zh-TW.ts, desktop/frontend/src/locales/zh.ts, desktop/frontend/src/styles.css, desktop/topic_archive_test.go, tools/repolint/baseline.json

### 15. T15 · shellsafe 只读白名单  →  `rebuild/T15`

- 源提交: **1** 个 · 文件: **2**（独占 2 / 共享 0）
- 源 merge 条目: 95
- 命令:
  ```powershell
  git cherry-pick c106622956eed584714398764e7ce41d79707eb3
  ```

### 16. T16 · 大文件拆分重构  →  `rebuild/T16`

- 源提交: **1** 个 · 文件: **21**（独占 20 / 共享 1）
- 源 merge 条目: 101
- 命令:
  ```powershell
  git cherry-pick 76ef1db13ca9a0ff68ee818461255c38616ba563
  ```
- 共享文件（冲突高发）: tools/repolint/baseline.json

### 17. T17 · taskmonitor  →  `rebuild/T17`

- 源提交: **1** 个 · 文件: **2**（独占 2 / 共享 0）
- 源 merge 条目: 103
- 命令:
  ```powershell
  git cherry-pick fb40e9f4882b0dc62b1a36c13c86f813cec0969f
  ```

### 18. T18 · 提示词历史 nonce  →  `rebuild/T18`

- 源提交: **1** 个 · 文件: **3**（独占 2 / 共享 1）
- 源 merge 条目: 104
- 命令:
  ```powershell
  git cherry-pick 021d6a64edf18056c7995d2a2e5fe4613b948fd3
  ```
- 共享文件（冲突高发）: desktop/app.go

### 19. T19 · 会话路径安全  →  `rebuild/T19`

- 源提交: **1** 个 · 文件: **3**（独占 3 / 共享 0）
- 源 merge 条目: 105
- 命令:
  ```powershell
  git cherry-pick 2ae0573adfad9a4fcd4ecbcdf972e86a8ffff3e8
  ```

### 20. T20 · memory 存储  →  `rebuild/T20`

- 源提交: **2** 个 · 文件: **6**（独占 6 / 共享 0）
- 源 merge 条目: 106, 107
- 命令:
  ```powershell
  git cherry-pick c1f291435b1dcad061da2473eaedffedd90a0034 65f235a1037bbbbf67c6cdaa5e66919d4fbb34b7
  ```

### 21. T21 · IME 输入法  →  `rebuild/T21`

- 源提交: **1** 个 · 文件: **7**（独占 5 / 共享 2）
- 源 merge 条目: 108
- 命令:
  ```powershell
  git cherry-pick 0621d4561d43ab89215cd31fd40c5bd240ede876
  ```
- 共享文件（冲突高发）: desktop/frontend/src/components/HistoryPanel.tsx, desktop/frontend/src/components/ProjectTree.tsx

### 22. T22 · capability 路由  →  `rebuild/T22`

- 源提交: **2** 个 · 文件: **11**（独占 8 / 共享 3）
- 源 merge 条目: 110, 167
- 命令:
  ```powershell
  git cherry-pick 655359198a85af67c984ae6da533278ab33d0193 2380e75919f15b1c6470d45f0ebd84da3f821fe6
  ```
- 共享文件（冲突高发）: desktop/app.go, desktop/frontend/src/components/ToolCard.tsx, desktop/history_test.go

### 23. T23 · runtimepolicy  →  `rebuild/T23`

- 源提交: **1** 个 · 文件: **3**（独占 3 / 共享 0）
- 源 merge 条目: 111
- 命令:
  ```powershell
  git cherry-pick 9c7cc63278135ecde2d7c1cf36c79db90133da67
  ```

### 24. T24 · event 合并  →  `rebuild/T24`

- 源提交: **2** 个 · 文件: **2**（独占 2 / 共享 0）
- 源 merge 条目: 112, 113
- 命令:
  ```powershell
  git cherry-pick 08ff4d4df7ccaf950ba1f73a1f3027edeb6708b5 0902915066890ea2af8f647c6374906d7ee7ad80
  ```

### 25. T25 · 上下文估算与投影  →  `rebuild/T25`

- 源提交: **11** 个 · 文件: **15**（独占 12 / 共享 3）
- 源 merge 条目: 119, 121, 122, 125, 126, 127, 128, 129
- 命令:
  ```powershell
  git cherry-pick 518e38852cca8293601b2a405fc744d8bfcb0624 bb587b8f1676e69840a7c1c1c117775742d0510a 1de24b2a894d84bc8d1d59e766ecd1c85ae09703 39e88e15caa71d31faf900c71563e10e9d3bc685 6d42468cb4a9119ff7acb3d80567f1abbe69d916 f6b2d22bfb4e6d73b8fef4e7c476a063087f9467 2ecf8a3ee646af92bfc734a9405aacdabb9e4dc2 c29699b24bc2449feb30b88cb0d7322841d5f97b d2df5c7319ef2b67dff8aa2651429f5c035ad947 aa8c2f65c6452d09ec7b3ef9e28cbd462ae5e74a cbe23c965d56ae5dcd77daf08812c0326b33533d
  ```
- 共享文件（冲突高发）: desktop/scripts/ci-local.ps1, internal/agent/compact.go, internal/agent/preflight.go

### 26. T26 · 会话归属与跨线隔离  →  `rebuild/T26`

- 源提交: **6** 个 · 文件: **27**（独占 18 / 共享 9）
- 源 merge 条目: 137, 138, 139, 140, 141, 142
- 命令:
  ```powershell
  git cherry-pick 42369a0e906c24158d33b19106fb395b84a9adf0 a4366ec7ee8f6d9f6ad6a47ceb7d2c217d6986e9 84623d4c47e53cc361c6f1fa543ce8c888fe407f 9a5a7b5b61bbea1d0ef737ff7118a599f04148cb f9fb706cad83dfcdda2252c97162f45df0509386 5a8fc8ccfd3d0dc144aeae62448e56bf19b52c36
  ```
- 共享文件（冲突高发）: desktop/history_test.go, desktop/session_heads_test.go, desktop/tabs_topic_test.go, desktop/tabs.go, desktop/topic_archive_test.go, internal/agent/branch.go, internal/agent/session_foreign_test.go, internal/agent/session_foreign.go, internal/boot/boot_test.go

### 27. T27 · 自动更新源  →  `rebuild/T27`

- 源提交: **1** 个 · 文件: **5**（独占 4 / 共享 1）
- 源 merge 条目: 146
- 命令:
  ```powershell
  git cherry-pick df06f739d7f71645c08f51f17b4fd2b3e17f1e9a
  ```
- 共享文件（冲突高发）: .github/workflows/release-windows.yml

### 28. T28 · 会话指纹自愈  →  `rebuild/T28`

- 源提交: **1** 个 · 文件: **6**（独占 5 / 共享 1）
- 源 merge 条目: 147
- 命令:
  ```powershell
  git cherry-pick be4693f6ddcce50c865d60f96059c2a363ef54b7
  ```
- 共享文件（冲突高发）: desktop/history_slice.go

### 29. T29 · 列表计数投影  →  `rebuild/T29`

- 源提交: **1** 个 · 文件: **2**（独占 2 / 共享 0）
- 源 merge 条目: 150
- 命令:
  ```powershell
  git cherry-pick f833c83ddabe6484cdadf0aa7a3f931817616200
  ```

### 30. MIX · 混主题 merge  →  `rebuild/MIX`

- 源提交: **21** 个 · 文件: **69**（独占 36 / 共享 33）
- 源 merge 条目: 9, 66, 70, 133, 165, 168
- 命令:
  ```powershell
  git cherry-pick 02fdbc3fe0c6b0727bb546d065c6bd8960013351 62d9e161bb5b37b5abd9ddc13824d14f3f084f53 7b193da2c6fc8de42016cd35841f6dbd46fbce95 893cec780d6f886285158819672a7a528d977994 c93754fa5e3566d60c185440abfdad2c3b5973bd 26dc810024743499c7e0d4acdb8eb4d35525a975 072016bfe8676b357807a4d3850ad75f2fdd0975 9b5d17b1303a7a5b0638f03c28f28cbec0818911 c2dafd48fe3143942da17dec084a426cc1880a29 a96cb6ed15bbdf72a2e0bf0ed868a0c0c9ee7f70 cb04e44cb6888bdc2d337bf0ad4957ccde6bdce3 738675cf1c0d64beeab2eb3ac6a0e62c0b37e276 d3047476ae151df30833b1a35f065e3ff62e5295 835407316c98300696a427615ec56e39f4118431 2085a54a9a7a574e8e19967f93ba53050cb7b03e 24cf609af3a1a250f2e0fa63748575bcf47109e5 2e2c3dcd8d524e7c5331fb44214d0e1c9ea8291a 981de4689ad71ef318daf15a9a9781e222a17716 48651cf35279f1c00e27ebb87f7f15f9f8a4b617 144a33728f326db9c4b2c4c965843d176a3bab1e a3d87797fe1d9dad1788c208b14a3bcc3144973c
  ```
- 共享文件（冲突高发）: .github/workflows/ci-rerun.yml, desktop/app.go, desktop/fork_tab.go, desktop/frontend/bench/transcript-session-replay.mjs, desktop/frontend/package.json, desktop/frontend/src/__tests__/hydrate-history-apply.test.ts, desktop/frontend/src/__tests__/session-experience-settings.test.tsx, desktop/frontend/src/components/SessionExperienceSettings.tsx, desktop/frontend/src/components/ToolCard.tsx, desktop/frontend/src/lib/hydrateHistoryApply.ts, desktop/frontend/src/lib/useController.ts, desktop/frontend/src/locales/en.ts, desktop/frontend/src/locales/zh-TW.ts, desktop/frontend/src/locales/zh.ts, desktop/frontend/src/styles.css, desktop/session_catalog.go, desktop/session_heads_test.go, desktop/tabs_topic_test.go, desktop/tabs.go, internal/agent/compact_projection.go, internal/agent/execute_one.go, internal/agent/parallel_writer_claim_test.go, internal/agent/preflight.go, internal/agent/projection.go, internal/agent/task.go, internal/agent/tool_write_coordination.go, internal/agent/workspace_lease_regression_test.go, internal/config/config.go, internal/config/edit.go, internal/config/preserve.go, internal/control/session_title_test.go, internal/control/session_title.go, tools/repolint/baseline.json

## 6. 收尾验收

```powershell
git diff --stat wails-mine-rebuild-v2 wails-mine     # 期望为空
go run ./tools/repolint
go build ./...
cd desktop; go test ./... -count=1
```

## 7. 素材位置

| 素材 | 位置 |
|---|---|
| 本施工图 | `docs/DeepSeek-Reasonix/report/2026-10-14-wails-mine重建施工图.md` |
| 每主题文件清单 | `docs/DeepSeek-Reasonix/report/2026-10-14-wails-mine主题文件清单.md` |
| 主题清单（含归类理由） | `docs/DeepSeek-Reasonix/report/2026-10-14-wails-mine主题清单.md` |
| 骨架（169 条目 + 带入提交） | `tmp/DeepSeek-Reasonix/theme-inventory.md` |
