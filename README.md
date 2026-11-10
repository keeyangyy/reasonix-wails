<p align="center">
  <img src="docs/logo-ghost-wave-effect.svg" alt="Reasonix" width="360"/>
</p>

<h1 align="center">Reasonix Wails</h1>

<p align="center">
  <strong>Windows 桌面编码 Agent：一个 exe，双击即用。</strong>
</p>

<p align="center">
  读代码、改文件、跑命令与测试，全部在本机完成。<br />
  无需迁移数据，不随上游更换桌面架构。
</p>

<p align="center">
  <strong>简体中文</strong>
  &nbsp;·&nbsp;
  <a href="./README.en.md">English</a>
  &nbsp;·&nbsp;
  <a href="./docs/GUIDE.zh-CN.md">使用指南</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/keeyangyy/reasonix-wails/issues">反馈</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/keeyangyy/reasonix-wails.svg?style=flat-square&color=8b949e&labelColor=161b22" alt="license"/></a>
</p>

---

## 项目介绍

Reasonix Wails 是一个 Windows 桌面编码 Agent：读仓库、改文件、执行命令与测试；界面与资源均打包进单个 exe，无需安装即可运行。

本项目源自 **Reasonix 1.x（`main-v2`）分支的 Wails 桌面实现**。上游桌面端已迁移至 Electron，2.x（Studio）同样基于 Electron；本项目则继续沿用 Go + Wails + WebView2 技术栈：界面复用系统自带的 WebView2，不随包分发 Chromium 与 Node 运行时，当前构建产物为单个约 75 MB 的可执行文件，在体积、启动速度与常驻内存占用上更具优势。功能沿该技术栈独立演进，不跟随上游的桌面架构调整。

与上游的关系：

| | 上游 1.x | 上游 2.x（Studio） | 本项目 |
| --- | --- | --- | --- |
| 桌面技术 | 早期 Wails，现行 Electron | Electron | **Wails** |
| 发布形态 | CLI + 桌面 | 桌面 | **Windows 桌面应用** |
| 维护状态 | 上游仍在维护 | 上游仍在开发 | 独立维护 |
| 发布渠道 | 上游 Releases | 上游 Releases | **本仓库 Releases** |

本项目并非 Reasonix 官方发行版，功能范围与发布节奏由本仓库独立决定。原项目的版权声明、MIT 许可与贡献者署名均予保留。

## 特点

| 写代码 | 保持可控 | 扩展工作流 |
| --- | --- | --- |
| 读仓库、改文件、执行命令与测试，查看改动与检查结果 | 先审阅计划再执行、逐项审批工具权限、按轮次回退文件改动 | 接入 MCP 工具、加载 Skills、使用兼容的插件与扩展 |

- **单文件分发**：界面与资源均打包进一个 exe，无需安装器、启动器、版本目录或任何附属文件；升级时就地替换，替换失败时回滚至旧文件。
- **Go + Wails + WebView2：体积小、启动快**：界面复用系统自带的 WebView2（Edge 内核），不随包分发 Chromium 与 Node 运行时；当前构建产物为约 75 MB 的单个文件，启动更快、常驻内存更低。WebView2 缺失时，安装版在安装阶段读取注册表检测，仅在缺失时静默执行内嵌的 bootstrapper；便携版在首次启动时若发现缺失或版本过旧，会提示用户确认后安装。该过程需要网络连接。
- **模型与提供商**：DeepSeek 预设，任意 OpenAI 兼容端点，自定义 API 与模型切换。
- **会话体验**：多标签并行、流式输出、Inbox / Steer、历史搜索、Todo、检查点与回退、会话导出（Markdown / JSON / PDF / PNG）。
- **上下文与记忆**：上下文预算与压缩、长期记忆与检索、本地历史索引。
- **本地工具**：Windows 终端（PowerShell / CMD / Bash）、Git Worktree、LSP、文件引用与附件、图片理解、`web_search` / `web_fetch`。
- **扩展与自动化**：MCP、Extension Protocol Sidecar、兼容 Reasonix / Codex / Claude 的插件格式、Hooks、Slash Commands、IM Bot、Heartbeat。
- **桌面体验**：系统托盘、通知、快捷键、主题、字体与缩放、简繁英、WebView2 故障检测与恢复。

