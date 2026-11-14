#!/usr/bin/env bash
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${BACKEND_DIR:-$(cd "$FRONTEND_DIR/.." && pwd)/backend}"
DATA_DIR="${DATA_DIR:-$(cd "$FRONTEND_DIR/.." && pwd)/data}"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

FORCE_PREPARE=false
SETUP_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --prepare)
      FORCE_PREPARE=true
      ;;
    --setup-only)
      SETUP_ONLY=true
      ;;
    -h|--help)
      cat <<'EOF'
Usage: ./run-all.sh [OPTIONS]

Bootstrap and run the PSI-Lens backend (FastAPI) and frontend (Vite) together.

Options:
  --prepare      Force regenerating curated datasets via data_prep.prepare
  --setup-only   Install dependencies and prepare datasets, then exit
  -h, --help     Show this help message

Environment overrides:
  BACKEND_DIR      Path to backend repo   (default: ../backend)
  DATA_DIR         Path to raw NASA data  (default: ../data)
  BACKEND_HOST     FastAPI bind host      (default: 127.0.0.1)
  BACKEND_PORT     FastAPI bind port      (default: 8001)
  FRONTEND_HOST    Vite bind host         (default: 127.0.0.1)
  FRONTEND_PORT    Vite bind port         (default: 5173)
  PSI_AI_MODE      demo | live            (default: live if provider, model & API key are set, else demo)
  PSI_AI_PROVIDER  anthropic | openrouter (required by backend in live AI mode)
  PSI_AI_MODEL     Model ID for provider  (required by backend in live AI mode)
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Run ./run-all.sh --help for usage." >&2
      exit 1
      ;;
  esac
done

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: backend directory not found at: $BACKEND_DIR" >&2
  echo "Clone the backend repository alongside frontend or set BACKEND_DIR=/path/to/backend." >&2
  exit 1
fi

echo "==> Checking Python environment in $BACKEND_DIR"
UV_BIN="$(command -v uv || true)"
if [ -z "$UV_BIN" ] && [ -x "${HOME:-}/.local/bin/uv" ]; then
  UV_BIN="${HOME}/.local/bin/uv"
fi

if [ -n "$UV_BIN" ]; then
  if [ ! -x "$BACKEND_DIR/.venv/bin/python" ]; then
    (cd "$BACKEND_DIR" && "$UV_BIN" venv .venv)
  fi
  (cd "$BACKEND_DIR" && "$UV_BIN" pip install --python .venv/bin/python -r requirements.txt openpyxl)
else
  if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: python3 (or uv) is required to set up the backend." >&2
    exit 1
  fi
  if [ ! -x "$BACKEND_DIR/.venv/bin/python" ]; then
    (cd "$BACKEND_DIR" && python3 -m venv .venv)
  fi
  (cd "$BACKEND_DIR" && .venv/bin/pip install -r requirements.txt openpyxl)
fi

CALLER_PSI_AI_MODE="${PSI_AI_MODE:-}"
CALLER_PSI_AI_PROVIDER="${PSI_AI_PROVIDER:-}"
CALLER_PSI_AI_MODEL="${PSI_AI_MODEL:-}"

if [ -f "$BACKEND_DIR/.env" ]; then
  echo "==> Loading environment variables from $BACKEND_DIR/.env"
  set -a
  # shellcheck disable=SC1091
  . "$BACKEND_DIR/.env"
  set +a
fi

[ -n "$CALLER_PSI_AI_MODE" ] && PSI_AI_MODE="$CALLER_PSI_AI_MODE"
[ -n "$CALLER_PSI_AI_PROVIDER" ] && PSI_AI_PROVIDER="$CALLER_PSI_AI_PROVIDER"
[ -n "$CALLER_PSI_AI_MODEL" ] && PSI_AI_MODEL="$CALLER_PSI_AI_MODEL"

PARQUET_DIR="$BACKEND_DIR/data/curated/parquet"
if [ "$FORCE_PREPARE" = "true" ] \
  || [ ! -f "$BACKEND_DIR/data/curated/catalogue.parquet" ] \
  || [ ! -d "$PARQUET_DIR" ] \
  || [ -z "$(ls -A "$PARQUET_DIR" 2>/dev/null)" ]; then
  if [ ! -d "$DATA_DIR" ]; then
    echo "Error: raw data directory not found at: $DATA_DIR" >&2
    echo "Place NASA PSI datasets in ../data or set DATA_DIR=/path/to/data." >&2
    exit 1
  fi
  echo "==> Preparing curated NASA datasets from $DATA_DIR"
  (cd "$BACKEND_DIR" && .venv/bin/python -m data_prep.prepare --data-dir "$DATA_DIR")
