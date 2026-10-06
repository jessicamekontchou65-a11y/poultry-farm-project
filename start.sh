#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

WEB_PORT="${WEB_PORT:-3000}"
API_PORT="${PORT:-5000}"
MONGO_PORT="${MONGO_PORT:-27017}"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/.pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
  API_PORT="${PORT:-$API_PORT}"
fi

info() {
  printf "\033[1;32m%s\033[0m\n" "$1"
}

warn() {
  printf "\033[1;33m%s\033[0m\n" "$1"
}

fail() {
  printf "\033[1;31m%s\033[0m\n" "$1" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

port_pids() {
  local port="$1"
  lsof -ti "tcp:$port" 2>/dev/null || true
}

wait_for_port_free() {
  local port="$1"
  local attempt

  for attempt in {1..20}; do
    if [ -z "$(port_pids "$port")" ]; then
      return 0
    fi
    sleep 0.25
  done

  return 1
}

force_close_port() {
  local port="$1"
  local pids

  pids="$(port_pids "$port")"
  if [ -z "$pids" ]; then
    info "Port $port is free."
    return 0
  fi

  warn "Port $port is in use by PID(s): $pids"
  warn "Closing those process(es) so the current PoultryHub app takes precedence."
  kill $pids 2>/dev/null || true

  if ! wait_for_port_free "$port"; then
    warn "Graceful stop did not release port $port; forcing close."
    pids="$(port_pids "$port")"
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  fi

  wait_for_port_free "$port" || fail "Could not release port $port."
}

tcp_check() {
  local host="$1"
  local port="$2"
  node -e "
    const net = require('net');
    const socket = net.createConnection({ host: '$host', port: Number('$port') });
    socket.setTimeout(800);
    socket.on('connect', () => { socket.destroy(); process.exit(0); });
    socket.on('timeout', () => { socket.destroy(); process.exit(1); });
    socket.on('error', () => process.exit(1));
  " >/dev/null 2>&1
}

wait_for_tcp() {
  local host="$1"
  local port="$2"
  local label="$3"
  local attempt

  for attempt in {1..40}; do
    if tcp_check "$host" "$port"; then
      info "$label is reachable on $host:$port."
      return 0
    fi
    sleep 0.5
  done

  return 1
}

start_mongodb_if_needed() {
  if [ -n "${SKIP_DB_CHECK:-}" ]; then
    warn "Skipping MongoDB check because SKIP_DB_CHECK is set."
    return 0
  fi

  if tcp_check "127.0.0.1" "$MONGO_PORT"; then
    info "MongoDB is already reachable on port $MONGO_PORT."
    return 0
  fi

  warn "MongoDB is not reachable on port $MONGO_PORT. Trying to start it."

  if command_exists brew; then
    if brew services list 2>/dev/null | grep -Eq '^mongodb-community(@[0-9.]+)?\s'; then
      local service
      service="$(brew services list | awk '/^mongodb-community(@[0-9.]+)?[[:space:]]/ {print $1; exit}')"
      warn "Starting MongoDB with Homebrew service: $service"
      brew services start "$service" >/dev/null || true
    elif brew services list 2>/dev/null | grep -Eq '^mongo\s'; then
      warn "Starting MongoDB with Homebrew service: mongo"
      brew services start mongo >/dev/null || true
    fi
  fi

  if ! tcp_check "127.0.0.1" "$MONGO_PORT" && command_exists docker; then
    if docker info >/dev/null 2>&1; then
      if docker ps -a --format '{{.Names}}' | grep -qx "poultryhub-mongo"; then
        warn "Starting existing Docker container: poultryhub-mongo"
        docker start poultryhub-mongo >/dev/null || true
      else
        warn "Creating MongoDB Docker container: poultryhub-mongo"
        docker run -d \
          --name poultryhub-mongo \
          -p "$MONGO_PORT:27017" \
          -v poultryhub-mongo-data:/data/db \
          mongo:7 >/dev/null || true
      fi
    else
      warn "Docker is installed but not running."
    fi
  fi

  if ! tcp_check "127.0.0.1" "$MONGO_PORT" && command_exists mongod; then
    warn "Starting local mongod process."
    mkdir -p "$ROOT_DIR/.local/mongodb"
    mongod --dbpath "$ROOT_DIR/.local/mongodb" --port "$MONGO_PORT" \
      >"$LOG_DIR/mongodb.log" 2>&1 &
    echo "$!" > "$PID_DIR/mongodb.pid"
  fi

  wait_for_tcp "127.0.0.1" "$MONGO_PORT" "MongoDB" || fail "MongoDB is required but could not be started. Install/start MongoDB, start Docker, or set SKIP_DB_CHECK=1."
}

ensure_dependencies() {
  if [ ! -d "$ROOT_DIR/node_modules" ]; then
    warn "node_modules missing. Installing dependencies."
    npm install
  fi
}

start_server() {
  local name="$1"
  local port="$2"
  shift 2

  force_close_port "$port"
  info "Starting $name on port $port..."
  "$@" >"$LOG_DIR/$name.log" 2>&1 &
  echo "$!" > "$PID_DIR/$name.pid"
}

info "Preparing PoultryHub..."
ensure_dependencies
start_mongodb_if_needed

start_server "api" "$API_PORT" npm run dev:api
wait_for_tcp "127.0.0.1" "$API_PORT" "PoultryHub API" || {
  warn "API failed to become reachable. Recent API logs:"
  tail -80 "$LOG_DIR/api.log" || true
  exit 1
}

start_server "web" "$WEB_PORT" npm run dev:web -- --hostname 127.0.0.1 --port "$WEB_PORT"
wait_for_tcp "127.0.0.1" "$WEB_PORT" "PoultryHub Web" || {
  warn "Web app failed to become reachable. Recent web logs:"
  tail -80 "$LOG_DIR/web.log" || true
  exit 1
}

info "PoultryHub is running."
printf "  Web: http://127.0.0.1:%s\n" "$WEB_PORT"
printf "  API: http://127.0.0.1:%s/api/health\n" "$API_PORT"
printf "  Logs: %s\n" "$LOG_DIR"
printf "  PIDs: %s\n" "$PID_DIR"
printf "\nPress Ctrl+C here only stops this watcher; server PIDs are stored in .pids.\n"

tail -f "$LOG_DIR/api.log" "$LOG_DIR/web.log"
