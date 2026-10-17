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

产品版本使用 `主版本.次版本.补丁版本`，按自上次发布以来的最高改动级别递增；升级主版本或次版本时，右侧版本位归零：

| 改动级别 | 适用范围 | 版本递增示例 |
| --- | --- | --- |
| 三级（PATCH，补丁） | 样式调整与问题修复，包括设置项的文字、布局或失效修复 | `0.3.2 → 0.3.3` |
| 二级（MINOR，次版本） | 新增特性，尤其是设置选项新增，以及默认值、可选范围或行为的主动调整 | `0.3.2 → 0.4.0` |
| 一级（MAJOR，主版本） | 非常大的整体调整、架构重构，或破坏既有设置、主题接口等兼容约定的变化 | `0.3.2 → 1.0.0` |

这套分级同样适用于 `0.x` 阶段，按产品影响而非改动行数判断。选项调整若破坏兼容约定则按一级处理，并记录设置迁移或接口升级方式。普通内部整理、测试和文档变更不单独要求产品升版；开发提交可以积累到同一版本发布。主题与插件分别根据自身改动定级，无需同步升版。产品版本与 Companion API 分开管理，新增可选主题变量仍可使用 API 1。

保持 `package.json`、`manifest.json` 与 `package-lock.json` 根级及 `packages[""].version` 的产品版本一致，并在 `versions.json` 中记录目标版本对应的最低 Obsidian 版本。发布标签与清单版本完全一致，例如 `0.1.0`，不加 `v`。在 Litos-dev 开发库中采用新插件版本时，还需更新父仓库的组合声明与子模块指针，先提交子仓库，再提交父仓库并完成组合检查。

推送版本标签后，发布工作流执行检查与构建，为产物生成 GitHub 构建来源证明，并仅上传 `main.js`、`manifest.json`、`styles.css`。许可证保留在仓库中，完整声明同时嵌入 `main.js`。主题与插件独立维护、独立发布。

下载发布附件后，可通过 `gh attestation verify main.js -R Zerokei/Litos-Companion` 验证来源；`styles.css` 和 `manifest.json` 同样适用。参见 [GitHub 构建来源证明文档](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)。

## 图表依赖

插件使用独立 Mermaid 实例与 `@mermaid-js/layout-elk`，后者引入 ELK.js。自有 `litos-flowchart` 布局包装器不依赖 Codex 安装包。运行时依赖随插件打包，不从 CDN 加载。

布局 helper 和 Obsidian 实时预览适配包含版本敏感接口。升级依赖或宿主后，需要复验布局、开关刷新与清理行为。详情见 [架构与主题接口](architecture.md)。
