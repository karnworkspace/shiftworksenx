#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Cleaning macOS resource fork files (._ files)..."

# Remove all ._* files from frontend/dist
if [ -d "frontend/dist" ]; then
  find frontend/dist -name "._*" -type f -delete
  echo "✅ Cleaned frontend/dist"
fi

# Remove all ._* files from backend/dist
if [ -d "backend/dist" ]; then
  find backend/dist -name "._*" -type f -delete
  echo "✅ Cleaned backend/dist"
fi

echo "🎉 Cleanup complete!"
