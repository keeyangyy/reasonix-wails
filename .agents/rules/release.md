# 发布

发版只能由用户明确发起。开发、提交、合并、CI 绿都不构成发版理由。

详细手册：[docs/ops/RELEASING.md](../../docs/ops/RELEASING.md)；本文件只写执行要点和门禁。

## 版本

- 正式：`vMAJOR.MINOR.PATCH`；预发布：`vMAJOR.MINOR.PATCH-beta.N`。
- 必须三段数字；四段会让 NSIS 版本无效。
- 版本号属于本仓库，与上游 1.x / 2.x 无关。

## 发版准备

1. 所有代码 PR 合入 `main`，完整 CI 绿。
2. 从 `main` 开 `release/vX.Y.Z`，只改 `CHANGELOG.md` 和 `release-notes/releases.json`。
3. 开 PR；CI 强制全量，并跑一次 app-memory；确认两者绿后合并。
4. 合并后的 release commit 只触发轻量 CI；`release-manual` 会校验它只改了文档。

## 流程

1. 确认 release commit 的 `CI` 为绿。
2. Actions → `Release (manual)`，输入 `X.Y.Z`（不带 `v`）和 notes。
3. 工作流等待该提交的 CI；红则中止，**不产生 tag**。
4. 绿后创建 annotated tag，创建 draft Release，并触发 `Release Windows`。
5. `Release Windows` 构建桌面端、安装器、CLI，上传产物、签名、写 `latest.json`、刷新 `wails-latest`。
6. 产物齐全后才发布；draft 不得提前公开。

直接 push tag 也能触发 `release-windows.yml`，但绕过“CI 必须绿”的门禁；除重发已有 tag 外不要用。

## 产物

- `Reasonix-windows-amd64.exe`（便携、自更新）
- `Reasonix-windows-amd64.exe.minisig`
- `Reasonix-windows-amd64-installer.exe`
- `reasonix-cli-windows-amd64.exe`
- `latest.json`
- `wails-latest` 锚点上的 `latest.json` / `versions.json`

## 发版说明

notes 必写，骨架：

```
<1~3 句面向用户的概览>

## 新增
## 变更
## 修复
## 其他（可选）
## 注意（可选）

---

## 变更总览（<上一版 tag> → <本版 tag>）
```

章节顺序固定，无内容省略；总览按时间正序、去掉 hash、过滤 `chore(release)` 与 merge 行。发完把远端 body 与本地 notes 逐字比对。

## 签名

- 更新器与更新清单用 Minisign，secrets：`MINISIGN_PRIVATE_KEY`、`MINISIGN_PASSWORD`。
- Authenticode 未配置；SmartScreen 首次运行会提示。

## 核对

- tag 指向目标提交；Release 非 draft；产物齐全；`wails-latest` 已含新版本。
- `gh release view <tag> -R keeyangyy/reasonix-wails --json isDraft,name,assets`。
- 只有下载附件成功，不能证明应用内更新已发布。