## 与上游共用的配置与会话

本项目与上游 1.x、Reasonix Studio 位于同一个 `%APPDATA%\reasonix` 目录下（可通过 `REASONIX_HOME` 覆盖）。共用的部分直接沿用，不属于本项目的会话保持原样：

- **配置文件**：使用同一个 `config.toml`。加载优先级为命令行参数 > 项目级 `./reasonix.toml` > 用户级 `config.toml` > 内置默认值；在 Studio 或 1.x 中已配置的模型与提供商，本项目直接沿用。
- **记忆与项目数据**：同一 home 下的 `REASONIX.md`、`memory/`、`skills/`、`plugins/` 等目录由两条线路共用。
- **会话格式**：本项目写入格式 2（`<id>.events.jsonl` 的 DAG 事件日志）。格式 1（1.39.0 之前）可正常打开，但首次保存时会就地升级为格式 2，此后早于 1.39.0 的 1.x 客户端将无法再打开该会话——兼容是单向的。
- **更新的格式**：1.x 后续版本继续演进过会话格式，本项目遇到不支持的版本时直接报错，不修改任何字节。
- **Studio 线路的会话**：依据 sidecar 中另一线独有的字段（`archived`、`superseded`、`imported_from`、`recovery_root_id`）识别，识别后跳过：不列出、不打开、不静默迁移，也不改写其文件。
- **安装身份**：独立的安装目录、卸载项、快捷方式与单实例锁，可与上游及旧版 Wails 客户端并存，不会自动迁移或覆盖既有安装。

## 下载与安装

从[本仓库 Releases](https://github.com/keeyangyy/reasonix-wails/releases) 下载，两种形式基于同一个自包含二进制：

- **便携版** `Reasonix-windows-amd64.exe`：下载后双击即可运行；界面与资源均包含在该文件中，无需安装器、启动器、版本目录或任何附属文件。
- **安装版** `Reasonix-windows-amd64-installer.exe`：per-user 安装，无需管理员权限；将同一个 exe 安装至独立目录，并创建快捷方式与卸载项。

升级在原位置完成：下载新版本 → 正在运行的旧文件改名让位 → 新文件顶替该名称 → 重启；替换失败时回滚至旧文件。更新元数据由本仓库提供。

## 从源码构建

需要 **Go 1.26+**、**Node 24+**、**pnpm 10** 与 **Wails v2 CLI**（版本需与 `.wails-version` 一致）。

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

- Agent 在本机运行；所配置的模型服务商仅会收到完成请求所需的上下文。
- **不自动上传崩溃报告、遥测数据或会话内容**：桌面端未接入遥测与崩溃上报链路；崩溃与诊断信息仅写入本地文件，可按需手动导出。
- 会话与配置的共用关系，以及本项目不会打开哪些会话，参见上文「与上游共用的配置与会话」。

## 文档

- [使用指南](./docs/GUIDE.zh-CN.md)
- [配置路径](./docs/CONFIG_PATHS.zh-CN.md)
- [Checkpoints 与回退](./docs/CHECKPOINTS.zh-CN.md)
- [能力诊断](./docs/CAPABILITY_DIAGNOSTICS.zh-CN.md)
- [机器人使用指南](./docs/BOT_GUIDE.zh-CN.md)
- [扩展与插件](./docs/EXTENSIONS.zh-CN.md)

产品文档以仓库内 `docs/` 为准；开发计划、审计与过程记录不纳入仓库。

## 致谢

本项目基于 [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) 的 1.x 代码，感谢原作者及所有上游贡献者。完整贡献者名单见[上游仓库](https://github.com/esengine/DeepSeek-Reasonix/graphs/contributors?all=1)。

亦感谢 [Bernardxu123](https://github.com/Bernardxu123) 设计的项目图标。

## 许可证

MIT，详见 [LICENSE](./LICENSE)。原项目版权声明保留。
