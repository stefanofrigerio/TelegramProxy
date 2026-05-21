#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Missing .env file. Copy .env.example and fill in the values."
  exit 1
fi

set -a
source "$SCRIPT_DIR/.env"
set +a

PORT="${PORT:-9090}"

node "$SCRIPT_DIR/src/local-proxy.js" &
PROXY_PID=$!

sleep 1

if ! kill -0 "$PROXY_PID" 2>/dev/null; then
  echo "Local proxy failed to start"
  exit 1
fi

echo "Proxy running on 127.0.0.1:$PORT (pid $PROXY_PID)"
echo "Launching Claude Desktop..."

/Applications/Claude.app/Contents/MacOS/Claude --proxy-server="http://127.0.0.1:$PORT"

kill "$PROXY_PID" 2>/dev/null
echo "Done."
