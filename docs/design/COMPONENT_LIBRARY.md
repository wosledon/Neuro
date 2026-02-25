# Neuro UI 组件库清单

## 📚 组件库总览

本文档列出 Neuro 项目所有需要实现的 UI 组件，基于设计系统和页面设计。

---

## 🎨 基础组件

### 1. Button（按钮）
**位置**: `src/components/common/Button.tsx`

```tsx
// 使用示例
<Button variant="primary" size="md">操作</Button>
<Button variant="secondary" disabled>禁用</Button>
<Button variant="danger" size="sm">删除</Button>
```

**属性**:
- `variant`: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean
- `icon`: ReactNode
- `onClick`: () => void

**样式**:
```css
/* Primary Button */
background-color: #2563EB;
color: #FFFFFF;
border-radius: 8px;
padding: 8px 16px;
font-weight: 500;

/* Secondary Button */
background-color: #FFFFFF;
color: #2563EB;
border: 1px solid #E5E7FF;
border-radius: 8px;
```

---

### 2. Input Field（输入框）
**位置**: `src/components/common/Input.tsx`

```tsx
<Input
  placeholder="搜索..."
  value={value}
  onChange={handleChange}
  icon={<Search />}
  error="此字段为必填"
/>
```

**属性**:
- `type`: 'text' | 'email' | 'password' | 'number'
- `placeholder`: string
- `value`: string
- `onChange`: (value: string) => void
- `disabled`: boolean
- `error`: string
- `icon`: ReactNode
- `maxLength`: number

---

### 3. Card（卡片）
**位置**: `src/components/common/Card.tsx`

```tsx
<Card>
  <Card.Header>
    <h3>标题</h3>
  </Card.Header>
  <Card.Body>内容</Card.Body>
  <Card.Footer>
    <Button>操作</Button>
  </Card.Footer>
</Card>
```

**属性**:
- `className`: string
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'highlighted' | 'bordered'

---

### 4. Badge（徽章）
**位置**: `src/components/common/Badge.tsx`

```tsx
<Badge variant="success">激活</Badge>
<Badge variant="warning">处理中</Badge>
<Badge variant="error">错误</Badge>
```

**属性**:
- `variant`: 'success' | 'warning' | 'error' | 'info' | 'default'
- `size`: 'sm' | 'md'
- `icon`: ReactNode

**样式映射**:
| 类型    | 背景色  | 文本色  |
| ------- | ------- | ------- |
| success | #DCFCE7 | #166534 |
| warning | #FEF08A | #92400E |
| error   | #FEE2E2 | #991B1B |

---

### 5. SearchBar（搜索框）
**位置**: `src/components/common/SearchBar.tsx`

```tsx
<SearchBar
  placeholder="搜索文档..."
  onSearch={handleSearch}
  value={searchValue}
/>
```

**属性**:
- `placeholder`: string
- `value`: string
- `onSearch`: (value: string) => void
- `onClear`: () => void
- `debounce`: number (默认 300ms)

---

## 📊 数据展示组件

### 6. Table（表格）
**位置**: `src/components/data/Table.tsx`

```tsx
<Table
  columns={columns}
  data={data}
  onRowClick={handleRowClick}
  pagination={{
    page: 1,
    pageSize: 20,
    total: 100
  }}
/>
```

**属性**:
- `columns`: Column[]
- `data`: any[]
- `loading`: boolean
- `selectable`: boolean
- `sortable`: boolean
- `pagination`: PaginationConfig
- `onRowClick`: (row: any) => void
- `onRowSelect`: (selectedRows: any[]) => void

**Column 接口**:
```typescript
interface Column {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: any) => ReactNode;
}
```

---

### 7. Pagination（分页）
**位置**: `src/components/data/Pagination.tsx`

```tsx
<Pagination
  current={page}
  total={total}
  pageSize={20}
  onChange={handlePageChange}
/>
```

**属性**:
- `current`: number
- `total`: number
- `pageSize`: number
- `onChange`: (page: number) => void
- `showTotal`: boolean

---

### 8. List（列表）
**位置**: `src/components/data/List.tsx`

```tsx
<List
  items={items}
  renderItem={(item) => <ListItem item={item} />}
  onItemClick={handleItemClick}
/>
```

