# Neuro Web 应用 - 实现指南

## 🎯 快速开始

本指南帮助开发者基于设计文件（`neuro.pen`）实现 React/Vue 前端应用。

---

## 📦 项目结构建议

```
front/src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # 导航侧栏
│   │   ├── Header.tsx           # 页面头部
│   │   └── MainLayout.tsx       # 主布局容器
│   ├── common/
│   │   ├── Button.tsx           # 通用按钮
│   │   ├── Card.tsx             # 卡片组件
│   │   ├── Table.tsx            # 表格组件
│   │   ├── SearchBar.tsx        # 搜索框
│   │   └── Badge.tsx            # 状态徽章
│   ├── chat/
│   │   ├── ChatWindow.tsx       # 主聊天窗口
│   │   ├── ChatMini.tsx         # 小窗口聊天
│   │   ├── ChatMessage.tsx      # 消息组件
│   │   └── ChatInput.tsx        # 输入框
│   ├── rag/
│   │   ├── TokenizationDetail.tsx   # 分词详情
│   │   └── ChunkDetail.tsx          # Chunk 详情
│   └── admin/
│       ├── DocumentManagement.tsx    # 文档管理
│       ├── PermissionManagement.tsx  # 权限管理
│       ├── ModelManagement.tsx       # 模型管理
│       └── UserManagement.tsx        # 用户管理
├── pages/
│   ├── Dashboard.tsx            # 仪表板页面
│   ├── Documents.tsx            # 文档列表页
│   ├── Permissions.tsx          # 权限管理页
│   ├── Models.tsx               # 模型管理页
│   ├── Users.tsx                # 用户管理页
│   ├── Chat.tsx                 # 聊天主页
│   ├── RAG.tsx                  # RAG 分词页
│   └── ChunkDetail.tsx          # Chunk 详情页
├── hooks/
│   ├── useChat.ts              # 聊天逻辑 Hook
│   ├── useDocument.ts          # 文档管理 Hook
│   └── useAuth.ts              # 认证 Hook
├── services/
│   ├── api.ts                  # API 调用
│   ├── chat.service.ts         # 聊天服务
│   ├── document.service.ts     # 文档服务
│   ├── rag.service.ts          # RAG 服务
│   └── user.service.ts         # 用户服务
├── styles/
│   ├── theme.css               # 主题和色彩
│   ├── global.css              # 全局样式
│   └── components.css          # 组件样式
└── App.tsx                      # 应用入口
```

---

## 🎨 样式实现 (Tailwind CSS)

### 基础类名映射

```typescript
// 颜色系统
const colors = {
  primary: '#2563EB',      // bg-blue-600
  background: '#F3F6FF',   // bg-blue-50
  surface: '#FFFFFF',      // bg-white
  border: '#E5E7FF',       // border-blue-200
  textPrimary: '#0F172A',  // text-slate-900
  textSecondary: '#64748B',// text-slate-600
  success: '#166534',      // bg-green-700
};

// 在 Tailwind 中:
// <div className="bg-blue-600 text-slate-900">
// <button className="bg-blue-600 hover:bg-blue-700 text-white">
// <input className="border border-blue-200 rounded-lg">
```

### 常用组件类

```css
/* 按钮 */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg
         hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply px-4 py-2 bg-white text-blue-600 border border-blue-200
         rounded-lg hover:bg-blue-50 transition-colors;
}

/* 卡片 */
.card {
  @apply bg-white rounded-xl border border-blue-200 shadow-none;
}

.card-header {
  @apply px-6 py-4 border-b border-blue-200;
}

.card-body {
  @apply px-6 py-4;
}

/* 输入框 */
.input-field {
  @apply w-full px-4 py-2 border border-blue-200 rounded-lg
         bg-white text-slate-900 placeholder-slate-400
         focus:border-blue-600 focus:outline-none;
}

/* 表格 */
.table-header {
  @apply bg-blue-50 px-6 py-3 text-left text-sm font-semibold
         text-slate-600 border-b border-blue-200;
}

.table-cell {
  @apply px-6 py-4 text-sm text-slate-900 border-b border-blue-100;
}

.table-row-hover {
  @apply hover:bg-blue-50 transition-colors;
}
```

---

## 🔧 关键组件实现

### 1. MainLayout 组件

```tsx
// src/components/layout/MainLayout.tsx
import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showSidebar = true 
}) => {
  return (
    <div className="flex h-screen bg-blue-50">
      {showSidebar && <Sidebar />}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
```

### 2. Sidebar 导航组件

```tsx
// src/components/layout/Sidebar.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Permissions', path: '/permissions', icon: Shield },
  { label: 'Models', path: '/models', icon: Layers },
  { label: 'LLM', path: '/llm', icon: Brain },
  { label: 'Users', path: '/users', icon: Users },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-[280px] bg-white border-r border-blue-200 flex flex-col">
      <div className="px-6 py-8 border-b border-blue-200">
        <h1 className="text-2xl font-semibold text-slate-900">Neuro</h1>
        <p className="text-sm text-slate-600 mt-1">Admin</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-slate-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
};
```

### 3. 数据表格组件

