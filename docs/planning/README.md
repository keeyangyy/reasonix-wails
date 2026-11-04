# Reasonix Wails

> **文档维护约定（2026-11-05）**：本目录是新项目规划、决策与实施计划的**唯一维护源**。此前放在项目库 `tmp/` 下的副本不再更新；任何修改只改本仓库内文档。

> **项目状态：独立化重构准备中；新仓库尚未完成迁移，暂无此项目的正式发行版。**
>
> 基于 [DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) 的**非官方、独立维护** Windows 桌面衍生项目。项目继承既有 Git 历史及适用的 MIT 版权声明，不代表原项目官方发布。

[English](README.md) · [分阶段实施计划](docs/IMPLEMENTATION_PLAN.md) · [决策记录](docs/DECISIONS.md)

## 项目定位

Reasonix Wails 将现有 `wails-mine` 分支演进为专注 **Windows x64** 的 Go + Wails + WebView2 桌面 AI Agent。保留成熟的 Go Agent 核心、工具、插件体系与主要桌面功能，删除不再需要的 CLI/TUI 产品、Serve/Web 远程前端、SSH 远程工作区、ACP 适配器、云端账户／论坛／故障上传服务以及非 Windows 桌面构建。

这是**独立发行版**，不是上游官方客户端；本项目未来的下载、自动更新、反馈和版本记录均由独立仓库管理。不会通过本项目自动更新上游应用。

### 主要能力（目标保留范围）

- **Agent 与模型**：多模型／多提供商、自定义 API、模型切换、Agent 质量预设、Output Style、计划／权限、Guardian 审计、Hooks、Slash Commands、Skills。
- **完整会话体验**：实时流式输出、多标签并行、Inbox 与 Steer、历史搜索、Todo、检查点／回退、会话导出、Markdown/KaTeX、代码预览及 Diff。
- **上下文与记忆**：上下文预算及压缩、长期记忆、检索、会话与历史索引。兼容现有 Studio 数据格式。
- **本地开发工具**：Windows 终端（PowerShell/CMD/Bash）、Git Worktree、LSP、文件引用、附件、图片理解、`web_search` 与 `web_fetch`。
- **扩展与自动化**：MCP（手动配置／安装）、Reasonix Extension Protocol Sidecar、兼容现有 Reasonix/Codex/Claude 插件格式、IM Bot、Heartbeat、任务监控。
- **Windows 桌面体验**：系统托盘、通知、可配置快捷键、主题、字体与缩放、中文简繁／英文、启动引导、WebView2 故障检测与恢复。

上述是**已确认的功能目标**，不表示全都已在新的独立仓库中构建和验收。各版本以 Release 和变更日志列出的实际功能为准。

## 两阶段路线

| 阶段 | 目标 | 边界 |
|---|---|---|
| **第一阶段：独立化与安全裁剪** | 创建独立仓库、隔离安装／进程身份、删除旧服务与不发布的产品入口、重建 Windows 构建／更新／发布链、验证共享数据兼容 | 尽可能维持现有前端和会话运行机制；只修复阻塞性或数据安全问题 |
| **第二阶段：前端与会话架构重构** | 重新整理 Wails 事件桥接、前端状态所有权、会话实时事件与渲染、滚动／虚拟化及恢复机制 | 保留已有 Agent 功能及 Studio 兼容数据格式，不以“重写 UI”为理由推倒成熟内核 |

具体任务、每步验收和回退方案见 [实施计划](docs/IMPLEMENTATION_PLAN.md)。

## 运行与发行计划

