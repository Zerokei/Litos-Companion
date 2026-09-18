# 开发指南

## 环境

使用 Node.js 22 与 npm，依赖版本由 `package-lock.json` 锁定。

```sh
npm ci
npm run dev
```

源代码位于 `src/`，插件样式位于 `styles/plugin.css`。修改样式后需要重新构建。

## 检查与构建

```sh
npm run check
npm run check:release
```

`npm run check` 执行 ESLint、Vitest、TypeScript 严格检查与生产构建。也可单独运行 `npm run build`，生成根目录的 `main.js` 与 `styles.css`。

图表效果与 Obsidian 接入行为需要在实际客户端中验证，参见 [验收记录](validation.md)与[示例笔记](../examples/验收示例.md)。

## 发布

保持 `package.json`、`manifest.json` 和 `versions.json` 的版本信息一致。发布标签与清单版本完全一致，例如 `0.1.0`，不加 `v`。

推送版本标签后，发布工作流执行检查与构建，并上传 `main.js`、`manifest.json`、`styles.css` 及许可证文件。主题与插件独立维护、独立发布。

## 图表依赖

插件使用独立 Mermaid 实例与 `@mermaid-js/layout-elk`，后者引入 ELK.js。自有 `litos-flowchart` 布局包装器不依赖 Codex 安装包。运行时依赖随插件打包，不从 CDN 加载。

布局 helper 和 Obsidian 实时预览适配包含版本敏感接口。升级依赖或宿主后，需要复验布局、开关刷新与清理行为。详情见 [架构与主题接口](architecture.md)。
