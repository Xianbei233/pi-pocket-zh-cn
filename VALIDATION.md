# 验证记录

## 0.8.0 — 2026-10-22（本地候选，未发布）

- 框架：官方 `v0.20.0` = `687a81dcc18d5238f748e7a109f8b7e2d75f8eb5`，以普通 merge 并入 PR64；合并提交 `68ae4b18683de6319f7ea4a97963834e7c6fcebe`（父 `5a576cc`、`687a81d`）。12 个冲突文件全部解决，保留上游 0.20 功能与本地 locale 调用点。
- 词典：**1461 固定 / 294 模板**，相对 0.7.0（1424/282）**+37 / +12**，删除 **0**；SHA-256 见 `release-package.test.mjs`。
- 新增 key 覆盖：appearance 字体工具与字号、artifacts 分享（发布、有效期、版本固定、撤销、公开页说明）、会话筛选、消息时间、扩展快捷键、加载更早消息。
- 16 项对照差异的处理：字体预览句子、`Emphasis.` 与代码示例保留英文作为字体样张；其余拆片按实际调用点合并为完整 `t()` key，最终新增 49 个 key（比 16 多出的部分是分享面板和字体工具的完整文案）。`Session tags` 浏览器模块没有 `t()`，列为源码缺口，不硬塞 key。
- 未硬塞的源码缺口清单：`evidence-output/0.8.0/source-gaps.json`。字体样张 3 条；`session-tags` 浏览器模块 14 条（`Add a tag`、`Edit tags`、`Filter by tag`、`Search tags` 等，该模块无 `t()`）；内置标题 `Session tags` 1 条。
- 词典 `npm test`：**28/28**。
- 框架（合并后源码）：`npm run check`、`npm run lint`、`npm run format:check` 通过；完整测试 6 批 **538/538**（120/66/83/95/92/82）。
- 真实 loader：`ui-extension-smoke.mjs` 以 1461/294 通过（默认关闭、启用、禁用回英文）。
- 真实 Chromium：390×844 与 1280×800 的新字体工具、成果查看器与分享面板；`lang=zh-CN`、无横向溢出、无 `{{}}` 残留、无 U+FFFD、无 console error。证据在 `evidence-output/0.8.0-*`。
- 未推送词典、未发布 Release/npm、未部署生产、未合并 PR、未批准 Docs workflow。

## 0.7.0 — 2026-10-22（本地候选，未发布）

- 基线：线上词典 `/home/xianbei233/.pi-pocket/extensions/zh-cn-ui.ts`，SHA-256 `bbd6da939f3e7171b40d6c7ca5045b4392a3445242b82cd0a4ad2d4eca1b5087`，1407/282；生产源码 `pi-pocket-production` HEAD `eae8ccf`（0.19.0）。
- 候选：**1424 固定 / 282 模板**，相对线上 **+17 / 0**，修正 **12** 条值，删除 **0** 条；SHA-256 见 `release-package.test.mjs`。
- 词典 `npm test`：**27/27**（原 22 项 + 4 项术语/动态 key 测试 + 1 项 baseline key 保留测试）。
- 框架全量（把候选临时放入 PR 工作树 `docs/examples/zh-cn-ui.ts`，跑完恢复）：`npm run check`、`npm run lint`、`npm run format:check` 通过；6 批测试 **404/404**，每批独立硬超时。
- 静态审计：生产 `web/**/*.js` 的直接/条件 `t()` **1731** 次，缺 key **0**；另发现字面量扫描看不到的动态 key **17** 条（`t(SLOTS[...].label)`、`t(item.label)`、提供方分组、内置扩展元数据），已补齐。
- 失效条目：生产源码不再引用的旧 key **391** 条（完整列表 `evidence-output/0.7.0-analysis/stale-keys.json`）；按“旧词条不删除”保留。
- 仍显示英文的源码缺口：静态扫描 26 条候选，其中 **20** 条是可见/辅助 UI 文案（如 `worktree`、`Pinned by`、`This extension is off.`、`Dictate`），**6** 条是技术/示例文本；运行时另有内置扩展元数据 **30** 行、OAuth 按钮 **5** 行、`Everywhere` 1 行、时间词 `now` 1 行。词典无法为没有 `t()` 的调用点提供翻译，需要框架补调用。
- 真实渲染：`node evidence-070.mjs <production>` 与 `<pr64>` 均通过；手机 390×844、桌面 1280×800，6 个面板 + 输入框截图，`lang=zh-CN`、无横向溢出、无 `{{}}` 残留、无 U+FFFD；顶层槽位标签与提供方分组已显示中文，控制台无 error。截图与报告在 `evidence-output/0.7.0-*`。
- 真实 loader：`node ui-extension-smoke.mjs <production>` 通过（默认关闭、启用、禁用回英文）。
- 未推送、未发布 Release/npm、未修改生产、未合并 PR64。

