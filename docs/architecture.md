# 架构与主题接口

## 边界

`main.ts` 管理生命周期；settings 提供设置和原生设置界面；theme 提供主题识别及解析后的颜色；headings 将设置应用为 CSS 变量；diagrams 管理独立渲染实例；Obsidian 接入、刷新和可恢复的 render 包装集中在 integrations。

模块通过构造参数和方法协作，不建立全局事件总线。核心渲染无文件系统或 Electron 依赖。npm + TypeScript + esbuild 输出 Obsidian 标准发布文件。

## 主题契约（API 1）

主题在 body 上声明 `--litos-companion-api: 1`，标题使用 `text-align: var(--litos-h2-align, right)`。插件仅在该标识存在时注入带自身作用域的覆盖；卸载时移除。设置保存在插件数据中，切换主题不丢失。

图表支持以下可选变量，缺省回退到 Obsidian 变量：

| Litos 变量 | Obsidian 缺省值 |
|---|---|
| `--litos-diagram-surface` | `--background-primary` |
| `--litos-diagram-node` | `--background-secondary` |
| `--litos-diagram-text` | `--text-normal` |
| `--litos-diagram-border` | `--background-modifier-border` |
| `--litos-diagram-line` | `--text-muted` |
| `--litos-diagram-label` | `--background-primary` |

主题现有的 SVG 样式必须限定到普通 Mermaid，排除 `.litos-companion-diagram`。禁止使用全局 `rect` 覆盖。字体使用当前主题的 `--font-text`。浏览器解析颜色为 hex 后再传入 Mermaid。

## 渲染路径

Obsidian 调用宿主 `mermaid.render` → 可恢复包装器 → 路由检查 → 自有串行渲染队列 → Mermaid 11.16.1 → `litos-flowchart` → ELK → SVG 交回 Obsidian。

包内依赖离线分发、首次渲染初始化；不调用宿主 initialize。匹配布局的前置配置仅在内存中生成。显式样式保留；不支持的图表透传；增强失败使用原始 render 重试并提示一次。

ELK 包装器在布局前确定节点与连线标签的真实尺寸，在布局后调整箭头路径。采用锁定的 Mermaid 版本，因为布局 helper 属于版本敏感接口。使用 11.16.1，以避开旧版本已披露的配置与 CSS 注入问题。

主题变更、功能开关和窗口变化由主入口协调。失效的异步结果不会返回增强图；卸载后旧包装器透传，且仅在仍拥有宿主 render 属性时恢复它，避免覆盖其他插件后续安装的包装。

阅读模式使用公开的 `rerender(true)`。Obsidian 1.13.7 的实时预览会缓存图表组件，仅调用 `updateOptions()` 不会重新渲染；适配层在结构检查通过后失效 `currentMode.livePreviewPlugin`，再重新配置扩展，不重建编辑器状态。此字段属于内部兼容接口，升级 Obsidian 时需复验；未知结构下安全跳过，重新打开视图仍可触发渲染。每个窗口的标题样式放在 body 中，避免 Obsidian 自动镜像 head 样式造成重复；兼容已有副本并统一清理。

## 验证

`npm run check` 执行静态检查、Vitest 和构建。单元测试覆盖配置保存、源文本路由、串行队列、失败回退与包装器清理、主题标识与样式清理。真实 Obsidian 验证阅读模式／实时预览、深浅色、多个图表、循环与子图、字体测量、插件启停和弹出窗口。

## 发布

主题与插件独立仓库、独立版本。插件最低版本 1.13.7，首版 desktop only。CI 验证清单一致性和构建；纯数字版本标签触发发布附件。无需运行时下载依赖。
