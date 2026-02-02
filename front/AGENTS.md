# Frontend AI Agents Guide — Neuro Frontend

目的：约束前端 AI 助手行为、规范前端实现与协作流程，确保项目使用一致的技术栈与最佳实践。

技术栈要求
- 框架：React（函数组件 + hooks）
- 构建工具：Vite（推荐使用 pnpm + vite）
- 语言：TypeScript
- 样式：Tailwind CSS（JIT 模式），并在需要时使用 classnames 或 clsx 管理条件 class
- 状态管理：优先使用 React Context + hooks；在复杂场景使用 Zustand 或 Redux Toolkit（需说明理由）

代码结构与组件化
- 采用扁平化/模块化目录结构：
  - src/
    - components/  — 可复用 UI 组件（原子级别）
    - layouts/     — 页面布局组件
    - pages/       — 路由页面
    - hooks/       — 自定义 hooks
    - services/    — 与后端通信的 API 封装（基于 swagger.json 生成的客户端）
    - utils/       — 工具函数
    - styles/      — Tailwind 配置与全局样式
- 所有 UI 必须组件化，可复用；禁止在页面中写大量内联样式或内联 HTML
- 每个组件必须包含：
  - TypeScript 类型声明（props）
  - 单元测试（Vitest + React Testing Library）或至少 Storybook 展示
  - Storybook stories 或一个统一的组件参考页

组件库与样式约定
- 使用 Tailwind 原子类定义样式，禁用过度嵌套的 CSS 文件
- 提供一套设计 tokens（colors, spacing, fontSizes）放在 styles/tokens.ts
- 组件接受 className 以便组合样式，内部使用 clsx 合并
- 所有交互（按钮、输入、列表）都要考虑可访问性（aria-*）和键盘操作
- 颜色与主题：支持暗色模式（利用 Tailwind 的 dark 模式）并确保对比度满足 WCAG AA
- 视觉风格：使用圆角卡片（rounded-2xl）作为主要容器，卡片内使用柔和阴影（shadow-lg）和渐变强调色（accent: from-sky-400 to-indigo-500）形成统一酷炫风格。
- 图标库：统一使用 Heroicons（@heroicons/react），在 package.json 中添加依赖并在组件中使用（例如 ThemeToggle 使用 Sun/Moon 图标）。页面组件应尽量复用 .card 类和 .accent 工具类。
- 动画与交互动效：统一使用 Tailwind 的过渡/变换工具与少量自定义 CSS 动画，风格上追求流畅与低调的动效以提升高级感。建议规范：
  - 页面切换：使用淡入/向上滑动过渡（transition-opacity + transform），时长 300ms
  - 按钮：点击时使用 scale(0.95) 的按压动效，hover 时轻微提升（-translate-y-0.5）
  - 主题切换：图标添加旋转/缩放过渡，并以 300-400ms 的时长完成
  - 卡片：hover 时提升阴影（shadow-lg -> shadow-2xl）并轻微上移（-translate-y-1）并使用 subtle glow（暗色模式下降低亮度）
  - 动效禁用：支持 prefers-reduced-motion，若检测到应关闭或简化动画
  - 性能：只对合成图层进行动画，避免触发布局回流（使用 transform 和 opacity 优先）
  - 交互反馈：关键操作（导出文档、同步知识库）需要 toast/通知与加载状态展示


统一组件参考页（Component Playground）
- 必须存在一个由 Storybook 或自建页面组成的组件参考页（路径建议：/src/pages/components 或 .storybook）
- 参考页要求：
  - 展示每个组件的不同变体（size、color、state）
  - 展示组件的交互示例（loading、disabled、error）
  - 提供组件 API（props）说明与示例代码复制功能
  - 支持在页面中直接修改 props 并即时预览（Knobs/Controls）
- 推荐使用 Storybook，如果不使用 Storybook，必须提供等价的静态页面，能够通过浏览器查看组件文档与示例

