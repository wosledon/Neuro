import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 将 prettier 标记为 external（不打包）
    external: ['prettier', 'prettier/parser-markdown']
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend
      // Backend API paths start with /api
      '/api': {
        target: 'http://localhost:5146',
        changeOrigin: true,
        // Keep the /api prefix when forwarding
      },
      '/swagger': {
        target: 'http://localhost:5146',
        changeOrigin: true,
      },
      // Proxy SignalR requests to backend
      '/hubs': {
        target: 'http://localhost:5146',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // React 生态
          'react-vendor': ['react', 'react-dom', 'react-icons'],
          // SignalR
          'signalr': ['@microsoft/signalr'],
          // Markdown 处理
          'markdown': ['markdown-it'],
          // 代码高亮
          'highlightjs': ['highlight.js'],
          // 代码格式化（使用 CDN，不打包）
          'prettier': ['prettier', 'prettier/parser-markdown'],
          // UI 相关（如果后续使用更多 UI 库）
          'ui': ['@heroicons/react']
        }
      }
    },
    // 压缩配置
    minify: 'esbuild',  // 使用 esbuild 替代 terser
    esbuildOptions: {
      remove: ['console', 'debugger']
    },
    // 输出资产大小限制警告
    chunkSizeWarningLimit: 600
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@microsoft/signalr',
      'markdown-it',
      'highlight.js',
      'prettier',
      'prettier/parser-markdown'
    ]
  }
})
