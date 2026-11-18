# 代码规则

## 分层

- Go 内核在 `internal/`，每个包只负责一件事；包的长说明放 `doc.go`。
- 一个与传输无关的 `control.Controller` 位于所有前端之后；行为加在 controller，不加在前端。
- 分层由 `tools/repolint/layers.go` 强制：utility 包不 import `reasonix/` 下任何包；只有前端 `cli`、`acp`、`bot`、`botruntime`、`boot` 和宿主 `cmd/`、`desktop/` 可以 import `control`；前端以下不得反向 import。
- 子代理五概念分开：profile 决定怎么想，TaskSpec 决定这次要什么，CapabilityGrant 决定能碰什么，ContextRequest 决定从什么开始，SchedulerPolicy 决定何时跑。字段放在决定其值的那一层；profile 只承载上限，不承载单次值。`internal/agent/profile_boundary_test.go` 强制。

## 缓存与性能

- Cache-first：system prompt 前缀（base prompt + tools + memory）跨轮字节稳定，不要中途改写；新内容走 turn tail（`control.Compose`）。
- 性能特性必须在最终边界有 effect test（`internal/boot/effect_test.go` 模式）：断言真正到达 provider 请求、前端 sink 或轨迹，而不是只测组件。
- mutex / atomic 保护的 struct 按 scalar 字段数 ratchet；不要靠新增 bool 修边界，按生命周期归组为命名子状态（`agent.perTurnState` 模式）。

## 注释与规模

- 默认不写注释；只在 why 不明显时写：隐藏约束、可验证的 workaround、类型系统表达不了的不变量、外部协议怪癖。
- 声明注释 ≤15 行；包注释 ≤8 行，`doc.go` ≤40 行；其他注释 ≤3 行；struct 字段和行尾 `//` 1 行。
- 禁止：复述代码、阶段叙事、事故/会话历史、分节横幅、注释掉的代码、`@param` 列表。
- `TODO(#nnn)` / `HACK(#nnn)` 必须带 issue；禁止 `FIXME`。
- 一个文件一个职责；800 行上限。
- `go run ./tools/repolint` 按 ratchet baseline 强制执行；不得放宽 baseline，先修代码。`-update` 只用于改名/抽取带债，PR 里说明理由。

## Import cycle

新增非测试文件的 internal import 前，先确认目标包的**测试文件**没有反向 import 当前包：

```
# BAD: agent(_test.go) → tool/builtin(sessions.go) → agent → setup failed
```

用 `go test ./path/to/target/` 在 push 前检测；`[setup failed]` 表示存在环。

## 记忆与规则

- 规则层级：仓库根 `AGENTS.md`；`*.local.md` 个人变体；祖先目录同名文件；用户级 `AGENTS.md`。同目录所有支持的文件都会加载，`AGENTS.md` 不是 fallback。
- `@path` 独占一行时导入另一个文件的内容。
- 会话内 `#<note>` 快速添加常驻指令；`remember` 工具保存可失效的后台事实（frontmatter + `MEMORY.md` 索引），`scope` 控制项目级/全局。

