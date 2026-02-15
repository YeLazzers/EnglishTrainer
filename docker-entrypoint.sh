#!/bin/sh
set -e

echo "🐳 Docker container starting..."
echo ""
echo "📦 bot.js version check:"
echo "  File size: $(ls -lh dist/bot.js | awk '{print $5}')"
echo "  First 3 lines:"
head -3 dist/bot.js
echo ""
echo "  Looking for version marker:"
grep -m 1 "BUILD_VERSION" dist/bot.js || echo "  ⚠️  Version marker NOT FOUND"
echo ""
echo "📋 Environment variables check:"
echo "  BOT_TOKEN: ${BOT_TOKEN:+✓ set}${BOT_TOKEN:-✗ MISSING}"
echo "  DATABASE_URL: ${DATABASE_URL:+✓ set}${DATABASE_URL:-✗ MISSING}"
echo "  REDIS_URL: ${REDIS_URL:+✓ set}${REDIS_URL:-✗ MISSING}"
echo "  LLM_PROVIDER: ${LLM_PROVIDER:-not set}"
echo ""
echo "🔍 All env variables (first 30, excluding npm_*):"
env | grep -v "npm_" | head -30
echo ""
echo "🚀 Starting application..."
echo "=========================================="
echo ""

exec "$@"
