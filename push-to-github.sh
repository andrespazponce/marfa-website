#!/bin/bash
# ─────────────────────────────────────────────────────────────
# MARFA — Push website updates to GitHub (auto-deploys via Vercel)
# Run this from Terminal on your Mac after Claude makes changes.
# ─────────────────────────────────────────────────────────────

set -e

REPO="https://github.com/andrespazponce/marfa-website.git"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "MARFA → GitHub Deployer"
echo "========================"
echo ""

# Check if we're already in the git repo
if [ -d "$SCRIPT_DIR/.git" ]; then
  echo "✓ Git repo found."
  cd "$SCRIPT_DIR"
else
  echo "Setting up git repo..."
  cd "$SCRIPT_DIR"
  git init
  git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"
  # Pull existing state
  git fetch origin
  git checkout -b main origin/main 2>/dev/null || git checkout main 2>/dev/null || true
fi

echo ""
echo "Staging all changes..."
git add -A

echo ""
echo "Files to upload:"
git status --short

echo ""
git commit -m "feat: add Asadores and Camping VIP sections with real photos and video" 2>/dev/null || echo "(nothing new to commit)"

echo ""
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Vercel will auto-deploy in ~30 seconds."
echo "   Check: https://marfa-website.vercel.app"
echo ""
