# 中文 UI 扩围审计（2026-10-12）

## 交付候选

- 框架提交 `20c826e0f622ba6a640be9e500e438e103e7240c`，范围 `5ef6ca3bcdfcac1c5c7cac2152ac667058073ab6..20c826e0f622ba6a640be9e500e438e103e7240c`，提交后 clean。
- 词典运行文件 SHA-256：`18d523347cb37e38ffdfa1e5d3479ef31c00985a8db7d7659b462aad18b47809`；1029 固定 / 202 模板，新增 283/110。
- 并行只读工作流 `locale-surface-audit` 的报告在本次收尾时尚未收到；未计入已审阅/已验证证据。上述审计、改动与检查由主会话完成。后到报告需按此提交重新核对，不能覆盖更新后的状态。

## 身份与边界

- 词典起点 `88f2105961bcf0a2da818ab1ddd42d03f8b52ae2`，分支 `task/locale-dictionary-88f2105`。
- 框架起点 `5ef6ca3bcdfcac1c5c7cac2152ac667058073ab6`，分支 `task/locale-framework-5ef6ca3`。
- 只读检查生产：`deploy/production-unified-2827579@c1e2ae2e31aedcc045a903aad253fc24743eb941`，clean；其 `web/`、`src/server/`、`test/` 与框架起点无差异。生产已安装词典 SHA-256 为 `8a5f0b75baf10bcdcd2775a85702331e6ed2b4b01ed02b7cfaceaf8a042b546b`，与旧词典一致；未修改生产扩展或选择。
- 不查询远端；上述不是“最新上游”。02/07 层重放、共享依赖与独立词典制品由 30625 负责。
- 不修改模型/provider 标识、用户标题/消息/指令/经验、路径、仓库名、命令、密钥、权限或持久化数据。内置 PiP 建议按钮仅翻译显示文字，仍保留原本发送的英文指令。

## 方法与范围

1. 全量列举 `web/**/*.js`；Acorn 扫描 `t()` 的直接字面量、条件分支和间接表达式，核对 strings/templates 分区。
2. 扫描 HTM 固定正文、aria/title/placeholder、模板中的固定片段、通知/确认框与常量表；人工区分程序文案与动态内容。扫描不是完整语义分析，不能用“零未匹配 key”宣称全汉化。
3. 读取 server notice、运行任务描述、活动记录、loader、HTTP 错误和浏览器入口。只为明确应用所有的部分通知添加结构化 `ui.key/params`，不对任意消息做正则或 DOM 替换。
4. 每个新增 datum 的具体来源见 `locale-expansion.json.sourceEvidence`（文件、行号、类型）。间接来源由对应渲染调用翻译；`audit-ui.mjs` 可重新列出调用与未匹配 key。`update-coverage.mjs` 仅在有意修改词典后刷新本树数据和来源证据。

## 分组处理

| 优先级/类别 | 具体调用文件 | 处理 |
| --- | --- | --- |
| P0 菜单/模型/扩展/压缩 | `web/sheets/{menu,model,extensions}.js`, `web/app.js` | 补齐已有 t() 缺键；默认模型及按钮、压缩准备说明、内置扩展标题和摘要；模型空搜索改为完整命名参数模板；模型/provider 值原样 |
| P0 PiP | `web/pip.js` | 欢迎、建议按钮显示、状态、上下文 tooltip/aria、确认、停止与固定失败回退；不翻译报告或模型回复 |
| P0 Memory | `web/sheets/memory.js` | 说明、项目计数、待审批、来源/提案、范围 aria、通知与空态；经验正文及输入原样 |
| P0 Webhook/watch | `web/sheets/hooks.js`, `web/composer.js` | 表单、签名/外部数据风险说明、复制提示、计数、确认模板、PR 状态；不创建真实 watch，不向外部推送；repo/title/secret/raw note 保真 |
| P0 trust | `web/trust.js`, `web/sheets/menu.js` | 信任提示条、状态、技能来源说明、风险提示、暂不处理与确认通知；只翻译显示，不改变决定或 trust store |
| P1 会话/启动器/主页 | `web/{sessions,launcher,home}.js`, `web/sheets/pi-sessions.js` | 会话导航 aria/tooltip、启动器动作、主页摘要、终端会话导入说明/空态；会话正文与文件保持原样 |
| P1 输入与状态 | `web/composer.js`, `web/commands.js`, `web/voice.js` | 掌舵/计划/完成条件/排队/历史/粘贴/固定命令说明、状态栏、听写固定前缀；自定义 prompt/skill 说明不进入 t()，听写原始错误只作为参数 |
| P1 子代理/预览 | `web/{subagents,subagents-board,peeks}.js` | 状态、计数、空态、搜索、审批按钮与 aria；PeekTile 增加 locale revision 属性使 memoized 卡片在启停时重绘 |
| P1 对话/文件/辅助面板 | `web/{transcript,chat,diff,rich,share,browser-panel,ui}.js`, `web/sheets/{branch,folder,message,people,running,viewers}.js`, `web/sheets.js` | 固定片段、确认/占位符/tooltip/aria、版本和计数；修复既有 branch `gone` 字面 `{t(...)}` 漏 `$`；不翻译代码、HTML 制品、用户 Pin 内容或浏览器页面/console |
| P1 服务端通知 | `src/server/{app,commands}.ts`, `web/{store,app}.js` | 保留原 message/日志及权限范围，增加可选 ui 元数据；扩展启停、审批规则、附件/文件发送失败、压缩开始/成功/中止与 PiP 压缩失败。参数不递归翻译，在 Preact 中以文本呈现 |

