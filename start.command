#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
  echo "长卷尚未安装依赖，请先运行 ./install.command"
  read -p "按回车关闭..."
  exit 1
fi

WEB_PORT="${LONGSHOT_WEB_PORT:-5173}"
API_PORT="${LONGSHOT_API_PORT:-4174}"

port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

if port_in_use "$WEB_PORT"; then
  for candidate in 5183 5184 5185 5186 5187; do
    if ! port_in_use "$candidate"; then
      WEB_PORT="$candidate"
      break
    fi
  done
fi

if port_in_use "$API_PORT"; then
  for candidate in 4175 4176 4177 4178 4179; do
    if ! port_in_use "$candidate"; then
      API_PORT="$candidate"
      break
    fi
  done
fi

if [ -z "${LONGSHOT_CHROMIUM_PATH:-}" ] && [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  export LONGSHOT_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

export LONGSHOT_WEB_PORT="$WEB_PORT"
export LONGSHOT_API_PORT="$API_PORT"

if [ "${LONGSHOT_NO_OPEN:-0}" != "1" ]; then
  (sleep 1.5; open "http://127.0.0.1:${WEB_PORT}") &
fi
npm run dev