```tsx
// src/components/common/DataTable.tsx
import React from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export const DataTable = React.forwardRef<HTMLTableElement, DataTableProps<any>>(
  ({ columns, data, onRowClick }, ref) => (
    <div className="card overflow-hidden">
      <table ref={ref} className="w-full">
        <thead>
          <tr className="bg-blue-50 border-b border-blue-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="table-header"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="table-row-hover cursor-pointer"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className="table-cell"
                  style={{ width: col.width }}
                >
                  {col.render?.(row[col.key], row) ?? row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
);
```

### 4. 聊天组件

```tsx
// src/components/chat/ChatWindow.tsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    // 添加用户消息
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // 调用 API 获取 AI 响应
    fetchAIResponse(input);
  };

  const fetchAIResponse = async (query: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-blue-50">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                A
              </div>
            )}
            <div
              className={`max-w-md p-4 rounded-lg ${
                msg.role === 'assistant'
                  ? 'bg-white border border-blue-200'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-blue-200 bg-white p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about Neuro..."
            className="input-field flex-1"
          />
          <button
            onClick={handleSend}
            className="btn-primary p-3"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔌 API 集成

### API 端点设计

```typescript
// src/services/api.ts

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  // 文档 API
  documents: {
    list: () => fetch(`${API_BASE}/documents`),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_BASE}/documents/upload`, { method: 'POST', body: formData });
    },
    delete: (id: string) => fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' }),
  },

  // 用户 API
  users: {
    list: () => fetch(`${API_BASE}/users`),
    create: (data: UserCreateRequest) =>
      fetch(`${API_BASE}/users`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<User>) =>
      fetch(`${API_BASE}/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // 聊天 API
  chat: {
    sendMessage: (message: string) =>
      fetch(`${API_BASE}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    history: (conversationId: string) =>
      fetch(`${API_BASE}/chat/${conversationId}/history`),
  },

  // RAG API
  rag: {
    tokenize: (documentId: string) =>
      fetch(`${API_BASE}/rag/tokenize`, {
        method: 'POST',
        body: JSON.stringify({ documentId }),
      }),
    getChunks: (documentId: string) =>
      fetch(`${API_BASE}/rag/documents/${documentId}/chunks`),
    getChunk: (chunkId: string) =>
      fetch(`${API_BASE}/rag/chunks/${chunkId}`),
  },
};
```

---

## 🎭 状态管理建议

### 使用 Zustand 简化状态

```typescript
// src/store/chatStore.ts
import { create } from 'zustand';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  
  setCurrentConversation: (conv: Conversation) => void;
  addMessage: (msg: Message) => void;
  createConversation: (title: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,

  setCurrentConversation: (conv) => {
    set({ currentConversation: conv });
  },

  addMessage: (msg) => {
    set((state) => ({
      messages: [...state.messages, msg],
    }));
  },

  createConversation: async (title) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      const newConv = await response.json();
      set((state) => ({
        conversations: [...state.conversations, newConv],
        currentConversation: newConv,
      }));
    } finally {
      set({ isLoading: false });
    }
  },
}));
```

---

## 📱 响应式设计

### 断点处理

```css
/* Tailwind 断点 */
@media (max-width: 1024px) {
  /* 平板: 隐藏侧栏或改为抽屉 */
  .sidebar {
    @apply hidden md:flex;
  }
}

@media (max-width: 640px) {
  /* 手机: 全屏布局 */
  .sidebar {
    @apply fixed inset-0 z-50;
  }

  .table {
    @apply block;
  }

  .table-row {
    @apply block border-b border-blue-200 mb-4;
  }
}
```

---

## 🧪 测试策略

### 单元测试示例

```typescript
// src/components/common/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('applies primary style by default', () => {
    const { container } = render(<Button>Click</Button>);
    expect(container.querySelector('button')).toHaveClass('bg-blue-600');
  });
});
```

---

## 🚀 性能优化

### 代码拆分

```typescript
// src/pages/index.ts
import { lazy, Suspense } from 'react';

export const Dashboard = lazy(() => import('./Dashboard'));
export const ChatPage = lazy(() => import('./Chat'));
export const DocumentsPage = lazy(() => import('./Documents'));

// 使用
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### 虚拟列表（大数据表格）

```tsx
import { VariableSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={data.length}
  itemSize={(idx) => 56}
>
  {({ index, style }) => (
    <div style={style} className="table-row">
      {/* 行内容 */}
    </div>
  )}
</List>
```

---

## 📋 开发清单

- [ ] 设置项目结构
- [ ] 配置 Tailwind CSS
- [ ] 实现 MainLayout 组件
- [ ] 实现 Sidebar 导航
- [ ] 实现通用 UI 组件（Button, Card, Table 等）
- [ ] 创建路由配置
- [ ] 实现各页面组件
- [ ] 集成 API
- [ ] 实现状态管理
- [ ] 添加认证/授权
- [ ] 测试覆盖
- [ ] 性能优化
- [ ] 响应式测试
- [ ] 部署配置

---

## 🔗 相关资源

- [React 官方文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Lucide React 图标库](https://lucide.dev)
- [Zustand 状态管理](https://github.com/pmndrs/zustand)

---

**版本**: 1.0.0  
**最后更新**: 2026 年 2 月 3 日
