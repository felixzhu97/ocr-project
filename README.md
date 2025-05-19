# OCR 项目

一个基于 Next.js 的 OCR(光学字符识别)应用，提供文件上传和图片文字识别功能。

## 测试文件下载

[OCR 简介.pdf](./dataset/OCR简介.pdf)

## 技术栈

- 框架: Next.js 14
- 语言: TypeScript
- 样式: Tailwind CSS
- UI 组件: shadcn/ui
- 构建工具: pnpm

## 功能特性

- 文件上传功能（支持图片/PDF）
- 图片 OCR 识别（支持多语言）
- 响应式设计，适配移动端
- 主题切换支持
- 实时处理进度显示
- 结果导出功能（文本/PDF）

## 核心原理

详细技术实现请参考 [核心原理文档](./docs/core-principles.md)

## API 使用

```javascript
// 基本调用示例
const result = await recognizeImage(imageFile, {
  lang: "chi_sim+eng",
  preserveLayout: true,
});
```

## 开发环境

- Node.js 18+
- pnpm 8+
- Tesseract.js 4+
- PDF.js 3+

## 安装运行

1. 克隆仓库
2. 安装依赖:

```bash
pnpm install
```

3. 运行开发服务器:

```bash
pnpm dev
```

5. 打开浏览器访问 http://localhost:3000

## 项目结构

```
/ocr-project
├── app/                # Next.js应用路由
├── components/          # 公共组件
│   ├── ui/             # UI组件库
├── lib/                # 工具函数
├── public/             # 静态资源
├── styles/             # 全局样式
├── package.json        # 项目配置
└── tsconfig.json       # TypeScript配置
```

## 贡献指南

欢迎提交 Pull Request。请确保:

1. 代码符合现有风格
2. 通过所有测试
3. 更新相关文档

## 许可证

MIT