## 0.6.0 — 2026-10-21（0.19.0 适配，本地维护分支）

- 上游基线：`TannerMidd/pi-pocket` `main@d2a3280b10c3f51610eacb13cdfa6e1ea4577b5b`（0.19.0）。框架 PR #64 本地合并提交 `5a576cc5d83ab13f32e1f094998ee0cb56d0a17d`（父提交 `b04986d`、`d2a3280`），保留公开历史。
- 词典：**1407 固定 / 282 模板**，SHA-256 `89fbb6c19090169d9c33bff8d14af0cb9b20fb4d6fc254a3a563b7302208adea`。0.5.0 的 1371/274 及更早词条全部保留；新增 36/8。`Installed` 拆分为状态/标签（已安装）与 `Installed at`（安装时间）。
- `npm test`：**22/22**。
- 对框架 `web/**/*.js` 扫描直接与条件 `t()` 固定 key：**1731** 次调用记录，缺键 **0**；这是调用点覆盖，不代表全部界面已汉化。
- 真实 loader（`ui-extension-smoke.mjs`）与真实 Chromium 手机/桌面（`ui-browser-smoke.mjs`）以 1407/282 实包验证启停、英文回退与动态内容保真，均通过。
- 框架树：`npm run check`、`npm run lint`、`npm run format:check` 通过；完整测试 6 批 **404/404**，每批独立硬超时。
- 未推送默认分支，未发 Release/npm，未部署，未修改生产数据或正式扩展。

## 0.5.0 — 2026-10-21（0.18.0 适配，本地维护分支）

- 上游基线：`TannerMidd/pi-pocket` `main@885110867486733196b58915bfae500495133620`（0.18.0）。框架 PR #64 原 head 为 `bf404bb49be86e6ab0120cd6df2d740353369e7b`；本地以 merge 提交 `b04986dcc7e04c11231ce59d3696ef9f25d6d2e4`（父提交 `bf404bb`、`8851108`）重新适配，保留公开历史。
- 词典：**1371 固定 / 274 模板**，SHA-256 `00a5fd8f79d656aecc7ca4274591e829e0ed2e318ecb53724c39db64051a8820`。旧词条逐键核对零丢失：0.4.0 的 1042/203 全部保留；0.15 归档的 1356/273（SHA-256 `7e828b15987fd6562d90d5b92a17239a795f586c0b7c16e0bea08272feb31390`）全部保留；新增 15/1，无旧译文改动。
- `npm test`：**22/22**，覆盖词典结构、模板占位、扩展/覆盖契约键、动态参数原样插入、未知键英文回退、启停以及 legacy 补丁回归。
- 对框架源码 `web/**/*.js` 扫描直接与条件 `t()` 固定 key：**1736** 次调用记录，缺键 **0**。该数字是调用点覆盖，不代表全部界面已汉化。
- `node ui-extension-smoke.mjs <框架合并树>`：真实 loader 默认无语言包 → 启用真实词典（1371/274）→ 禁用恢复英语，通过。
- `node ui-browser-smoke.mjs <框架合并树>`：真实 Chromium 390×844 与 1280×800，已打开菜单/输入框实时启停、不重载文档，用户标题、草稿、模型 ID 原样保留，无横向溢出或 console error，手机与桌面均通过。
- 框架树 `npm run check`、`npm run lint`、`npm run format:check` 通过；完整测试按 6 批运行 **366/366**，每批独立硬超时与日志。
- 未推送默认分支，未发 Release/npm，未部署，未修改生产数据或正式扩展。框架 PR head 的推送因当前 GitHub OAuth 凭据缺少 `workflow` scope 被拒绝，未绕过该限制；详见该会话的交付说明。


