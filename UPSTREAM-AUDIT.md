# 上游与 PR 核查 — 2026-10-11

本记录只描述核查时的远程状态，不代表 PR 已解决、接口已随上游发布或词典已发布新版本。

## 已确认基线

- 词典仓库：`Xianbei233/pi-pocket-zh-cn`，本地和远程 `main` 均为 `1dd5536df0ad2b43e384cfb88302dca920ab2ae9`（开始核查时工作区干净）。
- 最新词典 Release：`v0.3.0`，标签提交 `41ebd57682268bc0ca695055bcf78ac87c725c5b`，发布时间 `2026-10-10T05:43:27Z`。四个发布资产的 GitHub SHA-256 均与本地原文件一致；未发布 npm 包。
- 最新 Pocket Release：[`v0.13.0`](https://github.com/TannerMidd/pi-pocket/releases/tag/v0.13.0)，发布时间 `2026-10-10T23:57:46Z`。
- 上游 `main` 和 `v0.13.0` 均为 `6067422bf1cb209872dd84c647036dc07bf06018`，本轮结束前再次查询未改变。
- 对原版源码检查 `uiLocales`、`PocketUiLocale`、`setUiLocales`：无该接口，也无 `web/i18n.js`。原版 0.13.0 不能仅靠安装中文词典获得 UI 翻译。
- 本机 0.13 集成版 `b1885b1490b30f839ef82040b434a2a41fe7f4d5` 包含 `6067422`，但另含本地 locale、压缩等改动；不能称作未经修改的上游，也不能把其能力视作上游正式发布能力。

## PR 关联与状态

README、PR 内容及实际分支均确认本项目的框架前置关联为：

- [TannerMidd/pi-pocket#41](https://github.com/TannerMidd/pi-pocket/pull/41)：`feat(i18n): add opt-in data-only UI locale extensions`。
- 来源：`Xianbei233/pi-pocket:feat/ui-locales`，HEAD `ed2b80825179290a6da1b97687626337251ca315`。
- 目标：`TannerMidd/pi-pocket:main`。
- 状态：OPEN、未合并，GitHub `mergeable=false` / `mergeable_state=dirty`（CLI 为 CONFLICTING / DIRTY）。没有评审或评论。
- GitHub API 的 PR `base.sha` 仍显示旧 `45685e1`；本轮独立查询目标 `main` 得到 `6067422`，没有把旧字段当成最新上游。临时仓库的实际共同祖先也是 `45685e19939354652b7b8a6c226604bb0c2e024f`。
- GitGuardian 成功只是安全检查，不证明现在的合并或完整测试通过。
- 同作者 #37 是已关闭、未合并的 virtual routing PR，与词典不相关；词典仓库没有 PR 或 issue。没有据此创建任务、重复会话或启动 PR watch。

## 可复现冲突与最小方案（待 Owner 协调）

在独立临时裸仓库读取真实 PR ref，执行 `git merge-tree --write-tree main audit-pr41`；返回 1，产生 8 个内容冲突文件、11 个冲突块。该操作只写临时 Git 对象，没有工作分支合并、冲突解决、rebase 或提交。

| 冲突文件 | 原因 | 建议最小解决方式 |
| --- | --- | --- |
| `docs/architecture.md` | 0.13 新增 PiP、外部任务、Memory 章节，与 locale 说明在同一位置插入 | 保留新章节，在扩展架构处补 locale 说明，不能选择旧 PR 整块覆盖 |
| `docs/features.md` | 扩展列表新增 Memory/PiP/Triggers、PiP 压缩设置，与旧扩展说明和 locale 条目重叠 | 保留最新扩展列表及设置说明，再补 locale 条目 |
| `docs/map.md` | 文件职责表新增 PiP/Memory/webhook 等条目，与 locale/hello 职责更新重叠 | 保留最新所有条目，仅增补 locale 类型、loader 与认证 hello 的职责 |
| `web/composer.js` | 听写新增 `dictation.listening` / `Listening…`，PR 修改 busy/idle placeholder 为 `t()` | 保留听写优先级及 steer/queue 分支，把应用拥有的固定提示交给已有 `t()` |
| `web/sheets/extensions.js` | PiP 压缩设置扩展了文件头说明，PR 在文件头加翻译 import | 保留最新说明并加入 `t` import，不回退 PiP 设置 |
| `web/sheets/menu.js` | 3 块：新的 `dotLabel`、Memory 入口、Webhooks and watches 入口，与旧 PR 模板/菜单翻译冲突 | 保留最新路由、条件和辅助函数；保留可变状态标签语义，只翻译应用拥有的固定文案，动态值通过参数原样插入 |
| `web/sheets/message.js` | 新增 Remember 操作，与旧 PR 的 Copy text 翻译重叠 | 保留 Memory 操作及权限判断，同时保留 Copy text 翻译 |
| `web/transcript.js` | 新增 `via` 来源标记，与旧 PR 的 scheduled 翻译改到相邻区域 | 同时保留 `via` 行和 scheduled 翻译；来源名称不递归翻译 |

这些均属于 **Pocket 框架/翻译调用接入冲突，不是词典数据冲突**。`src/server/app.ts`、`host.ts`、`reload.ts` 等文件在这次机械合并中自动合并，但自动合并不等于语义正确，仍需框架项目复核。

推荐经 Owner 确认后，由 Pocket 项目在专用工作区合入最新 `main`，做普通 merge 和针对性解决，保留既有提交，不 rebase、不强推。没有授权时不执行。完成后需检查新版 loader/hello 生命周期、手机/桌面启停、听写及 Memory/webhook 行为、权限和完整回归。0.13 新页面是否增加翻译调用属于另一个范围决定，不能用扩词条替代。

## 词典范围内结果

- PR 与 0.13 集成版的 `PocketUiLocale` 字段契约一致：`locale`、`label`、`default`、`strings`、`templates`；两者 `web/i18n.js` 字节一致。没有发现需要改词典注册结构的差异。
- 精确漏译证据：0.13 上游 `web/composer.js` 的固定提示，及集成版 `web/composer.js` 对这些提示的显式 `t()` 调用。只新增 `Listening…`、`Ask Pi anything…`、`Queue a message for after this run…` 三条，不全面扫描扩充新版页面。
- 未发布工作树为 682 条固定文案、91 条模板；公开 v0.3.0 仍是 679/91，版本号未提升。
- 新增词典回归测试和实际包浏览器冒烟脚本；原版缺少 runtime 时 loader 冒烟脚本在导入宿主、创建测试数据之前明确拒绝。
- 验证结果及边界见 `VALIDATION.md`。本轮没有改 Pocket 源码、正式数据或共享依赖，没有推送、部署或发布。核查阶段未提交；Owner 随后接受词典改动并授权独立本地提交，框架冲突由独立 Pocket 会话处理。本文件保留原核查时间点的 PR 状态，不声称其后续处理结果。
