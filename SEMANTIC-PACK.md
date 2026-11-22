# 简体中文语义键语言包

`zh-cn-semantic.ts` 是独立的 Pi Pocket 外置模块。它只调用 `web.uiLocales()` 注册 `zh-CN` 文本，不读取配置、会话或凭据，也不提供工具、路由或浏览器脚本。

## 兼容范围

- 适用于含 `web.uiLocales` API 的 Pi Pocket 构建。官方原版 `v0.30.1` 本身不提供此 API；请使用实现该 API 的构建。API 首次正式发布版本尚未指定。
- 词典来自已部署中文源提交 `338b4347f8cf8185cbad03e122fd216fbd3d6a4d` 的 `src/server/extensions/zh-cn/messages.ts`，并按新版已确认的语义键补充。缺失键使用英文回退。
- 不同时启用本模块与旧 `zh-cn-ui.ts`，也不要在仍自动注册内置中文的构建上启用本模块。旧外置模块为不同的接口和字典保留。

## 安装、使用和更新

1. 将此仓库所需提交中的 `zh-cn-semantic.ts` 安装到 Pi Pocket 数据目录的 `extensions/`（默认 `~/.pi-pocket/extensions/`）。该模块不需要安装依赖或复制其他文件。
2. 在 **菜单 → 扩展** 启用 `zh-cn-semantic.ts`，在 **外观 → Language / 语言** 选择简体中文。已有的 `zh-CN` 浏览器偏好无需重设。
3. 停用此模块后，如果没有其他语言包提供 `zh-CN`，界面回退英文，原中文偏好保留。再次启用即可恢复。
4. 更新时仅替换此独立模块文件。若新版模块加载失败，Pi Pocket 保留原已加载版本并显示错误。
