## 摘要

-

## 影响范围（Blast Radius）

Blast-radius: TODO

<!--
按修改出错后的潜在影响范围判断，不按改动文件数判断：
- local：影响局部模块，不改变公共接口或共享状态
- cross-component：影响多个模块、调用方或共享接口
- broad：可能影响核心链路、持久化数据、安全边界或发布系统
必须说明受影响组件或可能后果。CI 只检查声明格式；CodeRabbit 审查等级是否合理。
-->

## 关联 issue

<!--
修复用 `Fixes #123`（必须单独成行，GitHub 才会自动关闭）；仅关联用 `Refs #123`。
-->

## 验证

-

<!--
前端改动请附渲染图；测试命令、手工验证步骤或结果写在这里。
-->

## 文档影响

Documentation-impact: TODO

<!--
用户可见改动二选一：
- Documentation-impact: updated - 改了什么
- Documentation-impact: none - 为什么文档仍然正确
-->

## 缓存影响

Cache-impact: TODO
Cache-guard: TODO
System-prompt-review: N/A

<!--
缓存敏感改动（internal/tool、internal/provider、internal/boot、internal/agent 等）必须填：
- Cache-impact: none / low / medium / high - 原因
- Cache-guard: 守卫测试或命令
改系统提示、记忆前缀、输出风格或 skill 索引时，填 System-prompt-review。
-->

## Release PR（仅 release/vX.Y.Z）

- [ ] 只改 `CHANGELOG.md` 和 `release-notes/releases.json`
- [ ] 全量 CI 通过
- [ ] app-memory 通过