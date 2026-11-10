# 恢复与诊断（v1.20+）

Reasonix 不再提供产品化的 `reasonix-guard` 恢复壳。崩溃记录、pending 更新状态
和配置问题**不会**在下次启动时强制进入全局安全模式。

## 请使用这些命令

```text
reasonix doctor
reasonix doctor repair
reasonix crash report   # 视构建是否包含而定
```

- **doctor**：检查配置、桌面派生状态与常见安装问题，不加载 Wails。
- **doctor repair**：在用户明确选择后做安全修复。
- 崩溃上报仍为用户授权后发送，且不会改变下次启动模式。

## 安装布局

桌面端只发**一个自包含的可执行文件**：

```text
InstallRoot/                    # 便携版：放在任意位置即可
  Reasonix.exe                  # 安装版：%LOCALAPPDATA%\Programs\Reasonix-Wails
```

界面已内嵌在这个文件里；它原地自我更新：下载并校验新版本 → 把正在运行的旧文件
改名让位（`Reasonix.exe.reasonix-update-aside-<id>`）→ 新文件顶替该名字 → 重启。
替换失败会把旧文件放回去，不会留下半更新状态。全程没有启动器、版本目录、指针文件
或更新助手。

仍带 `reasonix-launcher.exe`、`current.json` 或 `versions/` 的旧安装属于上一代多文件
布局：用当前安装包覆盖安装一次，就会换成单 exe 并清掉这些残留。

## 从 1.18–1.19.x 升级

若旧客户端卡在 pending update 或安全模式循环：

1. 从官方下载页获取最新签名安装包。
2. 直接覆盖当前安装（Windows：双击安装；macOS：替换 `Reasonix.app`）。不要先卸载：
   保留原安装根目录，兼容迁移程序才能证明遗留事务属于哪个安装。
3. 启动 Reasonix 一次，确认“设置 > 更新”显示的版本正确，再尝试下一次应用内更新。
4. 兼容载荷中可能仍带有名为 `reasonix-guard` 的**一次性迁移程序**，它只把旧平铺
   布局写成 `current.json` 后自删除，并非旧 Guard 产品。

正式恢复路径**不要求**手工删除 `pending-update.json`、锁文件或 AppData。

## 应用内更新卡住

若「设置 → 更新」或顶部横幅提示上次更新尚未完成（含 `pending update already exists`、
`awaiting startup health`、`handoff backup` 等错误）：

1. 在横幅或设置里点 **「放弃上次更新」**，再点 **「重试」**。
2. 若没有该按钮或操作失败：完全退出 Reasonix 后重新启动一次（让启动路径提交或清理试用事务），再试应用内更新。
3. 若仍失败：从官方下载页获取最新签名安装包，**直接覆盖安装**当前版本，不要先卸载。
4. macOS 还需在「系统设置 → 隐私与安全性 → App 管理」中允许 Reasonix；若
   `Reasonix.app.reasonix-update-backup` 因 TCC 无法删除，请改走官方安装包覆盖路径。

如果 Windows 安装器提示 Reasonix 仍在运行，请完全退出 Reasonix 后重新运行安装器。
安装器会等待大约一分钟让可执行文件释放，超时才会放弃。

## macOS

macOS 仍由 LaunchServices 直接启动 Wails App 包；更新原子替换签名 `.app`，无
Guard 进程。

替换后的窗口真正显示后，Reasonix 只会提交启动前捕获的精确 pending 事务。对于缺少
备份摘要、或备份已经丢失的旧事务，只有在确认当前运行程序确实属于目标 App 包后才会
自动退出该事务；仍存在但身份未知的备份和原事务会被归档保留，不会删除，也不会被当作
可信来源自动回滚。
