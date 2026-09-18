# Litos Companion

[Litos](https://github.com/zerokei/Litos) 的配套 Obsidian 插件，提供主题显示控制与 Mermaid 流程图增强。

## 特性

- **标题控制**：调整二级标题的对齐方式，支持阅读模式与实时预览。
- **图表增强**：ELK 自动布局、圆角节点、胶囊标签与开放式箭头。
- **主题适配**：图表配色跟随当前主题，支持深浅色模式与弹出窗口。
- **本地渲染**：沿用 `mermaid` 代码块，依赖随插件分发，无需联网渲染。

## 使用要求

- Obsidian **1.13.7 或更高版本**，仅支持桌面端。
- 标题控制需要提供 **Companion API 1** 的 Litos 主题。
- 图表增强可在其他主题下使用，默认关闭，可在插件设置中开启。

从 [GitHub Releases](https://github.com/Zerokei/Litos-Companion/releases) 下载。安装步骤与功能说明见 [使用指南](docs/usage.md)。

## 依赖

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| Mermaid | 11.16.1 | 图表解析与渲染 |
| @mermaid-js/layout-elk | 0.2.0 | ELK 布局集成 |
| yaml | ^2.9.1 | 图表配置解析 |

开发使用 TypeScript、esbuild 与 Vitest。完整依赖见 [package.json](package.json)。

## 文档

- [使用指南](docs/usage.md)
- [开发指南](docs/development.md)
- [架构与主题接口](docs/architecture.md)
- [示例](examples/验收示例.md)与[验收记录](docs/validation.md)

## 许可证

[MIT](LICENSE)。第三方组件适用各自的许可证，详见 [第三方许可证](docs/third-party-notices.txt)。