## 0.4.0 Release — 2026-10-12

- 包版本从 `0.3.0` 升至 `0.4.0`；远端已核实 `v0.3.0` 为最新既有 release/tag，本次使用新 tag `v0.4.0`，不覆盖历史标签。
- 发布词典 `zh-cn-ui.ts` SHA-256：`25f9be43df500695087c801bc81fed354b4d2d5fc571f787ae06ef18ad994cd9`；**1042 固定 / 203 模板**。与 PR #64 示例包逐键比较：本发行词典在其 930 固定/190 模板之上额外保留本地运行时所需的 **112 固定 / 13 模板**。当前扩围增量清单记录 302 条新增/复核固定键、111 个模板；其中存在旧键修正或重审，最终净增长为 296/111；两者共有键的译文完全一致。
- `timeout 120 node --test *.test.mjs`：新增 release pack 自检后 **22/22**。
- 使用 PR #64 的隔离工作树真实 loader：`node ui-extension-smoke.mjs ../locale-pr` 通过；1042/203 实际加载、默认关闭、启用、模板参数、不匹配英文回退、禁用恢复英文。并在独立兼容框架副本 `../locale-framework` 交叉验证同一包通过。
- 对上述两个兼容隔离框架分别以 390×844 手机、1280×800 桌面运行 `node ui-panels-smoke.mjs <isolated-framework> mobile|desktop`，4 次全部通过。覆盖 14 个面板、启动器、子代理、PiP、固定命令参数、HTML-looking 查询、结构化通知实时启停、无页面 reload/横向溢出/console error；保留草稿、用户标题、模型 ID，未发生模型请求。
- `node audit-ui.mjs ../locale-framework`：**1315** 条直接/条件 `t()` 调用记录、**49** 条动态表达式记录、直接/条件调用缺键 0；审计本身注明零缺键不等于全 UI 翻译。
- 最终依赖审计显示 PR #64 的扩展 loader 每 locale 最大 512 KiB，最大 locale 数 16；完整语言包尺寸远低于该界限。独立 loader 与浏览器测试均使用隔离临时数据，不触碰正式数据。逐项审计日志留在验证环境，不包含在提交或 Release assets 中。
- 兼容前置：PR #64 尚未合并/进入正式发行；仅安装本数据文件不能让原版主程序获得 locale runtime。#41 已关闭并由 #64 替代。未发 npm、未改上游 PR/生产、未测试真实模型、麦克风、Web Push/GitHub watch 或真实压缩后端。

## 中文 UI 扩围 — 2026-10-12（本地候选，未部署）

