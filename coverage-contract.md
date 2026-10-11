# 0.13 已确认漏译 key 交接

完整、机器可读的英文 key / 中文译文及文件位置见 `locale-coverage.json`：64 个固定 key、1 个参数模板。固定文案均取自审查时 `TannerMidd/pi-pocket@6067422` 的用户可见源码；没有假设上游已经支持 `uiLocales`。

## 与框架会话 #25408 的边界

- 本仓库提供词典、清单、回归及隔离验证；不修改 Pocket 框架。
- 框架将这些固定 key 显式传入已有 `t()`。不能整块翻译 DOM、模型回复、用户正文、记忆正文、仓库/会话/成员名称、密钥或任意服务返回错误。
- 清单 `strings` 中的 key 必须逐字匹配，保留大小写、标点和省略号。
- 对表格/常量数组里的标签，应在 UI 渲染时 `t(label)`，不要把翻译用于 API 参数或持久化标识。
- `Project trust` 同时用于 `web/sheets/menu.js` 入口与 `web/trust.js` 标题。
- `Memory` 同时用于 Memory 面板和菜单；`Webhooks and watches` 同时用于面板与菜单。
- `Listening…` 已由前置 `d5f0b44` 覆盖，PiP 输入框与普通输入框可共用。
- 听写 `ERRORS` 表只翻译本程序拥有的六条解释。`event.error` 未匹配时的原值和捕获的 `error.message` 不能递归翻译。
- webhook 的 `Copy secret` 只翻译按钮文字，绝不翻译或改写实际密钥。
- 不翻译产品名 PiP、GitHub 或命令快捷键标识。

## 参数模板

英文：

```text
Watching PR #{{number}}: Pi hears when its checks fail, it has conflicts, or reviewers comment, until it is merged.
```

中文：

```text
正在监视 PR #{{number}}：检查失败、出现冲突或收到评审意见时会通知 Pi，直到该 PR 合并。
```

框架建议调用：

```js
t("Watching PR #{{number}}: Pi hears when its checks fail, it has conflicts, or reviewers comment, until it is merged.", { number })
```

原源码为 `web/commands.js` 的 `Watching PR #${number}: …` 通知。这是已审查的 UI 通知模板化，不包含外部评审正文。

## 范围与待验证项

清单限于此前确认的候选，不代表 PiP、Memory、webhook、trust 整个页面的文案均已本地化。例如欢迎说明、提议正文周围的其他说明、hook 确认框及 trust 状态说明不因补此清单而自动翻译。没有明确新证据时不继续扩词。

当前状态：清单待 #25408 最终源码核对；此文件不宣称覆盖已接入、最终验证通过或可上线。需交接最终框架提交号、源码隔离目录及其验证记录。之后词典会话复核显式调用及接口，运行独立测试、真实 loader 和手机/桌面浏览器验证，保存新本地提交。上线只由 #15540 协调。
