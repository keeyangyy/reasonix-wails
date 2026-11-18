# 文档索引

<a href="../README.md">项目 README</a>
&nbsp;·&nbsp;
<a href="./guide/GUIDE.zh-CN.md">简体中文使用指南</a>

本目录保存项目的持久化文档。**`docs/guide/` 是唯一面向使用者的文档目录**；其余目录均面向开发者或维护者。

## 使用者文档

| 目录 | 内容 | 入口 |
|---|---|---|
| [`guide/`](./guide/) | 安装、配置、模型、会话、权限、扩展与主题等使用说明 | [简体中文指南](./guide/GUIDE.zh-CN.md) |

## 开发者与维护者文档

| 目录 / 文件 | 内容 | 入口 |
|---|---|---|
| [`architecture.md`](./architecture.md) | 总体架构、主干调用链、分层与代码阅读入口 | [架构导航](./architecture.md) |
| [`design/`](./design/) | 内部机制与详细设计，包括会话、Transcript、子代理和扩展运行时 | [会话所有权](./design/SESSION_OWNERSHIP.md) |
| [`spec/`](./spec/) | 工具、任务、推理、扩展协议等实现契约 | [规范索引](./spec/SPEC.md) |
| [`decisions/`](./decisions/) | 重要取舍、决策理由及被取代关系 | [决策索引](./decisions/README.md) |
| [`research/`](./research/) | 技术调研、方案探索与备选路线分析 | — |
| [`analysis/`](./analysis/) | 技术分析、故障根因、性能评估与回归风险 | [分析索引](./analysis/README.md) |
| [`ops/`](./ops/) | 发布、恢复和维护操作流程 | [发布指南](./ops/RELEASING.md) |
| [`eval/`](./eval/) | 可选的成对评估，不作为发布门禁 | — |
| [`assets/`](./assets/) | 文档引用的截图、示意图和设计素材 | — |
| [`superpowers/`](./superpowers/) | 测试使用的规格与 golden fixtures | — |
| [`archive/`](./archive/) | 已退役、被取代或不再维护但仍有留存价值的文档 | [归档索引](./archive/README.md) |

## 协作计划与临时资料

需要跨会话协作的长期计划放在仓库根目录的 `plan/`。它们是工作材料，不属于持久化项目文档；完成后按计划规范清理，有长期价值的结论再提炼到正式文档。

本地短期计划和临时过程资料放在 `tmp/`，不提交、不纳入 CI。

## 文档约定

- 使用者说明只放在 `guide/`；其他文档不得混入面向普通用户的操作指南。
- `design/` 记录机制与实现设计，`decisions/` 记录关键取舍和理由；相互链接，避免重复。
- `analysis/` 保存经验证且仍有价值的技术结论；探索过程放在 `research/`；退役但有历史价值的内容放在 `archive/`。
- 构建时由 [`docs/embed.go`](./embed.go) 嵌入顶层 Markdown，以及 `guide/`、`spec/`、`design/`、`ops/` 中的 Markdown；开发台账、调研、评估和素材目录不进入内置文档语料。
- `spec/TOOL_CONTRACT.md` 与 `spec/EXTENSION_PROTOCOL.generated.md` 由运行时注册表生成；修改其源文件，不直接编辑生成结果。
