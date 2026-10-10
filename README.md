# Pi Pocket 简体中文界面包

本项目现在以 Pi Pocket 的数据型 `uiLocales` 扩展接口提供网页界面中文包。界面词条作为普通数据由服务器提供给已登录客户端，不再通过改写 `web/` 源码来安装。

## 当前状态

**需要主程序支持 `uiLocales` 接口；未经修改的上游 0.11.0 / 0.12.1 不能直接使用。** 通用接口正在单独提交上游，不属于本仓库的安装器，也尚未随上游正式版本发布。

本包 0.3.0 包含 **679 条固定文案、91 条参数模板**，在带接口的 0.11.0 分支上经过实际部署验证。独立包测试 **17/17**；旧上游基线 `d01f763` 加通用接口的测试为 **250/250**，不是最新上游的测试结果。0.12 新界面未全部覆盖，缺失词条保留英文。详见 `VALIDATION.md`。

项目源码与版本记录：[github.com/Xianbei233/pi-pocket-zh-cn](https://github.com/Xianbei233/pi-pocket-zh-cn)。

## 界面中文包

`zh-cn-ui.ts` 是独立的 drop-in 扩展，只注册 `zh-CN` 的界面词典，不改 Pi Pocket 程序文件。先检查目标目录中是否已有同名文件，再把它复制到当前 Pi Pocket 数据目录的 `extensions/` 下：

```bash
mkdir -p ~/.pi-pocket/extensions
cp ./zh-cn-ui.ts ~/.pi-pocket/extensions/zh-cn-ui.ts
```

如果服务器使用自定义 `PI_POCKET_DIR`，复制到该数据目录的 `extensions/`，而不是 Pi Pocket 源码目录。之后由所有者在 **菜单 → 扩展** 中启用 `zh-cn-ui.ts`；drop-in 默认关闭。扩展代码仍在服务器内以所有者权限加载，启用前应检查完整文件。

包内的 `default: true` 只表示：当多个已启用扩展提供语言包时，优先选择这个包；它不会自动启用扩展。选择顺序为优先 `default: true`，再按 locale 字符串排序。没有已启用的语言包时界面使用英语；语言选择不按用户保存，也没有单独的用户语言设置。

词条只作用于前端代码显式调用 `t("English")` 或 `t("English {{name}}", { name })` 的界面文案。缺少词条时保留英文。模板参数按原值插入，不会递归翻译；会话名称、成员姓名、用户消息、文件路径、模型名称、日志、错误原文及任意网页内容不会被自动翻译。语言包以数据形式随已登录客户端的 `hello.server.uiLocales` 下发，没有公开词典端点，也不会把扩展 JavaScript 注入浏览器。

扩展启用、编辑和删除由 Pi Pocket 的扩展 loader 管理。禁用或删除会移除该包；已启用扩展编辑后会尝试 reload，若新版本无效则保留旧版本。相同 locale 的重复注册会被拒绝。locale 字段应使用规范的 BCP 47 标签；校验和数据限制以实际运行的主程序版本为准，不依赖未文档化的具体配额。

## 助手侧可选扩展

`zh-cn-localization.ts` 是独立的助手侧扩展，保持原样，与网页界面语言包互不依赖。它提供简体中文回复指引并本地化部分内置工具简介；不提供网页 UI 词典。若需要，可单独复制并在扩展面板启用：

```bash
mkdir -p ~/.pi-pocket/extensions
cp ./zh-cn-localization.ts ~/.pi-pocket/extensions/zh-cn-localization.ts
```

两种扩展都由所有者分别启用或关闭；关闭界面包不会影响助手侧扩展，反之亦然。

## 旧补丁与备份

`install-ui.mjs`、`ui-patch.json` 及相关源码补丁流程现为 **legacy**，面向旧版源码补丁工作流，不能用于新的 `uiLocales` 接口。不要用旧安装器安装新界面包，也不要运行旧卸载命令。已有正式备份目录 `.pi-pocket-zh-cn-backup/` 必须保留；不要删除、覆盖或通过旧卸载器处理它。旧脚本、补丁文件及备份均不因本说明更新而删除。

## 测试与许可

需要 Node.js 22.19+；不需要安装依赖即可运行 `npm test`。这包含词典/模板测试、运行时测试夹具和旧补丁迁移保护测试，不等同于整个 Pi Pocket 的端到端验证。

使用包含 `uiLocales` 的 Pi Pocket 源码及其已有依赖，可另行运行真实 loader 冒烟测试（使用临时数据、scripted model）：

```bash
node ui-extension-smoke.mjs /path/to/pi-pocket
```

本项目采用 MIT 许可，见 `LICENSE`；Pi Pocket 衍生源码及测试夹具的归属见 `UPSTREAM-LICENSE`。GitHub Release 提供单文件语言包；不发布 npm 包。

### 迁移拦截保护（自独立包 0.2.0 起）

旧 `install-ui.mjs` 会检查目标 `web/i18n.js` 是否包含 `export function setUiLocales(`。检测到该接口标记时，`check`、`install` 和 `uninstall` 三种命令都会明确拒绝，并提示这是 extension UI locale API、应通过扩展开关管理。拒绝发生在执行旧补丁操作之前；这项保护是防误操作，不会把旧安装器转换成新接口的安装器。

`npm test` 使用 `node --test *.test.mjs`，因此会包含 `interface-migration.test.mjs`。该测试用临时目标检查三种命令都会被拦截；它验证的是安装器迁移保护，不是主程序 UI locale 接口的端到端测试。