- 两树与生产源码/旧词典只读基线、真实面板与残余见 `EXPANDED_AUDIT.md`；精确来源见 `locale-expansion.json`。框架范围 `5ef6ca3..e22939a36e87b18fbd9deade61d611e44e5f9849`，source fix `4f7fbce82dff8a20716e4570173f500efebea6d6`。
- 词典 **1042 固定 / 203 模板**，相对 `88f2105` 新增 **296 / 111**，旧键译文不变；运行文件仍为兼容 `uiLocales` 的独立 `zh-cn-ui.ts`。SHA-256：`25f9be43df500695087c801bc81fed354b4d2d5fc571f787ae06ef18ad994cd9`。
- `timeout 60 node --test locale-regression.test.mjs`：**6/6**，包含原 65 项合同以及扩展合同的键/译文、来源证据、参数集合、一次插值、未知键回退与启停。
- `timeout 90 node ui-extension-smoke.mjs ../locale-framework`：真实 loader 通过；默认关闭→启用真实包→完整扩展合同→禁用英文，1042/203。
- `node audit-ui.mjs ../locale-framework`：1315 条直接/条件调用记录，49 条间接表达式，直接/条件调用缺键 **0**。间接表及 raw HTM 人工审计；该计数不是全 UI 覆盖率。
- `timeout 110 node ui-panels-smoke.mjs ../locale-framework mobile` 和 `desktop`：初始扩围版均通过；晚到审计后最终版手机重跑通过，并额外覆盖 slash 参数提示即时中英切换。14 个面板、启动器、子代理看板、PiP、模型空搜索与通知；细项见审计文档。Memory 待审批正文/Webhook 指令与名称保持原样，移除确认取消；未执行真实 watch 或模型调用。
- 框架最终修复后：`timeout 90 npm run check`、改动路径的 `prettier --check`/`eslint`、逐文件 `node --check` 与两树 `git diff --check` 通过。`node --test test/i18n.test.ts test/i18n-notice.test.ts test/i18n-coverage.test.ts test/ui-locales.test.ts` **15/15**；`test/voice.test.ts test/i18n-ui.test.ts` **12/12**（此前针对 locale/听写修改执行）。均有 <=120 秒显式超时。
- 没有执行 legacy 安装器；未修改助手侧扩展、依赖元数据、私有配置、生产、共享栈；未 fetch/build/refresh/部署/重启、全套测试或模型 E2E。正式 E2E 仍由 Owner 验收。
- 检查日志：`/tmp/locale-{contracts,focused,loader,lint,format-check}.log`，`/tmp/locale-panels-{mobile,desktop}.log`，以及晚到审计最终手机运行 `/tmp/locale-late-audit-panels-mobile.log`。初期测试问题与修复记录见审计文档。手工演示实例已停止并清理自身临时数据。

## 未发布覆盖补充 — 2026-10-11，最终隔离验证

- Owner 要求修复已确认的既有覆盖缺口；保留前置词典提交 `d5f0b44`。仅修改本词典仓库的词典、测试和文档。
- `locale-coverage.json` / `coverage-contract.md` 提供 64 个精确固定 key、1 个 PR watch 命名参数模板及建议译文。最终框架提交 `77b1d928935b423524e2f53d077b850979da34ad`（父提交 `a11c0e6c11fc1db53c9221d13ea45268e2d3005e`）逐项接入，隔离工作树干净；独立核对确认 64/64 固定 key 与 1/1 模板存在对应调用点。未修改框架仓库。
- 本词典加入上述 64/1 后为 746 条固定文案、92 条模板。用户正文、动态名称、模型 ID、密钥和原始浏览器错误保持原样；听写只翻译应用自有的固定错误说明。
- 独立 `npm test` **19/19**；词典模块语法检查及 `git diff --check` 通过。新增回归遍历完整合同、启用/禁用与英语回退，并验证参数按原值插入一次（包含 `{{name}}` 等文本不递归处理）。
- `node ui-extension-smoke.mjs /home/xianbei233/.pi-pocket/worktrees/resolve-pi-pocket-41-locale-conflicts-c8099a`：基于最终框架真实 loader、隔离数据目录及 scripted model，通过。验证扩展默认关闭、启用中文包、746 条固定文案与 92 条模板、命名参数、未知 key 英文回退、禁用后恢复英语。
- `node ui-browser-smoke.mjs /home/xianbei233/.pi-pocket/worktrees/resolve-pi-pocket-41-locale-conflicts-c8099a`：最终框架真实 HTTP/Chromium 冒烟在 mobile 与 desktop 均通过。验证 composer 与已打开菜单实时启停中文、不重载文档；用户标题、草稿、模型 ID、会话路径不变；无横向溢出或浏览器 error 日志。
- 框架会话报告其 `check`、lint、format 及 **469/469** 测试通过；该报告不替代本仓库上述 loader/browser 验证。
- 未验证真实设备麦克风权限/收音以及系统级 Web Push；其余本轮批准清单均有显式源码调用。隔离测试关闭实例并清理临时数据。没有修改正式扩展、配置或数据库，没有部署、推送或公开发布；上线由 #15540 统一协调。

