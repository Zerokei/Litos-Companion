# Litos Companion

[Litos](https://github.com/zerokei/Litos) 的配套 Obsidian 插件：控制主题显示，并增强 Mermaid 流程图。

## 首版功能

- 二级标题靠左／靠右，默认靠右，阅读模式与实时预览同步。
- 可选的 ELK 自动布局、圆角卡片、虚线圆角判断节点、胶囊连线标签和细线开放箭头。
- 沿用普通 `mermaid` 代码块，不修改笔记。非流程图继续使用 Obsidian 内置渲染。
- 图表颜色随当前主题变化。切换其他主题后，标题设置暂停，图表增强继续工作。

图表增强默认关闭，请在 **设置 → Litos Companion → 图表增强** 中开启。

## 安装

需要桌面版 Obsidian **1.13.7+**。将构建生成的 `main.js`、`styles.css` 和 `manifest.json` 放进 Obsidian 库的 `.obsidian/plugins/litos-companion/`，然后在第三方插件设置中启用。

标题控制需要支持 Companion API 1 的 Litos 主题；旧版主题仍可使用，但标题控制暂停。插件不替换或修改已安装的主题文件。使用配套的新版 `theme.css` 后即可启用标题控制。

## 开发

Node.js 22，使用 npm 锁文件固定依赖：

```sh
npm ci
npm run dev
npm run check
```

`npm run build` 生成单文件插件和样式；`styles/plugin.css` 修改后重新构建。发布标签必须与清单版本完全一致，例如 `0.1.0`，不加 `v`。

## 兼容边界

- 首版支持桌面端，尚未声明移动端支持。
- 显式指定非 ELK 布局、非 classic 外观、内部链接或 click 交互的流程图交给内置渲染。
- 增强使用 SVG 文字标签；支持普通文本和换行，不承诺任意 HTML 标签。
- 渲染失败回退到内置 Mermaid。若源码本身无效，仍会显示 Obsidian 的原始错误。
- 同时安装其他替换 Mermaid 渲染器的插件可能产生顺序冲突，不保证共同接管同一流程图。
- Mermaid 在本地运行，无 CDN、遥测或联网渲染服务。

架构和主题接口见 [架构说明](docs/architecture.md)，示例见 [验收示例](examples/验收示例.md)，验证结果见 [验收记录](docs/validation.md)。

## 依赖与许可证

MIT。Mermaid 11.16.1（MIT）、@mermaid-js/layout-elk 0.2.0（MIT）、ELK.js（EPL-2.0）。构建保留依赖的许可证注释，发行版同时附带 [第三方许可证](docs/third-party-notices.txt)。`litos-flowchart` 是本插件自行实现的布局包装器，不依赖 Codex 安装包。