API 与后端交互
- API schema 管理：后端提供 swagger.json 作为单一真实来源（source of truth）
- 使用 openapi-generator 或 swagger-codegen 在前端自动生成 TypeScript 客户端（生成路径：src/services/api），并把生成脚本加入 package.json（例如 npm run gen:api）
- 生成客户端后，手写一层服务封装（src/services/*）用于处理错误、重试、分页与鉴权
- 前端严格使用生成的接口类型，不允许在组件中手写 any 类型来绕过类型检查
- 所有网络请求必须通过封装的 fetch/axios 实例，以便统一处理 token、请求拦截与响应拦截
- API 文档：将 swagger.json（openapi）放在 front/public 或项目根并作为生成与版本来源，同时在 CI 中加入自动校验脚本以防 swagger 与后端不一致。开发时 swagger 文档地址: http://localhost:5146/openapi/v1.json

AI Agent 行为约束（用于在前端集成 AI 助手时）
- 目标导向：AI 助手应以帮助用户完成任务为目标（例如：生成文档、搜索知识点、生成代码片段），并在必要时向用户确认关键假设
- 不更改代码：AI 助手不能直接在没有用户确认的情况下提交或推送代码变更
- 提供可解释输出：AI 助手在生成代码或建议时必须说明其假设、引用的文件/行或相关 API（如果从知识库检索到内容，必须返回来源）
- 安全与隐私：禁止在前端 AI 助手中泄露仓库敏感信息、密钥或凭证；对用户输入敏感信息时要求明确提示并采取遮蔽或不记录策略
- 交互策略：
  - 首选短消息与分步建议，遇到复杂任务时分步骤征询确认
  - 当不确定时，返回不确定或建议人工审查而非给出错误的确定性答案
- 速查与检索：AI 在从知识库或代码库检索片段时，应返回片段的上下文（文件路径、行数、摘要）并尽量以代码块形式呈现
- 禁止自动泄露：AI 不应自动将本地文件内容或用户输入发送到外部未授权第三方服务
- 审计日志：AI 的关键操作（如触发生成、导出、提交 PR 的意向）应记录审计事件（可选发到后端审计端点）

生成文档的规则（AI 生成项目文档）
- 数据来源优先级：
  1. swagger.json（接口定义）
  2. 代码注释（公共 API 的 XML 注释、JSDoc）
  3. README 和项目文档
  4. 知识库条目（向量检索结果）
- 输出格式：默认生成 Markdown 文件，可选生成 HTML 或本地可浏览的文档站点（例如使用 VitePress）
- 模板与风格：提供一套文档模板（目录、概述、安装、用例、API 解释、示例代码、FAQ），AI 应填充相应部分并在必要时生成示例请求/响应
- 版本与变更：生成的文档应包含生成日期与所依据的 API 版本（例如 swagger.json 的 version 字段），并能生成变更摘要（列出新增/删除/更改的端点）
- Swagger 驱动文档：优先使用 swagger.json 自动生成接口文档段落，并将示例请求/response 格式化后插入最终文档

代码审查与自动化
- AI 生成的 PR 必须包含清晰的变更描述、影响范围与回归测试（如果适用）
- CI 要求：所有前端變更必须通过 lint（prettier + eslint）和单元测试（若涉及业务逻辑）
- 生成代码片段时遵循项目风格（TypeScript strict 模式，使用 Promise/async-await）
- PR 审核：AI 可生成 PR 草稿，但必须有人工审核者确认后才能合并

开发与运行脚本建议（package.json）
- scripts:
  - dev: vite
  - build: vite build
  - preview: vite preview
  - test: vitest
  - lint: eslint . --ext .ts,.tsx
  - format: prettier --write .
  - gen:api: openapi-generator-cli generate -i ./swagger.json -g typescript-axios -o ./src/services/api
  - storybook: start-storybook -p 6006
  - build-storybook: build-storybook

质量与可维护性规范
- TypeScript 使用 strict 模式
- 组件小而可组合，每个组件文件应控制在 200 行以内（含样式）
- 提交信息使用 Conventional Commits 规范
- 使用 pull request 模板，包含变更摘要、截图/演示步骤、回归测试说明
- 可访问性（a11y）：每次 UI 交互变更应至少运行一次基本 a11y 检查（axe-core）

补充建议
- 使用 Storybook + Chromatic 做视觉回归与组件展示
- 引入 Husky + lint-staged 做 pre-commit 检查
- 提供一个自动化脚本用于从 swagger.json 生成 API 文档并推送到 docs 目录
- 在 CI 中加入 swagger.json 与生成客户端的一致性检查脚本

例外与本地约定
- 对于快速原型允许放宽部分规范（例如可跳过 story 或测试），但必须在 PR 描述中说明并计划后续补齐

资产与 Logo 指南
- 位置：所有静态资产放在 front/public/assets/ 下，例如 logo.svg、favicon.png
- Logo 文件：建议提供 SVG 和 PNG 两种格式，SVG 用于页面与 Storybook，PNG 用于其他平台兼容
- Logo 样式：保持简洁、扁平（无渐变或复杂阴影），优先使用单色或双色色块，保证在 32x32、64x64、120x120 下清晰
- 命名与版本：使用 assets/logo.svg 与 assets/logo@2x.png 命名规范，若更新 logo，请在 AGENTS.md 中记录版本与设计说明
- 使用：页面头部、Storybook、文档站点使用同一套 logo，具体路径 public/assets/logo.svg

后续：该 logo 已放置为示例（front/public/assets/logo.svg），后续视觉稿可以替换该文件以更新产品形象

-- EOF