- **平台**：Windows 10/11 x64；桌面应用基于 Wails v2 / WebView2（以迁移后构建产物为准）。
- **正式发行物**：每版本提供 NSIS 安装程序和**版本化便携 ZIP**。便携版保留经过签名验证和失败恢复的原地更新。
- **安装隔离**：安装根、快捷方式、注册表卸载项、运行锁、通知标识和 WebView2 用户数据与旧 Reasonix 分离；**不自动迁移或覆盖旧安装**。
- **配置兼容**：与 Reasonix Studio 保持用户所需的配置、会话、记忆和插件数据路径及格式兼容；仅可重建的缓存、窗口状态等产品私有数据单独隔离。任何写入或清理操作都不得损坏 Studio 的数据。
- **自动更新**：使用本仓库的 GitHub Releases、现有**单一固定更新指针 + 客户端 Stable/Beta 过滤**机制。保留 `latest.json` / `versions.json` 的现有行为、镜像／代理能力和严格 Minisign 验证；不在独立化阶段改写已正常使用的频道发现算法。
- **隐私**：本地诊断、脱敏、手动导出；**不自动向原项目或其他服务上传崩溃日志、遥测或会话内容**。反馈入口将指向本仓库的 GitHub Issues。

> 计划中的默认安装目录为 `%LOCALAPPDATA%\Programs\Reasonix-Wails`，主程序建议命名 `reasonix-wails.exe`。这是待实施的命名提案；以第一阶段完成的产品身份核验结果为准。配置数据目录**不随安装目录改名**。

## 不包含的产品形态

本项目**不**发布独立 CLI/TUI、`serve` 网页工作台、SSH/SFTP 远程工作区、ACP 适配器、npm/Homebrew CLI 包，或维护原项目的 Cloudflare Workers 在线服务。注意：这不代表删除本地终端、通用 Go Agent 核心、MCP、HTTP 模型请求、LSP、SDK 或测试工具。

## 开发和构建

第一阶段以原仓库 [`keeyangyy/DeepSeek-Reasonix`](https://github.com/keeyangyy/DeepSeek-Reasonix) 的 `wails-mine` 分支作为**基线来源**；目标是在独立仓库 `keeyangyy/reasonix-wails` 的 `main` 分支保留完整祖先提交历史，完成发布体系迁移。

原分支已核实的基础工具链：

- Go：`go.mod` 声明 `go 1.26.0`、`toolchain go1.26.10`。
- 前端：Node.js、pnpm（`desktop/frontend/package.json` 声明 pnpm `10.34.5`）、React / TypeScript / Vite。
- 桌面发布：Wails v2、Windows 构建环境、NSIS 和 WebView2 运行时／引导包。

**暂不提供一条声称已验证的新仓库构建命令**：第一阶段的第一项工作就是固定基线 SHA、检查现有 CI／脚本并生成可重复的 Windows 构建说明。实际操作和验收命令见实施计划；不要使用原 README 里的 `npm i -g reasonix`、上游网站下载或上游 Release 更新本项目。

## 数据安全与兼容性

共享数据不是共享运行身份。安装器、卸载器、自动更新器、诊断清理和回滚工具不得直接删除、覆盖或无条件“升级” Studio 的权威会话数据。涉及格式写入时须先做备份、跨版本读写测试、并发访问测试，并明确哪些索引为可重建缓存。卸载本项目默认保留用户共享数据。

## 许可证、来源及品牌

本项目基于 MIT 授权代码衍生，保留原项目及第三方组件适用的版权、许可与 NOTICE。上游来源：[esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix)；既有定制分支来源：[keeyangyy/DeepSeek-Reasonix · wails-mine](https://github.com/keeyangyy/DeepSeek-Reasonix/tree/wails-mine)。

**代码 MIT 许可不自动授予商标或原图标的独立品牌使用权。** 正式公开发行前需确认名称和图标／素材可用范围；如不能确认，则改用独立图标并标注与原项目无官方关联。此项不阻塞内部编译、测试和架构清理。

## 参与和反馈

新仓库建立后，缺陷和功能建议将提交至新仓库 Issues。正式发行说明、下载链接、CI 徽章和官网将在对应流水线通过并实际发布后添加；在此之前不使用原项目的下载量、社区或发布徽章来表示本项目状态。