else
  echo "==> Curated Parquet data already present at $BACKEND_DIR/data/curated (pass --prepare to rebuild)"
fi

echo "==> Checking frontend dependencies in $FRONTEND_DIR"
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm (Node.js) is required to run the frontend." >&2
  exit 1
fi
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  (cd "$FRONTEND_DIR" && npm install)
else
  echo "==> Frontend node_modules already present"
fi

if [ "$SETUP_ONLY" = "true" ]; then
  echo "==> Setup complete (--setup-only)."
  exit 0
fi

has_live_ai_config() {
  local provider
  provider="$(printf '%s' "${PSI_AI_PROVIDER:-}" | tr '[:upper:]' '[:lower:]')"
  [ -n "${PSI_AI_MODEL:-}" ] || return 1
  case "$provider" in
    anthropic) [ -n "${ANTHROPIC_API_KEY:-}" ] ;;
    openrouter) [ -n "${OPENROUTER_API_KEY:-}" ] ;;
    *) return 1 ;;
  esac
}

if [ -n "$CALLER_PSI_AI_MODE" ]; then
  PSI_AI_MODE="$CALLER_PSI_AI_MODE"
elif [ "${PSI_AI_MODE:-}" = "live" ] && ! has_live_ai_config; then
  echo "Warning: PSI_AI_MODE=live in .env has incomplete provider/model/key config; falling back to PSI_AI_MODE=demo (pass PSI_AI_MODE=live explicitly to override)." >&2
  PSI_AI_MODE="demo"
elif [ -z "${PSI_AI_MODE:-}" ]; then
  if has_live_ai_config; then
    PSI_AI_MODE="live"
  else
    PSI_AI_MODE="demo"
  fi
fi

CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT},http://localhost:3000}"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"
FRONTEND_URL="http://${FRONTEND_HOST}:${FRONTEND_PORT}"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  local exit_code=$?
  for pid in "${FRONTEND_PID:-}" "${BACKEND_PID:-}"; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
  exit "$exit_code"
}

trap cleanup SIGINT SIGTERM EXIT

echo "==> Starting FastAPI backend on $BACKEND_URL (PSI_AI_MODE=$PSI_AI_MODE)"
(
  cd "$BACKEND_DIR" &&
    CORS_ORIGINS="$CORS_ORIGINS" \
    PSI_AI_MODE="$PSI_AI_MODE" \
    .venv/bin/uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

echo "==> Waiting for backend readiness at ${BACKEND_URL}/api/v1/filters"
READY=false
for _ in $(seq 1 40); do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Error: backend process exited before becoming ready." >&2
    exit 1
  fi
  if "$BACKEND_DIR/.venv/bin/python" -c "import urllib.request; r = urllib.request.urlopen('${BACKEND_URL}/api/v1/filters', timeout=1); raise SystemExit(0 if r.status == 200 else 1)" 2>/dev/null; then
    READY=true
    break
  fi
  sleep 0.5
done

if [ "$READY" != "true" ]; then
  echo "Error: backend did not respond HTTP 200 within 20s at ${BACKEND_URL}/api/v1/filters." >&2
  exit 1
fi

echo "==> Starting Vite frontend on $FRONTEND_URL (proxying /api -> $BACKEND_URL)"
(
  cd "$FRONTEND_DIR" &&
    VITE_BACKEND_TARGET="$BACKEND_URL" \
    npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

echo ""
echo "PSI-Lens is running:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
if [ "$PSI_AI_MODE" = "live" ]; then
  echo "  AI mode:  $PSI_AI_MODE (${PSI_AI_PROVIDER:-unset} / ${PSI_AI_MODEL:-unset})"
else
  echo "  AI mode:  $PSI_AI_MODE"
fi
echo "Press Ctrl+C to stop both servers."
echo ""

wait -n "$BACKEND_PID" "$FRONTEND_PID"