**属性**:
- `items`: any[]
- `renderItem`: (item: any) => ReactNode
- `onItemClick`: (item: any) => void
- `loading`: boolean
- `empty`: ReactNode

---

## 🗂️ 布局组件

### 9. Sidebar（侧栏）
**位置**: `src/components/layout/Sidebar.tsx`

```tsx
<Sidebar>
  <SidebarItem label="Dashboard" icon={DashboardIcon} active />
  <SidebarItem label="Documents" icon={DocumentIcon} />
  <SidebarDivider />
  <SidebarSection title="Settings">
    <SidebarItem label="Preferences" icon={SettingsIcon} />
  </SidebarSection>
</Sidebar>
```

**属性**:
- `width`: number | string (默认 280px)
- `collapsible`: boolean
- `collapsed`: boolean
- `onCollapse`: (collapsed: boolean) => void

---

### 10. Header（页面头部）
**位置**: `src/components/layout/Header.tsx`

```tsx
<Header
  title="文档管理"
  action={<Button>添加</Button>}
  breadcrumbs={[{ label: '首页', path: '/' }, { label: '文档' }]}
/>
```

**属性**:
- `title`: string
- `subtitle`: string
- `action`: ReactNode
- `breadcrumbs`: Breadcrumb[]
- `sticky`: boolean

---

### 11. Modal（模态框）
**位置**: `src/components/layout/Modal.tsx`

```tsx
<Modal
  title="创建新用户"
  open={isOpen}
  onClose={handleClose}
  footer={<Button onClick={handleCreate}>创建</Button>}
>
  <Form>{/* 表单内容 */}</Form>
</Modal>
```

**属性**:
- `open`: boolean
- `title`: string
- `onClose`: () => void
- `width`: number | string
- `footer`: ReactNode
- `closeOnEsc`: boolean
- `closeOnBackdropClick`: boolean

---

## 💬 聊天组件

### 12. ChatWindow（聊天窗口）
**位置**: `src/components/chat/ChatWindow.tsx`

```tsx
<ChatWindow
  conversationId="conv-123"
  onSendMessage={handleSend}
/>
```

**属性**:
- `conversationId`: string
- `messages`: Message[]
- `loading`: boolean
- `onSendMessage`: (message: string) => Promise<void>
- `onLoadMore`: () => Promise<void>
- `footer`: ReactNode

---

### 13. ChatMessage（聊天消息）
**位置**: `src/components/chat/ChatMessage.tsx`

```tsx
<ChatMessage
  role="assistant"
  content="这是一条消息..."
  timestamp={new Date()}
  avatar={avatarUrl}
/>
```

**属性**:
- `role`: 'user' | 'assistant'
- `content`: string
- `timestamp`: Date
- `avatar`: string
- `loading`: boolean
- `error`: boolean

---

### 14. ChatInput（聊天输入）
**位置**: `src/components/chat/ChatInput.tsx`

```tsx
<ChatInput
  onSend={handleSend}
  placeholder="输入消息..."
  loading={isLoading}
/>
```

**属性**:
- `onSend`: (message: string) => void
- `placeholder`: string
- `loading`: boolean
- `disabled`: boolean
- `maxLength`: number

---

### 15. ChatSidebar（聊天历史）
**位置**: `src/components/chat/ChatSidebar.tsx`

```tsx
<ChatSidebar
  conversations={conversations}
  activeConversation={activeId}
  onSelectConversation={handleSelect}
  onNewChat={handleNewChat}
/>
```

**属性**:
- `conversations`: Conversation[]
- `activeConversation`: string
- `onSelectConversation`: (id: string) => void
- `onNewChat`: () => void
- `onDeleteConversation`: (id: string) => void

---

## 🔬 RAG 组件

### 16. TokenizationDetail（分词详情）
**位置**: `src/components/rag/TokenizationDetail.tsx`

```tsx
<TokenizationDetail
  documentId="doc-123"
  chunks={chunks}
  config={ragConfig}
  onChunkClick={handleChunkClick}
/>
```

**属性**:
- `documentId`: string
- `chunks`: Chunk[]
- `config`: RagConfig
- `loading`: boolean
- `onChunkClick`: (chunk: Chunk) => void

---

### 17. ChunkDetail（Chunk 详情）
**位置**: `src/components/rag/ChunkDetail.tsx`

