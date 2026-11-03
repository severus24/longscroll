# 长卷 LONGSCROLL

长卷是一款本地运行的 Markdown 长图编辑器，把文档、笔记与 AI 对话排成适合手机阅读和分享的高清长图。桌面端左侧预览、右侧编辑；移动端使用“预览 / 编辑”双 Tab。

## 功能

- Markdown 实时预览与本地自动保存
- 左右分栏可拖拽调整，并自动记住上次宽度
- `.md` / `.markdown` / `.txt` 文件导入
- 本地图片上传、粘贴与拖放
- 四套阅读主题、字号、行高和段距调整
- iPhone 16 Pro 与固定尺寸两种导出模式
- Playwright 高清截图、长内容分段拼接
- PNG / JPEG 导出，宽度固定为 1206 px

## 启动

```bash
npm install
npx playwright install chromium
npm run dev
```

浏览器打开 `http://127.0.0.1:5173`。

也可以双击 `install.command` 完成安装，再双击 `start.command` 启动。
启动脚本会自动打开浏览器；默认端口被占用时会自动改用 `5183` / `4175`，并优先使用本机 Google Chrome。

如果默认端口已被占用，可以指定其他端口：

```bash
LONGSHOT_WEB_PORT=5183 LONGSHOT_API_PORT=4175 npm run dev
```

如果已经安装 Google Chrome，也可以直接指定浏览器路径：

```bash
LONGSHOT_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run dev
```

## 构建

```bash
npm run build
npm start
```

构建后访问 `http://127.0.0.1:4174`。

## GitHub Pages

本地构建完成后运行：

```bash
npm run deploy
```

该命令会把静态站点发布到 `gh-pages` 分支。

静态页面无法运行 Node/Playwright 导出服务，因此线上版本会自动使用浏览器端高清长图导出。

## 项目结构

```text
longshot/
├── doc/                 产品文档
├── server/              导出服务
├── src/                 前端与共享文章样式
├── index.html
├── package.json
├── vite.config.js
├── install.command
└── start.command
```

`tmp/` 保留了最初的 ChatGPT demo，仅作为历史版本。
