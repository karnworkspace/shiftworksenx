#!/usr/bin/env bash
set -euo pipefail

# Usage: ./release.sh 1.0.1
VERSION=${1:-1.0.1}

git add -A
git commit -m "chore(release): v${VERSION}"
git tag -a "v${VERSION}" -m "v${VERSION}"
git push origin HEAD
git push origin "v${VERSION}"

echo "Released v${VERSION} (local commits pushed and tag pushed)."
