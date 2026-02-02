Neuro Frontend

快速启动（开发）:

1. 进入 front 目录
2. 安装依赖：npm install
3. 运行开发服务器：npm run dev

说明:
- 项目使用 Vite + React + TypeScript + TailwindCSS
- API Explorer 会尝试从 /swagger/v1/swagger.json 拉取接口定义，后端启动时应暴露该路径
- 使用 openapi-generator-cli 生成 API 客户端：npm run gen:api

实现说明:
- src/pages/ApiExplorer 提供了一个简单的 swagger.json 浏览器，展示路径/方法/参数/响应
- 请根据项目需要扩展组件库与样式