```tsx
<ChunkDetail
  chunk={chunk}
  onBack={handleBack}
  onEdit={handleEdit}
/>
```

**属性**:
- `chunk`: Chunk
- `loading`: boolean
- `onBack`: () => void
- `onEdit`: (chunk: Chunk) => void
- `onDelete`: (chunkId: string) => void

---

### 18. ChunksList（Chunks 列表）
**位置**: `src/components/rag/ChunksList.tsx`

```tsx
<ChunksList
  chunks={chunks}
  onChunkSelect={handleSelect}
  onSearch={handleSearch}
/>
```

**属性**:
- `chunks`: Chunk[]
- `loading`: boolean
- `searchable`: boolean
- `onChunkSelect`: (chunk: Chunk) => void
- `onSearch`: (query: string) => void

---

## 🛠️ 工具组件

### 19. Loading Spinner（加载指示）
**位置**: `src/components/common/LoadingSpinner.tsx`

```tsx
<LoadingSpinner size="md" />
```

**属性**:
- `size`: 'sm' | 'md' | 'lg'
- `color`: string
- `fullscreen`: boolean

---

### 20. Toast Notification（通知）
**位置**: `src/components/common/Toast.tsx`

```tsx
const { toast } = useToast();
toast.success('操作成功！');
toast.error('发生错误');
toast.warning('警告信息');
```

**方法**:
- `success(message: string, duration?: number)`
- `error(message: string, duration?: number)`
- `warning(message: string, duration?: number)`
- `info(message: string, duration?: number)`

---

### 21. Tabs（标签页）
**位置**: `src/components/common/Tabs.tsx`

```tsx
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">标签1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">标签2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">内容1</Tabs.Content>
  <Tabs.Content value="tab2">内容2</Tabs.Content>
</Tabs>
```

**属性**:
- `defaultValue`: string
- `value`: string
- `onValueChange`: (value: string) => void

---

### 22. Dropdown（下拉菜单）
**位置**: `src/components/common/Dropdown.tsx`

```tsx
<Dropdown
  items={[
    { label: '编辑', onClick: handleEdit },
    { label: '删除', onClick: handleDelete },
  ]}
>
  <button>更多操作</button>
</Dropdown>
```

**属性**:
- `items`: MenuItem[]
- `position`: 'top' | 'bottom' | 'left' | 'right'
- `align`: 'start' | 'center' | 'end'

---

### 23. Popover（气泡提示）
**位置**: `src/components/common/Popover.tsx`

```tsx
<Popover content="帮助信息">
  <HelpIcon />
</Popover>
```

**属性**:
- `content`: ReactNode
- `trigger`: 'hover' | 'click'
- `position`: 'top' | 'bottom' | 'left' | 'right'

---

### 24. Dialog（对话框）
**位置**: `src/components/common/Dialog.tsx`

```tsx
<Dialog
  title="确认删除"
  message="此操作无法撤销"
  okText="删除"
  cancelText="取消"
  onConfirm={handleDelete}
/>
```

**属性**:
- `title`: string
- `message`: string
- `okText`: string
- `cancelText`: string
- `onConfirm`: () => void
- `onCancel`: () => void
- `danger`: boolean

---

## 📋 表单组件

### 25. Form（表单容器）
**位置**: `src/components/form/Form.tsx`

```tsx
<Form
  onSubmit={handleSubmit}
  layout="vertical"
>
  <Form.Item label="用户名" required>
    <Input />
  </Form.Item>
  <Form.Item label="密码" required>
    <Input type="password" />
  </Form.Item>
</Form>
```

**属性**:
- `onSubmit`: (data: any) => void
- `layout`: 'vertical' | 'horizontal'
- `validateOnChange`: boolean

---

### 26. FormItem（表单项）
**位置**: `src/components/form/FormItem.tsx`

```tsx
<Form.Item
  name="email"
  label="邮箱"
  required
  rules={[{ type: 'email' }]}
  error="邮箱格式不正确"
>
  <Input />
</Form.Item>
```

**属性**:
- `name`: string
- `label`: string
- `required`: boolean
- `rules`: ValidationRule[]
- `error`: string

---

### 27. Select（选择框）
**位置**: `src/components/form/Select.tsx`

