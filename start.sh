#!/usr/bin/env bash
#
# Start the Premier Products® storefront.
#
#   ./start.sh          build if needed, then serve on http://localhost:4000
#   ./start.sh --rebuild  force a fresh build first
#   ./start.sh --dev      also run the Vite dev server (http://localhost:5173+)
#
# Requires MongoDB to be running (brew services start mongodb-community).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="$ROOT/server"
CLIENT="$ROOT/client"
PORT="${PORT:-4000}"

REBUILD=0
DEV=0
for arg in "$@"; do
  case "$arg" in
    --rebuild) REBUILD=1 ;;
    --dev)     DEV=1 ;;
    -h|--help) sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'; exit 0 ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
  esac
done

say() { printf '\033[1m%s\033[0m\n' "$*"; }

# ---------------------------------------------------------------- dependencies
if [ ! -d "$SERVER/node_modules" ]; then
  say "Installing server dependencies…"
  (cd "$SERVER" && npm install --no-audit --no-fund)
fi
if [ ! -d "$CLIENT/node_modules" ]; then
  say "Installing client dependencies…"
  (cd "$CLIENT" && npm install --no-audit --no-fund)
fi

# -------------------------------------------------------------------- database
if ! mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; then
  echo "MongoDB is not responding on 27017." >&2
  echo "Start it with:  brew services start mongodb-community" >&2
  exit 1
fi
say "MongoDB is up."

# ------------------------------------------------------- seed on first run only
# -------------------------------------------------- build first, then decide on seeding
# The bundle is built before the seed check, because the bundled seed starts in
# seconds while the unbundled one can crawl for minutes on a slow filesystem.
if [ "$REBUILD" = "1" ] || [ ! -f "$SERVER/dist/server.cjs" ] || [ ! -f "$SERVER/dist/seed.cjs" ]; then
  say "Bundling the server…"
  if (cd "$SERVER" && npm run build); then
    :
  else
    echo "  (bundle failed — will fall back to running the source directly)" >&2
  fi
fi

# ------------------------------------------------------------------ seed if empty
# Name the database explicitly: `mongosh` with no argument connects to `test`, so
# an un-qualified query always reports zero and would re-seed on every start.
DB_NAME="$(sed -n 's|.*mongodb://[^/]*/\([^/?]*\).*|\1|p' "$SERVER/.env" 2>/dev/null | head -1)"
DB_NAME="${DB_NAME:-pop-up-drain}"
ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-admin@premierproducts.com}"
ADMIN_COUNT="$(mongosh --quiet "$DB_NAME" --eval \
  "db.users.countDocuments({email:'$ADMIN_EMAIL'})" 2>/dev/null | tail -1)"

if [ "$ADMIN_COUNT" != "0" ] && [ -n "$ADMIN_COUNT" ]; then
  say "Database \"$DB_NAME\" is already seeded."
elif [ -f "$SERVER/dist/seed.cjs" ]; then
  say "Empty database — seeding…"
  (cd "$SERVER" && npm run seed:bundle)
else
  say "Empty database — seeding…"
  (cd "$SERVER" && npm run seed)
fi

# -------------------------------------------------------------- build the client
if [ "$REBUILD" = "1" ] || [ ! -f "$CLIENT/dist/index.html" ]; then
  say "Building the client…"
  # Not `npx` — it can stall on a network lookup.
  (cd "$CLIENT" && ./node_modules/.bin/vite build)
else
  say "Client build is present (use --rebuild to force a fresh one)."
fi

# ------------------------------------------------------------------ start it up
say ""
say "──────────────────────────────────────────────────────────"
say "  Premier Products®  →  http://localhost:$PORT"
say "  Admin: $ADMIN_EMAIL / Admin123!"
say "  Press Ctrl-C to stop."
say "──────────────────────────────────────────────────────────"

# The bundle starts in seconds; the unbundled source can be far slower to boot on
# a busy filesystem, so prefer the bundle whenever it exists.
if [ -f "$SERVER/dist/server.cjs" ]; then
  SERVER_ENTRY="$SERVER/dist/server.cjs"
else
  SERVER_ENTRY="$SERVER/server.js"
fi

if [ "$DEV" = "1" ]; then
  (cd "$CLIENT" && ./node_modules/.bin/vite) &
  VITE_PID=$!
  trap 'kill $VITE_PID 2>/dev/null || true' EXIT INT TERM
  # Run from server/ so dotenv finds .env — it resolves relative to the working
  # directory, not to the entry file, and the process exits if MONGODB_URI is unset.
  (cd "$SERVER" && exec node "$SERVER_ENTRY")
else
  (cd "$SERVER" && exec node "$SERVER_ENTRY")
fi
