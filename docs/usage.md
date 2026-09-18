# 使用指南

## 安装

需要桌面版 Obsidian **1.13.7+**。

1. 从 [GitHub Releases](https://github.com/Zerokei/Litos-Companion/releases) 下载同一版本的 `main.js`、`styles.css` 和 `manifest.json`。
2. 在 Obsidian 库中创建 `.obsidian/plugins/litos-companion/`，将三个文件放入该目录。
3. 重新加载 Obsidian，在第三方插件设置中启用 Litos Companion。

## 主题显示

在 **设置 → Litos Companion → Litos 显示** 中选择二级标题靠左或靠右，默认靠右。设置同时应用于阅读模式与实时预览。

标题控制需要支持 Companion API 1 的 Litos 主题。旧版 Litos 或其他主题下，选择仍会保存，但暂停应用。插件不会替换已安装的主题文件；更新到提供该接口的 Litos 主题后即可生效。接口定义见 [架构与主题接口](architecture.md)。

## 图表增强

在 **设置 → Litos Companion → 图表增强** 中开启增强。该功能默认关闭。

继续使用普通 `mermaid` 代码块。流程图采用 ELK 自动布局，提供圆角卡片、虚线圆角判断节点、胶囊连线标签和细线开放箭头。显示调整不修改笔记源码。

图表颜色随当前主题变化；切换其他主题后，图表增强仍可使用。示例见 [示例笔记](../examples/验收示例.md)。

## 兼容范围

- 非流程图继续使用 Obsidian 内置渲染。
- 显式指定非 ELK 布局、非 classic 外观、内部链接或 click 交互的流程图交给内置渲染。
- 增强使用 SVG 文字标签，支持普通文本和换行；不承诺任意 HTML 标签。
- 渲染失败时回退到内置 Mermaid；源码本身无效时，仍会显示原始错误。
- 其他替换 Mermaid 渲染器的插件可能产生顺序冲突，不保证共同接管同一流程图。
- 所有依赖在本地运行，无 CDN、遥测或联网渲染服务。

关闭图表增强后恢复内置渲染；禁用插件后，标题恢复主题默认样式。