## 未发布 — 2026-10-11

### 上游与发布核查

- 开始核查时，远程和本地词典 `main` 均为 `1dd5536`；最新公开 Release 仍为 `v0.3.0`（标签提交 `41ebd57`）。四个发布资产的 GitHub SHA-256 与修改前本地文件一致。
- 最新 Pocket 上游为 `v0.13.0` / `main@6067422`；原版没有 `uiLocales` / `web/i18n.js`，不能只靠词典启用中文。
- PR #41 的准确关联、目标分支、冲突原因和 8 个文件的最小方案见 `UPSTREAM-AUDIT.md`。本轮未解决或修改框架 PR。

### 必要改动与当前验证

- 仅补 0.13 消息输入框三个已有显式翻译调用的固定提示；682 条固定文案、91 条模板。没有扩充 PiP/Memory/webhook 等其他新页面；未提升版本号。
- 修改前独立测试 **17/17**；修改后 `npm test` **18/18**，包括静态/模板参数匹配、新提示启停、缺失词条英文回退，以及未知模板参数保持原文且只插入一次。
- `node --check`：词典、词典回归测试、loader/browser 冒烟脚本通过；`git diff --check` 通过。
- 从本机已存在提交 `b1885b1490b30f839ef82040b434a2a41fe7f4d5` 归档出**独立临时源码副本**。它包含上游 `6067422`，另有本地 locale/压缩功能；不是原版上游，也不是 PR #41 与最新 main 已解决后的结果。没有修改此副本源码或执行框架合并。
- 该副本的 locale 字段契约与 PR #41 相同；`web/i18n.js` 与 PR HEAD 字节一致。验证使用 Node `26.10.0`、Pi Durable `1.1.0`，没有在最低支持 Node 版本上重跑。
- 首次 loader 启动因隔离上游依赖未含集成版所需 `headroom-ai` 而失败；之后按集成版自身锁文件在其临时目录执行 `npm ci --ignore-scripts --no-audit --no-fund`，使用独立临时 npm cache，重跑通过。未使用正式共享依赖或为测试修改其他项目的源码。
- `node ui-extension-smoke.mjs <isolated-integrated-source>`：真实 loader 默认无词典 → 启用 682/91 → 禁用恢复英语通过；固定新词条、未知文案回退、模型名含 `{{name}}` 不递归替换通过。
- `node ui-browser-smoke.mjs <isolated-integrated-source>`：实际词典包、真实 Chromium、390×844 手机与 1280×800 桌面均通过。验证已打开菜单和输入框启停时实时切换、不重载文档，用户标题 `Menu`、混合原文草稿、模型 ID 和会话路由不变，无横向溢出或浏览器 error 日志。听写实际设备权限/收音和 busy queue 的端到端状态未验证；其固定词条已由 runtime/loader 回归验证。
- 原版 `6067422` 的 loader 冒烟明确非零退出并说明缺少 runtime；预检发生在导入宿主和创建测试数据前。这是预期不支持，不计为上游兼容通过。
- 测试使用临时 Pocket 数据、独立 Pi agent/home、scripted model 和独立 Chromium profile；测试完成关闭实例并删除测试数据。审计源码及依赖留在临时目录供复核。

