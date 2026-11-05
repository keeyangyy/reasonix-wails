<p align="center">
  <img src="docs/logo-ghost-wave-effect.svg" alt="Reasonix" width="360"/>
</p>

<h1 align="center">Reasonix Wails</h1>

<p align="center">
  <strong>基于 Reasonix 1.x 的 Wails 桌面代码，独立维护。</strong>
</p>

<p align="center">
  在本机运行的编码 Agent：读代码、改文件、跑命令和测试。<br />
  只提供 Windows 桌面应用，不提供 CLI、TUI、浏览器版或 ACP 接入。
</p>

<p align="center">
  <a href="./README.md">English</a>
  &nbsp;·&nbsp;
  <strong>简体中文</strong>
  &nbsp;·&nbsp;
  <a href="./docs/GUIDE.zh-CN.md">使用指南</a>
  &nbsp;·&nbsp;
  <a href="./docs/planning/IMPLEMENTATION_PLAN.md">实施计划</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/keeyangyy/reasonix-wails/issues">反馈</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/keeyangyy/reasonix-wails.svg?style=flat-square&color=8b949e&labelColor=161b22" alt="license"/></a>
</p>

---

## 这是什么

Reasonix Wails 从 **Reasonix 1.x（`main-v2`）的 Wails 桌面阶段**分出。上游 1.x 目前仍在维护，但其桌面端后来也迁移到了 Electron，2.x（Studio）同样使用 Electron。本项目停留在 Go + Wails + WebView2 形态，独立维护后续功能，不再跟随上游的桌面架构调整。

它和上游的关系：

| | 上游 1.x | 上游 2.x（Studio） | 本项目 |
| --- | --- | --- | --- |
| 桌面技术 | 早期 Wails，现行 Electron | Electron | **Wails** |
| 主要入口 | CLI + 桌面 | 桌面 | **仅桌面** |
| 维护状态 | 上游仍在维护 | 上游仍在开发 | 独立维护 |
| 发布渠道 | 上游 Releases | 上游 Releases | **本仓库 Releases** |

本项目不是 Reasonix 官方发行版，功能和发布节奏由本仓库独立决定。原项目的版权、MIT 许可和贡献者署名均予保留。

## 能做什么

| 写代码 | 保持可控 | 扩展工作流 |
| --- | --- | --- |
| 读仓库、改文件、跑命令和测试，查看改动与检查结果 | 先看计划再执行、逐项审批工具权限、按轮次回退文件改动 | 接入 MCP 工具、加载 Skills、使用兼容的插件与扩展 |

更具体地说：

- **模型与提供商**：DeepSeek 预设，任意 OpenAI 兼容端点，自定义 API 与模型切换。
- **会话体验**：多标签并行、流式输出、Inbox / Steer、历史搜索、Todo、检查点与回退、会话导出（Markdown / JSON / PDF / PNG）。
- **上下文与记忆**：上下文预算与压缩、长期记忆与检索、本地历史索引。
- **本地工具**：Windows 终端（PowerShell / CMD / Bash）、Git Worktree、LSP、文件引用与附件、图片理解、`web_search` / `web_fetch`。
- **扩展与自动化**：MCP、Extension Protocol Sidecar、兼容 Reasonix / Codex / Claude 的插件格式、Hooks、Slash Commands、IM Bot、Heartbeat。
- **桌面体验**：系统托盘、通知、快捷键、主题、字体与缩放、简繁英、WebView2 故障检测与恢复。

## 下载与安装

**目前还没有正式发行版。** 首个版本计划在独立化改造完成后发布，届时通过
[本仓库 Releases](https://github.com/keeyangyy/reasonix-wails/releases) 提供：

- NSIS 安装程序（per-user，无需管理员权限）
- 版本化便携 ZIP

安装身份与上游 Reasonix、旧版 Wails 客户端分开：独立安装目录、卸载项、快捷方式和单实例锁，可以并存。**不会自动迁移或覆盖旧安装。**

> 首个版本计划使用 `0.1.0`，更新源指向本仓库，不会自动更新成上游版本。

## 从源码构建

需要 **Go 1.26+**、**Node 24+**、**pnpm 10**、**Wails v2 CLI**（版本与 `.wails-version` 一致）。

```sh
git clone git@github.com:keeyangyy/reasonix-wails.git
cd reasonix-wails
make wails-install
cd desktop
wails build
```

前端单独构建：

```sh
cd desktop/frontend
pnpm install
pnpm build
```

## 数据与隐私

- Agent 在本机运行。你配置的模型服务商只会收到请求所需的上下文。
- 配置、会话和记忆默认存放在 `%APPDATA%\reasonix`，与 Reasonix Studio 共用；本项目不会在未确认兼容性前改写这些数据。
- **不自动上传崩溃、遥测或会话内容**：相关端点在当前代码中已置空，崩溃与诊断信息只保存在本地，可手动导出。
- 独立安装身份、数据隔离与兼容性验证仍在进行中，细节见[实施计划](./docs/planning/IMPLEMENTATION_PLAN.md)。

## 文档

- [使用指南](./docs/GUIDE.zh-CN.md)
- [配置路径](./docs/CONFIG_PATHS.zh-CN.md)
- [Checkpoints 与回退](./docs/CHECKPOINTS.zh-CN.md)
- [能力诊断](./docs/CAPABILITY_DIAGNOSTICS.zh-CN.md)
- [机器人使用指南](./docs/BOT_GUIDE.zh-CN.md)
- [扩展与插件](./docs/EXTENSIONS.zh-CN.md)
- [基线审计](./docs/BASELINE_AUDIT.md) · [决策记录](./docs/planning/DECISIONS.md) · [实施计划](./docs/planning/IMPLEMENTATION_PLAN.md)

文档以仓库内 `docs/` 为唯一维护源。

## 致谢

本项目基于 [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) 的 1.x 代码，感谢原作者和所有上游贡献者。完整的贡献者名单见[上游仓库](https://github.com/esengine/DeepSeek-Reasonix/graphs/contributors?all=1)。

也感谢 [Bernardxu123](https://github.com/Bernardxu123) 设计的项目图标。

## 许可证

MIT，见 [LICENSE](./LICENSE)。原项目版权声明保留。
