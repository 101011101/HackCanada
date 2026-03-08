#!/usr/bin/env bash
# =============================================================================
# MyCelium Test Runner
# Runs frontend unit tests (Vitest) and backend API tests (pytest) then
# prints a combined summary.
# =============================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/app/frontend"
BACKEND_DIR="$PROJECT_ROOT/app/backend"

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

FRONTEND_EXIT=0
BACKEND_EXIT=0

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
banner() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}  $1${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
}

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
RUN_FRONTEND=true
RUN_BACKEND=true
WATCH=false

for arg in "$@"; do
  case $arg in
    --frontend) RUN_BACKEND=false ;;
    --backend)  RUN_FRONTEND=false ;;
    --watch)    WATCH=true ;;
    --help|-h)
      echo "Usage: $0 [--frontend] [--backend] [--watch]"
      echo "  --frontend   Run only frontend (Vitest) tests"
      echo "  --backend    Run only backend (pytest) tests"
      echo "  --watch      Run Vitest in watch mode (frontend only)"
      exit 0
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Frontend tests
# ---------------------------------------------------------------------------
if $RUN_FRONTEND; then
  banner "Frontend Unit Tests (Vitest)"

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠  node_modules not found — running npm install...${RESET}"
    (cd "$FRONTEND_DIR" && npm install)
  fi

  if $WATCH; then
    (cd "$FRONTEND_DIR" && npx vitest)
  else
    if (cd "$FRONTEND_DIR" && npx vitest run); then
      echo -e "${GREEN}✓ Frontend tests passed${RESET}"
    else
      FRONTEND_EXIT=1
      echo -e "${RED}✗ Frontend tests FAILED${RESET}"
    fi
  fi
fi

# ---------------------------------------------------------------------------
# Backend tests
# ---------------------------------------------------------------------------
if $RUN_BACKEND && ! $WATCH; then
  banner "Backend API Tests (pytest)"

  PYTHON="/Library/Frameworks/Python.framework/Versions/3.10/bin/python3"
  PYTEST="/Library/Frameworks/Python.framework/Versions/3.10/bin/pytest"

  if ! command -v "$PYTEST" &>/dev/null; then
    PYTEST="pytest"
  fi

  if (cd "$PROJECT_ROOT" && PYTHONPATH=. "$PYTEST" app/backend/tests/ -v --tb=short); then
    echo -e "${GREEN}✓ Backend tests passed${RESET}"
  else
    BACKEND_EXIT=1
    echo -e "${RED}✗ Backend tests FAILED${RESET}"
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
if ! $WATCH; then
  banner "Test Summary"

  if $RUN_FRONTEND; then
    if [ $FRONTEND_EXIT -eq 0 ]; then
      echo -e "  Frontend (Vitest):  ${GREEN}${BOLD}PASS${RESET}"
    else
      echo -e "  Frontend (Vitest):  ${RED}${BOLD}FAIL${RESET}"
    fi
  fi

  if $RUN_BACKEND; then
    if [ $BACKEND_EXIT -eq 0 ]; then
      echo -e "  Backend  (pytest):  ${GREEN}${BOLD}PASS${RESET}"
    else
      echo -e "  Backend  (pytest):  ${RED}${BOLD}FAIL${RESET}"
    fi
  fi

  echo ""

  OVERALL=$((FRONTEND_EXIT + BACKEND_EXIT))
  if [ $OVERALL -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}All tests passed ✓${RESET}"
  else
    echo -e "  ${RED}${BOLD}Some tests failed ✗${RESET}"
  fi

  exit $OVERALL
fi
