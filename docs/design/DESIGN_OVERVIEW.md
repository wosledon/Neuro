# Neuro 项目 - Web 应用设计总览

## 📋 概述

本设计文档包含 Neuro AI 平台的完整 Web 应用界面设计，涵盖管理后台、文档管理、权限管理、模型管理、用户管理、大模型聊天、RAG 分词等核心功能模块。

所有设计均在 `docs/design/neuro.pen` 文件中实现，采用现代化、清晰的设计语言。

---

## 🎨 设计系统

### 核心色彩体系
- **主色** (#2563EB): 用于主要操作、激活状态
- **背景色** (#F3F6FF): 页面主要背景
- **卡片背景** (#FFFFFF): 内容卡片、表格背景
- **边框色** (#E5E7FF): 分割线、边框
- **文本色** (#0F172A): 主要文本
- **辅助文本** (#64748B): 次要文本、标签

### 字体系统
- **标题** (Outfit): 用于页面标题、卡片标题
- **正文** (Inter): 用于正文文本、UI 标签
- **等宽** (JetBrains Mono): 用于代码、数值

### 布局规范
- **页边距**: 32px
- **卡片边距**: 24px
- **元素间距**: 16-24px
- **圆角**: 8-12px
- **最小宽度**: 1440px

---

## 📱 页面清单

### 1. 管理仪表板 (Admin Dashboard)
**位置**: `bi8Au` | **尺寸**: 1440 × 900

#### 特点:
- 左侧导航栏 (280px) 包含所有主要模块
- 顶部操作栏，包含页面标题和操作按钮
- 主内容区域用于显示关键指标和统计信息
- 导航项目包括: Dashboard, Documents, Permissions, Models, LLM, Users

#### 组成:
```
├── 侧边栏 (Sidebar)
│   ├── Logo 区域
│   └── 导航菜单 (6 个菜单项)
├── 主内容区域
│   ├── 页面标题
│   ├── 操作按钮
│   └── 内容展示区
```

---

### 2. 文档管理 (Document Management)
**位置**: `SPLtO` | **尺寸**: 1440 × 1000

#### 特点:
- 完整的文档列表管理界面
- 搜索功能用于快速查找文档
- 表格显示文档名称、类型、大小、上传时间
- 支持文件上传功能

#### 表格列:
| 列名      | 描述                   |
| --------- | ---------------------- |
| File Name | 文档文件名             |
| Type      | 文件类型 (PDF, DOC 等) |
| Size      | 文件大小               |
| Uploaded  | 上传时间               |
| Actions   | 操作按钮               |

---

### 3. 权限管理 (Permission Management)
**位置**: `O5idB` | **尺寸**: 1440 × 900

#### 特点:
- 显示系统中的所有角色
- 为每个角色展示权限信息
- 支持创建新角色
- 卡片式设计，每个角色一张卡片

#### 角色示例:
- **Administrator**: 完全权限 (Read, Write, Delete, Manage Users)
- **Editor**: 编辑权限 (Read, Write)
- **Viewer**: 仅查看权限 (Read)

---

### 4. 模型管理 (Model Management)
**位置**: `pXq0K` | **尺寸**: 1440 × 900

#### 特点:
- 网格布局展示 AI 模型
- 每个模型卡片包含:
  - 模型名称
  - 激活/停用状态
  - 模型描述
  - 模型类型和规格
- 支持添加新模型

#### 内置模型:
1. **BERT (bert_Opset18)**
   - 类型: Vectorizer
   - 大小: 425 MB
   - 功能: 向量编码

2. **GPT-4 Turbo**
   - 类型: LLM
   - 提供商: OpenAI
   - 功能: 聊天和对话

---

### 5. 用户管理 (User Management)
**位置**: `UXH91` | **尺寸**: 1440 × 900

#### 特点:
- 用户列表表格视图
- 显示用户关键信息:
  - 姓名
  - 邮箱
  - 角色
  - 活跃状态
- 支持增删改查操作

#### 用户状态:
- **Active** (绿色): 激活用户
- **Inactive** (灰色): 非激活用户
- **Pending** (黄色): 待激活用户

---

### 6. AI 聊天主页 (AI Chat Main Page)
**位置**: `ad7t3` | **尺寸**: 1440 × 1000

#### 特点:
- 左侧聊天历史侧栏 (300px)
- 中央聊天区域
- 顶部聊天标题栏
- 底部消息输入框
- 支持创建新聊天

#### 组成:
```
├── 侧栏
│   ├── + New Chat 按钮
│   └── Recent Conversations (聊天历史)
├── 主聊天区域
│   ├── 聊天标题栏
│   ├── 消息显示区
│   └── 输入框
```

#### 消息结构:
- **AI 消息**: 蓝色头像，白色气泡
- **用户消息**: 灰色背景（可扩展）
- 支持多行文本、代码块显示

---

### 7. RAG 分词详情 (RAG Tokenization Detail)
**位置**: `StEI1` | **尺寸**: 1440 × 1000

#### 特点:
- 两栏布局 (左侧: 统计信息，右侧: Chunks 列表)
- 显示分词统计信息:
  - 总 Chunks 数量
  - 分词配置 (Chunk Size, Overlap 等)
- 列表展示所有文本块及其预览

#### 左侧面板:
- **统计卡片**: 显示 Chunks 总数
- **配置卡片**: 显示分词参数
  - Chunk Size: 512 tokens
  - Overlap: 50 tokens

#### 右侧面板:
- **Chunks 列表**
  - 每个 Chunk 显示:
    - Chunk ID
    - Token 数
    - 文本预览

---

### 8. Chunk 详情页 (Chunk Detail Page)
**位置**: `tqsKu` | **尺寸**: 1440 × 900

#### 特点:
- 详细的 Chunk 元数据展示
- 完整的文本内容显示
- 元数据包括:
  - Token 数量
  - 字符数
  - Embedding 状态

#### 页面结构:
```
├── Header (返回按钮 + 标题 + 状态)
├── Metadata Card (统计信息)
└── Text Content Card (完整文本)
```

---

### 9. 聊天小窗 (Chat Mini Window)
**位置**: `qDL9M` | **尺寸**: 400 × 500

#### 特点:
- 浮动式小窗口设计
- 紧凑的聊天界面
- 标题栏包含关闭按钮
- 快速消息输入和发送
- 适用于辅助对话场景

#### 组成:
```
├── Header (标题 + 关闭)
├── 消息区域
└── 输入框 (消息框 + 发送按钮)
```

---

## 🎯 交互设计指南

### 导航栏
- **高亮状态**: 蓝色背景 (#E0E7FF) + 蓝色文本 (#2563EB)
- **默认状态**: 透明背景 + 灰色文本 (#64748B)
- **悬停**: 浅灰色背景

### 按钮设计
- **主按钮** (Primary): 蓝色背景，白色文本
- **次按钮** (Secondary): 白色背景，蓝色边框和文本
- **禁用状态**: 灰色背景，灰色文本

### 表格设计
- **表头**: 浅灰色背景，中等字体
- **行**: 白色背景，交替灰色分割线
- **悬停**: 浅蓝色背景

### 卡片设计
- **边框**: 1px 浅蓝色 (#E5E7FF)
- **圆角**: 12px
- **内边距**: 24px
- **阴影**: 无 (仅使用边框)

---

## 📐 响应式考虑

### 断点
- **Desktop**: 1440px+ (主设计)
- **Tablet**: 768px - 1439px (需调整)
- **Mobile**: < 768px (需单独设计)

### 流动布局
- 侧栏在平板上折叠
- 表格在移动设备上改为卡片视图
- 聊天界面全屏显示

---

## 🔄 数据绑定点

### 动态数据区域
1. **文档列表** - 连接文档 API
2. **用户列表** - 连接用户管理 API
3. **模型列表** - 连接模型服务 API
4. **聊天消息** - 连接 WebSocket 或 SSE
5. **Chunks 列表** - 连接 RAG 服务

### 表单输入
- 搜索框: 文档搜索
- 输入框: 聊天消息输入
- 上传框: 文档上传

---

## 🚀 实现建议

### 前端框架
- **React / Vue 3**: 组件化开发
- **Tailwind CSS**: 样式管理
- **TypeScript**: 类型安全

### 关键组件
1. **Sidebar Navigation** - 可复用导航组件
2. **Data Table** - 通用表格组件
3. **Card** - 卡片容器组件
4. **Chat Window** - 聊天组件
5. **Modal/Dialog** - 对话框组件

### 状态管理
- 使用 Redux/Zustand 管理全局状态
- 聊天状态独立管理
- 用户认证状态

### API 集成
```
├── /api/documents - 文档管理
├── /api/permissions - 权限管理
├── /api/models - 模型管理
├── /api/users - 用户管理
├── /api/chat - 聊天服务
├── /api/rag - RAG 服务
└── /api/chunks - Chunk 管理
```

---

## 🎓 设计令牌参考

### 颜色令牌
```
PRIMARY: #2563EB
BACKGROUND: #F3F6FF
SURFACE: #FFFFFF
BORDER: #E5E7FF
TEXT_PRIMARY: #0F172A
TEXT_SECONDARY: #64748B
SUCCESS: #166534
WARNING: #D97706
ERROR: #DC2626
```

### 间距令牌
```
XS: 4px
SM: 8px
MD: 16px
LG: 24px
XL: 32px
```

### 字体大小
```
H1: 32px
H2: 24px
H3: 20px
H4: 18px
H5: 16px
Body: 14px
Small: 12px
```

---

## 📝 设计文件结构

```
docs/design/
├── neuro.pen                    # 主设计文件
├── DESIGN_OVERVIEW.md           # 本文档
└── README.md                    # 项目说明
```

### Pen 文件中的帧 (Frames)

| 帧名                    | ID    | 描述       |
| ----------------------- | ----- | ---------- |
| Landing Page            | bi8Au | 首页设计   |
| Admin Dashboard         | hceYE | 管理仪表板 |
| Document Management     | SPLtO | 文档管理   |
| Permission Management   | O5idB | 权限管理   |
| Model Management        | pXq0K | 模型管理   |
| User Management         | UXH91 | 用户管理   |
| AI Chat Main Page       | ad7t3 | 聊天主页   |
| RAG Tokenization Detail | StEI1 | 分词详情   |
| Chunk Detail Page       | tqsKu | Chunk 详情 |
| Chat Mini Window        | qDL9M | 聊天小窗   |

---

## 🔗 相关资源

- **设计工具**: Pencil (neuro.pen)
- **原型链接**: [点击查看在线设计](https://neuro.design)
- **品牌指南**: [Neuro 品牌手册](../BRAND.md)
- **组件库**: [Neuro UI Components](../../front/src/components)

---

## 📞 设计反馈

如有设计改进意见，请提出 Issue 或 PR 到 Neuro 仓库。

---

**最后更新**: 2026 年 2 月 3 日  
**设计师**: GitHub Copilot  
**版本**: 1.0.0