没有执行 Pocket 完整测试或重新验证框架冲突解决，因为本轮未改框架；没有系统级 Web Push/真实听写设备验证。没有正式扩展/配置/数据库改动，没有推送、发布或部署。Owner 随后接受本次改动并授权独立本地提交；提交前再次重跑独立测试 18/18、语法及差异检查、隔离 loader 与手机/桌面浏览器冒烟，结果与上述记录一致。PR #41 的框架冲突交由独立 Pocket 会话处理。

## 0.3.0 — 2026-10-10

### 上游 0.12.1 适配补充

- 通用接口 [PR #41](https://github.com/TannerMidd/pi-pocket/pull/41)，基于 `45685e1`；不含中文词典、模型路由或压缩功能。
- 类型检查、Prettier/ESLint、JS 语法检查通过；运行时/loader/drop-in 定向测试 17/17，真实手机尺寸及桌面浏览器启停测试通过。
- 完整测试两次为 **350/351**，唯一失败是 `pi-sessions.test.ts` 读取长会话的耗时比例测试。未修改上游同一基线完整测试 **336/337**，也在同一项失败；单独重跑该测试文件 **18/18**。未修改性能测试或实现。
- 串行全测尝试因 240 秒命令时限中断，不计为通过。
- 本中文包针对 0.12.1 适配分支的真实 loader 冒烟测试通过；不代表新版全部界面已翻译。
- 发布标签 `v0.3.0` 解压到独立目录后，`npm test` 17/17 通过，无相邻源码目录依赖。

### 发布时的 0.11 验证

- 独立插件仓库回归：`npm test` **17/17 通过**。测试不依赖旁边另一个 Pi Pocket 源码 checkout；运行时兼容测试夹具的来源和许可见 `UPSTREAM-LICENSE`。
- 0.11 兼容工作区以 `TannerMidd/pi-pocket` 的旧 `main` 提交 `d01f763` 为基线（不是最新上游），包含通用数据型 `uiLocales` 接口、显式 UI 翻译接入、loader 验证/冲突/生命周期、测试和文档；未包含虚拟模型路由、上下文压缩或中文词典。`npm run check`、`npm run format:check` 通过，完整 `npm test` **250/250 通过**。
- 隔离浏览器在 390×844 下检查通知设置页；模型未匹配、计划模式、主题、归档及撤销通知均正确。禁用扩展恢复英语，重新启用恢复简体中文；无浏览器 console 错误。
- 在上述隔离 0.11 工作区运行 `node ui-extension-smoke.mjs /path/to/pi-pocket`，真实加载 679 条固定文案、91 条模板，验证默认关闭、启用及禁用恢复英语。
- 当前简体中文词典与已安装 drop-in 同步；动态名称、用户消息、路径、命令、模型/主题标识及原始报错按原文插入。
- 正式工作区的完整回归为 304/304；该工作区另有与本语言功能无关的本地改动，因此此计数不是上游 PR 的测试计数。
- 没有验证系统级 Web Push 的真实设备通知；服务端推送负载和 service worker 不在本次改动范围。

## 0.2.0 — 2026-10-09

- 界面语言包迁移到 Pi Pocket 的数据型 `uiLocales` 扩展接口；关闭语言包恢复英语。
- 保留旧源码补丁安装器为迁移用途，并测试其不会覆盖新接口。

## 0.1.0 — 2026-10-09

- 历史源码补丁原型。当前安装方式是数据目录中的独立 drop-in 扩展，不应运行旧补丁安装/卸载命令。

## 安全边界

- 翻译仅用于网页代码显式传入 `t()` 的固定界面文案；不全局替换 DOM。
- 参数只插入一次；会话标题、成员姓名、用户正文、文件路径、命令、模型/主题名称和原始报错不会自动翻译。
- 界面语言包只通过已认证的 `hello.server.uiLocales` 下发，不修改配置、会话数据库、权限或执行逻辑。
