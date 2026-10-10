/**
 * Adds Simplified Chinese guidance and localizes common built-in tool descriptions for Pi Pocket.
 * Copy this file to `~/.pi-pocket/extensions/`, then enable it in Menu → Extensions.
 */
import { Type } from "@earendil-works/pi-ai";
import { defineExtension, section, wrapTool } from "@earendil-works/pi-durable";

const LANGUAGE_GUIDE = [
    "默认使用简体中文回答；如果用户明确要求繁体中文或其他语言，则遵从其要求。",
    "面向用户的说明、步骤、总结和错误解释使用自然、准确的中文，表达简洁清晰，适合手机阅读。",
    "保留代码、代码块、命令、API 名称、标识符、文件路径、协议字段和原始日志/报错的原文；需要解释时，在原文之后用中文说明，不要擅自翻译或改写可执行内容。",
    "概述工具输出、子代理结果或英文报错时使用中文，同时保留重要原文、数值和不确定性。",
    "多人会话中，根据消息前的 [from: Name] 识别发言者；不要混淆不同参与者的请求或身份。",
].join("\n");

const TOOL_DESCRIPTIONS = [
    [
        "read",
        "读取文本文件。大文件输出会按行数或字节数截断；需要完整内容时，使用 offset/limit 分段继续读取。",
    ],
    [
        "write",
        "写入文件；文件不存在时会创建，并自动创建父目录；文件已存在时会完整覆盖。",
    ],
    [
        "edit",
        "通过精确文本匹配修改文件。每个 oldText 必须在原文件中唯一，改动区域不能重叠；相邻改动应合并成一个编辑项。",
    ],
    [
        "bash",
        "在当前工作目录执行 Bash 命令，合并返回标准输出和错误输出。结果过长时会截断并保存完整输出；可选设置超时秒数。",
    ],
    [
        "browser",
        "操作用户可实时查看的 Chromium 浏览器：打开网页或本地文件、读取页面快照、点击/输入/滚动、截图、查看控制台或执行页面 JavaScript。",
    ],
    [
        "artifact",
        "发布用户可在 Pi Pocket 中查看的独立 HTML、Markdown 或 SVG 成果。使用稳定的 kebab-case id；更新时可提交完整内容或基于上一版本的精确替换。",
    ],
    [
        "schedule",
        "管理本会话的定时消息：add 添加、list 查看、cancel 取消。支持相对时间和重复时间；定时消息到达时应独立完成任务，并给出简短结果。",
    ],
    [
        "subagent",
        "管理持久化的后台子代理：spawn 启动、send 发送任务、stop 停止、status 查看状态。子代理有独立会话；任务描述应包含完成工作所需的全部上下文。",
    ],
    [
        "subagent_workflow",
        "运行可持久恢复的多步骤子代理工作流。无依赖的步骤会并行执行；after 用于声明前置步骤，最终报告会作为后续消息返回。",
    ],
    [
        "fusion",
        "运行持久化的多方综合：三个独立代理并行提出方案，评审代理比较证据，最后由合并代理生成答案。",
    ],
    [
        "codemode",
        "在受限的 QuickJS 沙箱中运行原始 JavaScript，以批量调用、串联或筛选其他工具结果。代码没有 Node、文件系统、网络或定时器访问；每个工具调用仍经过相同的参数校验与安全钩子。",
    ],
] as const;

const localizeToolDescription = (name: string, description: string) =>
    wrapTool(
        // wrapTool keys by the supplied tool's name; this placeholder is never installed or executed.
        {
            name,
            description: "",
            parameters: Type.Object({}),
            execute: async () => ({}),
        },
        (tool) => ({ ...tool, description }),
    );

export default function createZhCnLocalization() {
    return defineExtension({
        name: "zh-cn-localization",
        sections: [section("zh_cn_language", () => LANGUAGE_GUIDE)],
        wraps: TOOL_DESCRIPTIONS.map(([name, description]) =>
            localizeToolDescription(name, description),
        ),
    });
}
