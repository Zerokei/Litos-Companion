# 开发候选：Pele 与按图选择 ELK

2026 年 11 月 5 日在 macOS 隔离测试库验收，使用的是工作区文件，尚未发布。

- Obsidian 1.15.0：阅读模式与实时预览分别检查浅色和深色。普通流程图使用 Pele，显式声明 `layout: elk` 的流程图使用 Companion 的 ELK。节点、标签、箭头、子图以及自定义节点与连线颜色正常。
- 1.15.0 中编辑图表配置可以切换渲染路径；在阅读模式停用并重新启用插件后，切回实时预览仍能显示 ELK 图。含数学公式的图表使用 Pele，公式正常排版。420px 窄窗口检查了原生图表及缩放控件。
- Obsidian 1.14.5：阅读模式与实时预览分别检查浅色和深色。普通流程图使用宿主内置渲染器，显式声明 ELK 的流程图使用 Companion；节点、箭头和连线标签可见。
- 原有 `update-showcase --preview-only` 在隔离的 Obsidian 1.15.0 测试库完成九个场景和对照页，批次为 `20261105-230617`。截图工具通过临时适配器连接隔离客户端。随后增加的公式回退规则不影响截图示例。
- 发布版本 Litos 1.2.1 与 Companion 0.4.0 在 Obsidian 1.15.0 中复验四种视图；独立设置窗口显示正确的主题兼容状态。
- 开发库的 `npm run check` 通过，父仓库 12 项测试、Companion 85 项测试及静态检查、构建和发布文件检查通过；主题检查有 36 条已有警告。

# 0.1.1 Review fixes

Validated on macOS with Obsidian 1.13.7 on 2026-09-18.

- Obsidian recommended ESLint rules and type-aware checks pass with zero errors and warnings. CI now rejects warnings.
- All 33 tests, TypeScript checks, and production build pass.
- Declarative settings expose both controls to search; valid values persist through the plugin store.
- Heading alignment uses CSS classes. Reading view and Live Preview render the expected alignment.
- SVG decoration uses an inert XML document, with no innerHTML assignment. Mermaid flowcharts retain their classes, namespaces, styles, Chinese labels, pill labels, and open arrows.
- The four example diagrams retain their routing: two enhanced flowcharts, one native sequence diagram, and one native dagre flowchart.
- Existing settings and the minimum Obsidian version remain unchanged.

# 0.1.0 验收记录

验证日期：2026-09-18。环境：macOS、Obsidian 1.13.7。使用临时内存视图与虚构内容；未修改现有笔记，未持久安装测试插件，验收结束后恢复原主题样式并关闭临时视图。

## 自动检查

- `npm ci`：锁文件可重现安装。
- `npm run check`：ESLint、26 项 Vitest 测试、TypeScript 严格检查及生产构建通过。
- `npm run check:release`：插件、包与最低版本记录一致。
- `npm audit`：0 个已知漏洞。固定 Mermaid 11.16.1、ELK 包装器 0.2.0。

## Obsidian 实测

- 阅读模式与实时预览：二级标题左右切换一致；卸载后变量恢复默认 right。
- 实时预览：增强开关可重建已显示的图表，编辑器文本保持不变。
- 深浅色：主题颜色正常，增强 SVG 不再被内置暗色滤镜二次反转。
- 移除兼容主题样式：标题控制暂停、选择保留，增强图仍能使用当前配色。
- 中文、多行、分支、循环、子图、虚线与显式颜色示例渲染成功；时序图和显式 dagre 流程图走原生渲染。
- 实测卡片最小高度 60px、圆角 16px；中文四字标签宽约 56px，卡片宽约 128px；连线胶囊最小高度 26px、圆角 13px。
- 3 个同时提交的流程图全部使用各自文本，无串图。
- 弹出窗口：增强图、标题位置和样式生效；每个文档只有一个标题控制样式节点。
- 多次加载／卸载后，主窗口和弹出窗口的标题控制样式、作用类均为零；包装器回退、后续插件包装和渲染中卸载另有单元测试覆盖。

## 边界与后续复验

- 未重启用户正在使用的 Obsidian；持久化序列与设置恢复由单元测试验证。
- 未验收移动端，清单明确仅支持桌面。
- 实时预览刷新使用 Obsidian 内部扩展缓存字段，升级宿主后须复验。适配层对未知字段结构安全跳过。
- 图形布局 helper 与固定的 Mermaid 版本绑定，升级 Mermaid 时须复验尺寸、连线连接点与显式样式。
- 用户自定义任意 HTML、wiki 链接和 click 交互不属于增强范围；链接／交互图表转交原生渲染。