```tsx
<Select
  options={[
    { label: '选项1', value: 'opt1' },
    { label: '选项2', value: 'opt2' },
  ]}
  value={selected}
  onChange={handleChange}
/>
```

**属性**:
- `options`: Option[]
- `value`: string | string[]
- `onChange`: (value: string | string[]) => void
- `multiple`: boolean
- `searchable`: boolean
- `clearable`: boolean

---

### 28. Checkbox（复选框）
**位置**: `src/components/form/Checkbox.tsx`

```tsx
<Checkbox
  label="我同意条款和条件"
  checked={agreed}
  onChange={handleChange}
/>
```

**属性**:
- `label`: string
- `checked`: boolean
- `onChange`: (checked: boolean) => void
- `disabled`: boolean

---

### 29. Radio（单选框）
**位置**: `src/components/form/Radio.tsx`

```tsx
<Radio.Group value={selected} onChange={handleChange}>
  <Radio label="选项1" value="opt1" />
  <Radio label="选项2" value="opt2" />
</Radio.Group>
```

**属性**:
- `value`: string
- `onChange`: (value: string) => void
- `options`: RadioOption[]

---

### 30. Textarea（文本域）
**位置**: `src/components/form/Textarea.tsx`

```tsx
<Textarea
  placeholder="输入详细描述..."
  rows={4}
  maxLength={1000}
/>
```

**属性**:
- `placeholder`: string
- `rows`: number
- `maxLength`: number
- `value`: string
- `onChange`: (value: string) => void
- `resize`: 'both' | 'vertical' | 'horizontal' | 'none'

---

## 🎯 页面级组件

### 31. Dashboard
**位置**: `src/pages/Dashboard.tsx`

包含:
- 统计卡片
- 系统健康指标
- 最近活动

---

### 32. DocumentsPage
**位置**: `src/pages/Documents.tsx`

包含:
- 搜索栏
- 文档列表表格
- 批量操作
- 分页

---

### 33. ChatPage
**位置**: `src/pages/Chat.tsx`

包含:
- 聊天侧栏
- 消息窗口
- 输入框

---

### 34. RAGPage
**位置**: `src/pages/RAG.tsx`

包含:
- 分词统计
- Chunks 列表
- 搜索和过滤

---

## 📐 组件尺寸规范

### 间距 (Spacing)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

### 字体大小 (Font Sizes)
```
xs: 12px
sm: 14px
md: 16px
lg: 18px
xl: 20px
2xl: 24px
```

### 圆角 (Border Radius)
```
sm: 4px
md: 8px
lg: 12px
xl: 16px
full: 9999px
```

---

## 🔄 组件通用属性

大多数组件支持以下通用属性:

```typescript
interface CommonProps {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  success?: boolean;
  warning?: string;
  tooltip?: string;
  ariaLabel?: string;
  testId?: string;
}
```

---

## 📊 组件依赖关系

```
Button
├── Icon
├── Loading Spinner
└── Tooltip

Card
├── Badge
├── Button
└── Divider

Table
├── Checkbox
├── Button
├── Badge
└── Pagination

Form
├── Input
├── Select
├── Checkbox
├── Radio
├── Textarea
└── Form Item

ChatWindow
├── ChatMessage
├── ChatInput
├── Avatar
└── Loading Spinner

Modal
├── Button
├── Card
└── Form

Layout
├── Sidebar
├── Header
└── Main Content Area
```

---

## ✅ 实现优先级

### 第一阶段 (核心)
- [ ] Button
- [ ] Input
- [ ] Card
- [ ] Table
- [ ] Sidebar
- [ ] Header

### 第二阶段 (重要)
- [ ] Modal
- [ ] Form
- [ ] Tabs
- [ ] Badge
- [ ] ChatWindow
- [ ] Pagination

### 第三阶段 (增强)
- [ ] Dropdown
- [ ] Popover
- [ ] Dialog
- [ ] Toast
- [ ] Loading Spinner
- [ ] Advanced Form Controls

---

## 📚 组件文档模板

每个组件应包含:

1. **使用示例** - 基本用法
2. **属性文档** - 所有可用属性
3. **事件处理** - 回调函数
4. **样式** - CSS 类和变量
5. **无障碍** - ARIA 属性
6. **测试** - 单元测试示例

---

**版本**: 1.0.0  
**最后更新**: 2026 年 2 月 3 日