## 实测与限制

`ui-panels-smoke.mjs` 使用真实 Pocket loader/HTTP/Chromium、临时 Pocket 数据/agent/home 和拒绝任何模型请求的 faux provider；压缩选项使用 helpers 的 no-op 服务，不启动生产代理。每个 viewport 单独 `timeout 110`。

手机 390×844、桌面 1280×800 均实际打开：菜单、扩展、模型/Headroom 压缩选项、Memory、Webhook、trust、快捷键、费用、终端会话列表、Providers、外观、定时消息、指令、新上下文、启动器、子代理看板空态、PiP 欢迎。

- 面板保持打开时启用/禁用词典，无文档重载；页面不横向溢出。
- composer 草稿/用户标题/模型标识不变；Memory 待审批正文与输入、Webhook 名称/指令原样。
- Webhook 移除确认中名称原样，确认被取消，未删除数据；模型搜索 `{{query}} <img>` 按文本呈现，无图片元素或二次模板替换。
- Memory 范围、模型和 PiP aria；结构化服务端通知切换；无元数据的外部错误原样。
- 浏览器面板还目测了手机 Webhook、Memory、trust、PiP，桌面扩展长摘要/压缩入口和模型选择器；目测发现的 `This session`、`System prompt`、`Done when` 缺键已补，并加入断言。

**明确残余，不称绝对全汉化：**

- 登录/邀请服务端 HTML 和启动前 boot 在认证 locale 投递之前，仍使用英文；不为此公开词典或读取私有配置。
- 历史持久化活动文本、工具/模型正文、外部错误/OAuth 提示、网页 console 保持原样。结构化 notice 仅覆盖上表调用，loader reload、goals/spend/watch 其他通知以及多数 HTTP 固定错误尚未迁移。
- `src/server/running.ts` 的动态 task.label、`web/turns.js` 的工具过程汇总、少量拼接/可选分支仍可能英文；本轮未无界扩展协议或重构纯分析模块。
- 未逐态浏览真实运行/重试/审批/子代理报告、真实终端会话导入、满额 Memory、真实 GitHub watch；已补的这些调用用词典模板/静态证据检查，不把它们算浏览器状态覆盖。
- 未测真实模型/付费请求、麦克风权限/收音、Web Push 或真实压缩后端。未跑既有长全套/模型 E2E，未部署/重启/升级/fetch/build/refresh。

## 验证期间遇到的问题

- 只读初扫临时 Node 片段缺括号、若干精确 edit 文本未匹配：无写入副作用；已修正或放弃该次替换。
- branch 既有 `{t("gone")}` 修复中曾短暂生成缺 `}`，立即被 `node --check` 检出并修正；从未在生产使用。
- `ui-panels-smoke` 首轮 selector 未包含 dialog 自身 aria，第二轮打字焦点受面板动画影响，第三轮中文断言与既有词典用语不同；均为测试问题，修正 selector/直接 input 事件/预期文案后通过。日志 `/tmp/locale-panels-{mobile,desktop}.log` 为最终结果。
- 扩展合同曾与已有 `guard: 防护` 译文不一致，已保留原译文；新 key 的来源证据在刷新前被回归正确拒绝，已刷新证据。
