# Pi Pocket 简体中文界面包

此仓库提供 Pi Pocket 的**数据型 `uiLocales` 中文语言包**，以及一个彼此独立、可选的助手侧扩展。界面包不会修改 Pi Pocket 源码，也不会自动翻译任意页面内容。

## 当前版本与兼容要求

最新语言包版本为 **0.4.0**，包含 **1,042 条固定文案和 203 个参数模板**。完整语言包保留本地集成运行时需要的词条；它比替代提案 [TannerMidd/pi-pocket#64](https://github.com/TannerMidd/pi-pocket/pull/64) 的示例包多 112 条固定文案和 13 个模板，不会因兼容尚未合并的上游提案而缩减为其 930/190 覆盖集。

**要使用本包，Pi Pocket 主程序必须实现 `uiLocales` 数据型扩展接口、认证客户端语言包下发、显式 `t()` 翻译调用以及实时启停/英文回退。** 本包只注册词典数据，不会为不含这些运行时能力的主程序补装框架。

截至 2026-10-12，原始 PR [#41](https://github.com/TannerMidd/pi-pocket/pull/41) 已关闭，因以干净基线重建而由替代 PR [#64](https://github.com/TannerMidd/pi-pocket/pull/64) 取代；#64 仍为 OPEN，尚未合并至 Pi Pocket 正式版本。该 PR 基于上游 `main` `ed50991eb9c9b92e717f819073de36633bf83425`。上游最新正式版当时为 0.13.1；未经包含 locale runtime 的主程序不能仅通过安装此包获得中文界面。此前验证过的私有/本地集成构建不等于正式发行版兼容承诺。

## 安装与启用

从 GitHub Release 下载 `zh-cn-ui.ts`，先检查目标数据目录 `extensions/` 内没有同名文件，再复制进去：

```bash
mkdir -p ~/.pi-pocket/extensions
cp ./zh-cn-ui.ts ~/.pi-pocket/extensions/zh-cn-ui.ts
```

若主程序使用自定义数据目录，请放入该目录下的 `extensions/`，不要放在源码目录。随后由所有者在 **菜单 → 扩展** 中启用 `zh-cn-ui.ts`；drop-in 默认关闭。启用前请检查完整扩展文件，因为启用的服务器扩展在服务器进程中以所有者权限运行。

默认 `zh-CN` 只表示在**已启用**的语言包中优先选择此 locale，不会自动启用扩展。关闭扩展后，已打开界面应实时恢复英语；没有可用语言包或没有对应键时使用英文原文。语言选择不按用户保存。

### 词条边界与已知残余

仅应用代码明确调用 `t("English")` 或 `t("English {{name}}", { name })` 的固定界面文案会被翻译。占位参数原样插入且不递归翻译。会话标题、姓名、用户/模型/工具正文、模型/provider 标识、文件路径、自定义指令和技能、原始服务器/provider 错误及持久化历史活动不会被全局替换。认证前页面、未结构化的通知/HTTP 错误、部分动态状态及未接入 `t()` 的界面仍可能显示英文。1,042/203 和零直接调用缺键审计并不代表界面完整汉化。

## 可选助手侧扩展

`zh-cn-localization.ts` 是独立的助手侧指引扩展，不提供网页 UI 词典，也不会随 UI 语言包自动启用。需要时可单独复制到同一数据目录的 `extensions/`，并由所有者单独检查和启用。UI 词典不依赖它。

## Legacy 安装器

`install-ui.mjs`、`ui-patch.json` 和源码补丁流程仅作为旧版本迁移材料保留。不要使用它们安装/卸载新的 `uiLocales` 包，也不要删除、覆盖旧备份目录；安装器对带 locale runtime 标记的目标会拒绝操作。该保护不是 runtime 安装器。

## 测试、Release 与许可

需要 Node.js 22.19+；独立包 `npm test` 无需安装依赖。测试词典及模板回归、动态内容保真、旧安装器迁移拦截，不替代 Pi Pocket 主程序测试。

发布前还使用包含 `uiLocales` 的隔离主程序副本运行真实 extension loader，并用 Chromium 在 390×844 手机和 1280×800 桌面视口检查多个面板的实时启停、英语回退、草稿/标题/model ID 保持、HTML-looking 输入安全、无横向溢出与 console error。测试使用隔离临时数据和 scripted model，不会发出真实模型请求；没有验证真实 GitHub watch/Web Push、麦克风授权或真实压缩后端。详细审计见 `EXPANDED_AUDIT.md` 与 `VALIDATION.md`。

GitHub Release 附带语言包 `zh-cn-ui.ts`，并为源码仓库版本附上 `LICENSE`、`UPSTREAM-LICENSE` 与助手侧文件。项目采用 MIT 许可；来源说明见 `UPSTREAM-LICENSE`。`package.json` 标记为 private，本项目**不发布 npm 包**。
