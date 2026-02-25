# Prettier CDN 配置说明

## 问题
Prettier 库本身大约 613KB（gzip 后 193KB），直接打包会导致主 bundle 过大。

## 解决方案
使用 CDN 方式按需加载 Prettier，避免打包到主 bundle 中。

## 启用 Prettier CDN

在 `index.html` 中添加以下代码：

```html
<!-- Prettier CDN (按需加载) -->
<script src="https://cdn.jsdelivr.net/npm/prettier@3.2.5/standalone.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/prettier@3.2.5/parser-markdown.js" crossorigin="anonymous"></script>
```

## 使用 Prettier

在需要的组件中使用：

```typescript
const loadPrettier = async () => {
  // 确保 CDN 已加载
  if (!window.prettier || !window.prettierMarkdown) {
    await new Promise((resolve, reject) => {
      const script1 = document.createElement('script')
      script1.src = 'https://cdn.jsdelivr.net/npm/prettier@3.2.5/standalone.js'
      script1.onload = resolve
      script1.onerror = reject
      document.head.appendChild(script1)
      
      const script2 = document.createElement('script')
      script2.src = 'https://cdn.jsdelivr.net/npm/prettier@3.2.5/parser-markdown.js'
      script2.onload = resolve
      script2.onerror = reject
      document.head.appendChild(script2)
    })
  }
  
  return { prettier: window.prettier, prettierMarkdown: window.prettierMarkdown }
}

const formatCode = async () => {
  const { prettier, prettierMarkdown } = await loadPrettier()
  const formatted = prettier.format(code, {
    parser: 'markdown',
    plugins: [prettierMarkdown],
    proseWrap: 'preserve',
  })
}
```

## 优化效果

- **未使用 CDN**: prettier chunk 613KB (gzip: 193KB)
- **使用 CDN**: prettier chunk 0KB，不包含在主 bundle 中

## 注意事项

1. CDN 方式需要用户联网才能使用格式化功能
2. 首次使用格式化功能时会有简短的加载时间
3. 建议在页面加载时预先注入 CDN 脚本，而不是用户点击时才加载