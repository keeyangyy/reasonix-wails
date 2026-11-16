# 架构导航

面向开发者的主干导航：代码在哪、从哪读、改哪里会炸。具体包数、fan-in 和文件大小会变，现场用命令查，不写死在文档里。

## 一、主干调用链

```
cli.Run()                                   internal/cli
 └─ boot.Build(ctx, opts)                   internal/boot        → *control.Controller
     └─ control.Run(ctx, input)             internal/control
        ├─ turn_orchestrator 起一个 turn    internal/control
        └─ agent.Run(ctx, input)            internal/agent
            └─ runToolLoop(ctx, *turnRuntime)   ← 环在这里
                ├─[每轮] sampling_attempt()     → provider.Stream()
                ├─[有工具] execute_batch()      → tool.Execute()
                │            └─ 闸门 permission → guardian → sandbox
                ├─[回灌] 结果追加进 Session     继续下一轮
                ├─[超限] compact.*              压缩 / 折叠
                └─[退出] 返回                   → control 收尾：completion / goaleval → 落盘
```

一句话：`agent.Run` 是一个回合的编排者，`runToolLoop` 才是循环本体。读代码从这里进，其余按需。

## 二、四层一底

```
L4 宿主：cli · desktop · acp · bot(+botruntime)
L3 装配：boot · config · agentpreset
L2 会话：control
L1 环心：agent
L0 底座：provider · tool · event · store
```

| 层 | 只跟谁说话 | 不准做的事 |
|---|---|---|
| L4 宿主 | 只调 `control.Controller` 一个门面 | 不自己实现轮次 / 取消 / 审批 |
| L3 装配 | 只读 config、只造 Controller，跑一次 | 运行期不再介入 |
| L2 会话 | 只驱动 `agent`、只发事件 | 不持有 loop 内部状态 |
| L1 环心 | 只调 `provider` / `tool` / `event` / `store` | 不知道自己被哪个宿主驱动 |
| L0 底座 | 不反向依赖上面任何一层 | — |

分层由 `tools/repolint/layers.go` 强制；`serve`、`remote` 已从本仓库删除，不要按上游旧结构找它们。

## 三、环心展开

`internal/agent` 按职责分区（文件名前缀）：

| 区 | 职责 |
|---|---|
| 回合编排 | `agent.go`、`turnruntime`、`turn_phase`、`run_budget`、`run_usage`；`Run()` 管预算、阶段、用量 |
| 环本体 | `run_loop.go`；`runToolLoop` |
| 采样 | `sampling_*`、`reasoning_*`；流式拼接、重试、推理回放 |
| 工具执行 | `execute_batch`、`execute_one`、`tool_*`；解析 → 批量并行/串行 → 收据 → 写协调 |
| 会话与落盘 | `session_*`、`save_*`；DAG、读写锁、导出、显示索引、写权、observer |
| 压缩 | `compact_*`；折叠、摘要、召回、安全前缀 |
| 子代理 | `subagent_*`、`task_*`、`planner_*`；递归开新 agent、预算、结果回传 |
| 上下文与证据 | `context_*`、`usecapability_*`、`incomplete_read_*`、`readiness_*` |
| 恢复与外部 | `recovery_*`、`mcp_*`、`projection_*` |

`internal/control` 的分区：门面 `controller.go`、回合编排 `turn_*` / `admission.go`、审批 `approval.go`、Goal/Plan、指令队列 `inbox_*`、会话切换 `session_*` / `rewind_*` / `snapshot_*`、引用与外壳命令 `refs.go` / `shell_*` / `slash_*`。门面很大，别通读。

## 四、点位：`runToolLoop` 每一轮的回调点

点位是执行顺序，层是包含关系，两个轴不要混。

| # | 点位 | 挂载的包 |
|---|---|---|
| ① | 组请求（外部知识进上下文） | `sessioncontext` `instruction` `outputstyle` `environment` `memory` `skill` `command` `productdocs` `retrieval` `frontmatter` |
| ② | 调模型 | `provider` `provider/anthropic` `provider/openai` `provider/responses` `boundedllm` |
| ③ | 闸门（工具执行前逐次判定） | `permission` `guardian` `runtimepolicy` `planmode` `hook` `filelock` |
| ④ | 沙箱与进程 | `sandbox` `shellsafe` `shellparse` `shellrun` `proc` |
| ⑤ | 工具本体 | `tool` `tool/builtin` `tool/sessiontool` `lsp` `websearch` `fileref` `imageinput` `jobs` `installsource` |
| ⑥ | 证据回灌 | `evidence` `capability` `incomplete_read` `readiness` |
| ↳ | 事件出口（贯穿） | `event` → `eventwire` → 宿主 |

## 五、地基带

按 fan-in 排序的底座包（现场复算，别记数字）：`provider`、`config`、`fileutil`、`fileutil/encoding`、`event`、`secrets`、`tool`、`agent`、`proc`、`store`、`evidence`、`netclient`、`shellparse`、`sandbox`、`filelock`、`billing`、`plugin`、`skill`、`nilutil`。

读代码时把这一带当空气；判影响面时它们是主角。

## 六、边界与四问

| 边界类型 | 位置 | 为什么依赖图查不出 |
|---|---|---|
| 跨进程 / 跨仓库 | 会话记录格式、事件协议、工具契约、前端生成绑定 | 消费方在依赖图之外：前端 `types.ts`、扩展 sidecar、Studio 共用数据 |
| 跨版本 | `control` 的 `*_decl.go` 挂载、`config` 默认值、写锁落在 `desktop` | 上游已停维，但历史实现与本仓库不同 |
| 跨平台 / 编译分支 | Windows-only 代码、`//go:build !windows` | 分支在本仓库不执行，改了没有反馈 |

过边界前四问：

1. 落在哪个点位 / 层？
2. 碰哪条边界？生产者必须有消费者——内核新增事件类型时，`cli` / `desktop` / `acp` / `bot` 和前端都要核对。
3. 它依赖的文件 / 框架在本仓库存在吗？
4. 它依赖的分支本仓库会走吗？

只测 `merge-tree` 冲突数不够：冲突 0 个也可能跑不通。

## 七、复算入口

```powershell
ssh <dev-host>
cd <repo>

# 包清单与依赖边（父模块 + desktop 嵌套模块）
go list -e -f '{{.ImportPath}}|{{join .Imports ","}}' ./internal/... ./cmd/... ./sdk/...
(cd desktop; go list -e -f '{{.ImportPath}}|{{join .Imports ","}}' ./...)

# 每个包的职责首行
go list -e -f '{{.ImportPath}}@@{{.Doc}}' ./internal/...

# 可达性
go list -deps ./internal/agent | Select-String '^reasonix/internal'
go list -deps ./internal/cli   | Select-String '^reasonix/internal'
```

## 八、已知边界

- 只覆盖 Go 后端；`desktop/frontend` 未纳入。
- 分区由文件名前缀聚合，前缀不保证语义完备。
- 与 Studio 的差异不展开；需要时看 `docs/design/` 或对方仓库。
