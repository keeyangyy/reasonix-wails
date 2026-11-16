# 单 exe 分发与更新

本仓库的 Windows 桌面端只发一个自包含 exe；安装器只负责首装，更新走原地替换。

## 分发形态

- **便携版**：`Reasonix-windows-amd64.exe`，UI 与资源全在文件内，不再产出 portable zip。
- **安装版**：NSIS 只做首装，把同一个 exe 放进独立目录、建快捷方式与卸载项，不再铺版本目录。
- **CLI**：`reasonix-cli-windows-amd64.exe`，同一版本戳。

去掉 launcher、`current.json`、`versions/<version>/` 这层间接；用户拿到的就是一个可双击的 exe。

## 自更新

- 下载新 exe → 正在运行的旧文件改名让位 → 新文件顶替该名字 → 重启；替换失败回滚到旧文件。
- 更新源是本仓库的固定锚点 `wails-latest`，不跟随上游。
- 更新产物与清单用 Minisign 校验，密钥一旦建立不重建——重建会使旧客户端无法验证新产物。
- 更新器 UA 保留 `Reasonix-Updater/<version>`，版本自成体系。

## 升级链注意事项

- `UpdateEnvironment` 给 helper 的 `REASONIX_HOME` / `REASONIX_UPDATE_INSTANCE_ID` 只用于 helper 校验数据 home；helper 重启新主程序时用 `WithoutUpdateEnvironment` 剥掉。否则新主程序派生的 shell 会带 `REASONIX_HOME=%APPDATA%\reasonix`，表现为隔离运行时（跳过用户目录 output-styles、跳过 legacy 迁移），只在应用内升级过的进程链上出现，重启应用即消失。
- 每次升级会新建 `reasonix-update-helper-*.exe`（约 9 MB）；现在暂存后回收同目录旧副本，被占用删不掉的留到下次。
- 缓存位置：`config.CacheDir()/updates`（Windows 为 `%LOCALAPPDATA%\Reasonix\updates`）；installer 同名覆盖不累积。

## 产物命名

- 安装包只保留无版本号的 `Reasonix-windows-amd64-installer.exe` 一份；更新器只认这个名字，版本在 tag 与 `latest.json` 里。
- 便携版命名要能自描述，不要用裸 `Reasonix-windows-amd64.zip`。
- 带版本号的重复安装包已经删除：同一份约 58 MB 文件存两遍没有收益，GitHub Release 也不支持软链。
- 命名改动只对之后的 Release 生效；历史附件保持原样，删了可能让旧版更新器失败。

## 预发布 tag

- 支持 `vX.Y.Z` 与 `vX.Y.Z-beta.N`；必须三段数字。
- `release-manual` 在创建 tag 前校验格式，tag 一旦推送很难撤。
- beta 与正式版走同一条发版链、同样刷新 `wails-latest`；beta 语义只落在 `versions.json` 的 channel。

## 镜像通道

- 安装包、清单、版本目录和签名文件都应走同一套镜像候选，官方只作最终兜底。
- 只给安装包加镜像、漏掉签名，会出现“安装包下载成功、签名失败”的假故障；根因是两条下载路径不一致。
- 报错里显示的官方 URL 往往不是真正原因，镜像那次失败才是；当前错误只保留最后一个候选的错误。

## 回归点

- 更新文件命名与 `latest.json` 的 `platforms` 匹配逻辑必须同步；便携版 zip 不进 manifest。
- 改升级链后，确认新主程序没有继承 helper 的 `REASONIX_HOME`。
- 镜像重试逻辑放在 `update_mirror.go`，不要撑大 `updater.go` 的行数预算。
