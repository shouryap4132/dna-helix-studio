#!/bin/sh
# Publish dist/ to the gh-pages branch (GitHub Pages serves that branch).
# Run `npm run build` first.
set -e
cd "$(dirname "$0")/.."
[ -f dist/index.html ] || { echo "dist/ is missing: run npm run build first"; exit 1; }

remote=$(git remote get-url origin)
tmp=$(mktemp -d)
cp -r dist/. "$tmp"
touch "$tmp/.nojekyll" # serve files as-is, no Jekyll processing
cd "$tmp"
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$remote" gh-pages
cd - >/dev/null
rm -rf "$tmp"
echo "Deployed to gh-pages."
