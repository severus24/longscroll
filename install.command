#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "正在安装长卷 LONGSCROLL 依赖..."
npm install
if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  echo "检测到 Google Chrome，将直接使用本机浏览器完成导出。"
else
  echo "正在安装 Playwright Chromium..."
  npx playwright install chromium
fi
echo "安装完成。运行 ./start.command 启动长卷 LONGSCROLL。"
