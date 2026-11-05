# 架构与主题接口

## 边界

`main.ts` 管理生命周期；settings 提供设置和原生设置界面；theme 提供主题识别及解析后的颜色；headings 将设置应用为 CSS 变量；diagrams 管理独立渲染实例；Obsidian 接入、刷新和可恢复的 render 包装集中在 integrations。

模块通过构造参数和方法协作，不建立全局事件总线。核心渲染无文件系统或 Electron 依赖。npm + TypeScript + esbuild 输出 Obsidian 标准发布文件。

## 主题契约（API 1）

主题在 body 上声明 `--litos-companion-api: 1`，标题使用 `text-align: var(--litos-h2-align, right)`。插件仅在该标识存在时切换自身的对齐样式类；覆盖规则位于 styles.css，卸载时移除作用类。设置保存在插件数据中，切换主题不丢失。

`compatibility.json` 声明最低 Litos 1.1.3 和支持的接口版本。插件启动和主题变化时读取已加载 CSS 的 `--litos-theme-version`，通过 Vault adapter 读取当前配置目录下所选主题的 manifest，并检查两者是否一致。版本未知但接口受支持时保留接口兼容；过旧版本、未知接口和未重新加载的旧 CSS 会暂停主题相关功能并在设置中说明原因。每个窗口分别检查，提示按原因去重。不联网查询或下载主题。

图表还支持 `--litos-diagram-node-radius`、`--litos-diagram-label-radius`、`--litos-diagram-line-width`，默认分别为 16px、13px、1px。仅兼容接口可以提供这些变量；旧主题使用默认值，不兼容主题使用 Obsidian 配色与默认形状。变量只接受限定范围内的数值或 px 值，布局适配器与 SVG 样式共享解析结果。

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

Obsidian 1.15 的阅读模式与实时预览通过 Pele 的 `mount` 挂载图表；旧版 Obsidian 使用宿主的 `mermaid.render`。两条路径采用同一条规则：只有显式声明 `config.layout: elk` 的受支持流程图进入 Companion 的串行渲染队列，其余图表使用内置渲染器。

Companion 在首次 ELK 渲染时初始化独立的 Mermaid 11.16.1 实例，使用 `litos-flowchart` 布局适配器运行 ELK。前置配置仅在内存中生成。ELK 渲染失败时使用内置渲染器并提示一次。

ELK 包装器在布局前确定节点与连线标签的真实尺寸，在布局后调整箭头路径。采用锁定的 Mermaid 版本，因为布局 helper 属于版本敏感接口。使用 11.16.1，以避开旧版本已披露的配置与 CSS 注入问题。

Pele 图表走宿主的 SVG 清理路径，宿主会移除 SVG 内的样式表。布局适配器在离屏图表仍连接文档时读取样式计算结果，将需要保留的图形外观写入 SVG 属性，再交由宿主清理；动画边的样式由插件样式表提供。样式变化后重新渲染 ELK 图。包含双链、`click` 交互或数学公式的流程图保留宿主渲染，以支持原生链接与公式。

主题变更、功能开关和窗口变化由主入口协调。切换开关或编辑图表后，显示结果必须与当前设置和源码一致。卸载时释放自己的包装器，保留其他插件后装的包装。

阅读模式使用公开的 `rerender(true)`。实时预览会缓存图表组件，仅调用 `updateOptions()` 不会重新渲染；适配层在结构检查通过后失效 `currentMode.livePreviewPlugin` 和 `editMode.livePreviewPlugin`，再重新配置扩展，不重建编辑器状态。检查 `editMode` 也能刷新当前在阅读模式时保留的实时预览缓存。这些字段属于内部兼容接口，升级 Obsidian 时需复验；未知结构下安全跳过，重新打开视图仍可触发渲染。标题控制不创建动态样式节点，只为各窗口的 body 切换自身的 CSS 类，并在主题变化、窗口关闭及插件卸载时清理。

## 验证

`npm run check` 执行静态检查、Vitest 和构建。单元测试覆盖配置保存、源文本路由、串行队列、失败回退与包装器清理、主题标识与样式清理。真实 Obsidian 验证阅读模式／实时预览、深浅色、多个图表、循环与子图、字体测量、插件启停和弹出窗口。

## 发布

主题与插件独立仓库、独立版本。插件最低版本 1.13.7，首版 desktop only。CI 验证清单一致性和构建；纯数字版本标签触发发布附件。无需运行时下载依赖。
