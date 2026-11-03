# 长卷 LONGSCROLL

**把 Markdown，铺成一张长图。**<br>
**Turn Markdown into a polished long image.**

[在线体验 Live Demo](https://severus24.github.io/longscroll/) · [中文](#中文说明) · [English](#english)

---

## 中文说明

长卷是一款本地优先的 Markdown 长图编辑器，把文档、笔记和 AI 对话排成适合手机阅读与分享的高清长图。

桌面端左侧为实时阅读预览，右侧为 Markdown 编辑区；移动端会自动切换为“预览 / 编辑”双 Tab。

### 功能

- Markdown 实时预览与本地自动保存
- 可拖拽调整左右分栏，自动记住最近宽度
- 导入 `.md`、`.markdown`、`.txt` 文件
- 支持本地图片上传、粘贴和拖放
- 四套阅读主题
- 字号、行高和段距调整
- iPhone 16 Pro 模拟与固定尺寸模式
- PNG / JPEG 导出，宽度固定为 1206 px
- 本地版使用 Playwright 截图，支持长内容分段拼接
- 静态版使用浏览器端导出，无需后端服务
- 桌面端与移动端响应式布局

### 本地启动

```bash
npm install
npx playwright install chromium
npm run dev
```

打开 `http://127.0.0.1:5173`。

macOS 也可以先双击 `install.command`，再双击 `start.command`。启动脚本会自动选择空闲端口，并优先使用本机 Google Chrome。

如需手动指定端口或浏览器：

```bash
LONGSHOT_WEB_PORT=5183 \
LONGSHOT_API_PORT=4175 \
LONGSHOT_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

默认访问 `http://127.0.0.1:4174`。

### GitHub Pages

```bash
npm run deploy
```

该命令会把静态站点发布到 `gh-pages` 分支。

GitHub Pages 无法运行 Node/Playwright 导出服务，因此线上版本会自动使用浏览器端高清长图导出。

### 项目结构

```text
longscroll/
├── doc/                 产品文档 / Product notes
├── public/              静态资源 / Static assets
├── server/              本地导出服务 / Local export server
├── src/                 前端与文章样式 / Frontend and article styles
├── index.html
├── package.json
├── vite.config.js
├── install.command
└── start.command
```

---

## English

Longscroll is a local-first Markdown long-image editor. It turns documents, notes, and AI conversations into polished long images that are easy to read and share on mobile.

The desktop layout places the live reading preview on the left and the Markdown editor on the right. On mobile, it switches to a two-tab “Preview / Editor” layout.

### Features

- Live Markdown preview and local autosave
- Resizable split view with saved width
- Import `.md`, `.markdown`, and `.txt` files
- Upload, paste, and drag local images
- Four reading themes
- Adjustable font size, line height, and paragraph spacing
- iPhone 16 Pro simulation and fixed-width modes
- PNG / JPEG export at 1206 px wide
- Playwright-powered local capture with long-content chunking
- Browser-side export for the static site, with no backend required
- Responsive desktop and mobile layouts

### Run Locally

```bash
npm install
npx playwright install chromium
npm run dev
```

Open `http://127.0.0.1:5173`.

On macOS, you can also run `install.command` and then `start.command`. The launcher selects free ports automatically and prefers an installed Google Chrome.

To specify ports or a browser manually:

```bash
LONGSHOT_WEB_PORT=5183 \
LONGSHOT_API_PORT=4175 \
LONGSHOT_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

Open `http://127.0.0.1:4174` by default.

### GitHub Pages

```bash
npm run deploy
```

This publishes the static site to the `gh-pages` branch.

GitHub Pages cannot run the Node/Playwright export service. The hosted version automatically uses the browser-side high-resolution image exporter instead.

---

## Tech Stack

- Vite
- Markdown-it
- DOMPurify
- Lucide
- Express
- Playwright
- Sharp
- html-to-image
