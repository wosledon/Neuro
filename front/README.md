# Neuro Frontend

基于 React + TypeScript + Vite + Tailwind CSS 的现代化前端应用。

## 技术栈

- **框架**: React 18
- **语言**: TypeScript 5
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 3.4
- **图标**: Heroicons
- **组件库**: 自定义组件库

## 快速开始

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── components/          # UI 组件
│   ├── Button.tsx      # 按钮组件
│   ├── Card.tsx        # 卡片组件
│   ├── Input.tsx       # 输入框组件
│   ├── Modal.tsx       # 弹窗组件
│   ├── Table.tsx       # 表格组件
│   ├── Badge.tsx       # 徽章组件
│   ├── Toast.tsx       # 消息提示组件
│   ├── Header.tsx      # 页面头部
│   ├── Avatar.tsx      # 头像组件
│   ├── Skeleton.tsx    # 骨架屏
│   ├── EmptyState.tsx  # 空状态
│   └── LoadingSpinner.tsx # 加载动画
├── pages/              # 页面组件
│   ├── Home.tsx        # 首页（未登录）
│   ├── Login.tsx       # 登录页
│   ├── Dashboard.tsx   # 仪表盘
│   ├── ComponentsPage.tsx # 组件展示
│   ├── NotFound.tsx    # 404页面
│   └── admin/          # 管理后台
│       ├── UserManagement.tsx
│       ├── RoleManagement.tsx
│       ├── TeamManagement.tsx
│       ├── ProjectManagement.tsx
│       └── DocumentManagement.tsx
├── router/             # 路由管理
├── contexts/           # React Context
├── services/           # API 服务
└── styles/             # 样式文件
```

## 主要功能

### 1. 用户认证
- JWT Token 认证
- 登录/登出
- 权限控制

### 2. 管理后台
- 用户管理
- 角色权限管理
- 团队管理
- 项目管理
- 文档管理

### 3. 主题支持
- 亮色/暗色主题切换
- 自动检测系统主题
- 主题状态持久化

### 4. UI 组件库
- 完整的组件系统
- 响应式设计
- 动画效果
- 暗色模式支持

## 设计特点

### 视觉设计
- 现代化渐变色彩
- 玻璃拟态效果
- 柔和阴影
- 圆角设计

### 交互体验
- 流畅的页面过渡动画
- 悬停效果
- 加载状态
- Toast 消息提示

### 响应式
- 移动端适配
- 自适应布局
- 触摸友好的交互

## API 集成

```bash
# 生成 API 客户端（需要后端服务运行）
npm run gen:api
```

## 环境变量

```env
VITE_API_BASE_URL=http://localhost:5146
```

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
