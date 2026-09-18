# Litos Companion

[Litos](https://github.com/zerokei/Litos) 的配套 Obsidian 插件，提供标题控制与 Mermaid ELK 支持。

## 特性

- **标题控制**：调整二级标题的对齐方式，支持阅读模式与实时预览。
- **Mermaid ELK 支持**：为 Mermaid 流程图提供 ELK 自动布局。

## 使用要求

- Obsidian **1.13.7 或更高版本**，仅支持桌面端。
- 标题控制需要提供 **Companion API 1** 的 Litos 主题。
- Mermaid ELK 支持可在其他主题下使用，默认关闭，可在插件设置中开启。

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
