#!/bin/bash
# ─────────────────────────────────────────────────────────────
# MARFA — Push website updates to GitHub (auto-deploys via Vercel)
# Run this from Terminal on your Mac after Claude makes changes.
# ─────────────────────────────────────────────────────────────

set -e

REPO_BASE="github.com/andrespazponce/marfa-website.git"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "MARFA → GitHub Deployer"
echo "========================"
echo ""

# ── Ask for GitHub token (not saved anywhere) ─────────────────
echo "🔑 Ingresa tu GitHub Personal Access Token:"
echo "   (ve a github.com → Settings → Developer Settings → Personal access tokens → Tokens (classic))"
echo "   El token debe tener permiso: repo"
echo ""
read -s -p "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Token vacío. Cancelando."
  exit 1
fi

REPO="https://andrespazponce:${GITHUB_TOKEN}@${REPO_BASE}"

# ── Git repo setup ────────────────────────────────────────────
if [ -d "$SCRIPT_DIR/.git" ]; then
  echo "✓ Git repo encontrado."
  cd "$SCRIPT_DIR"
else
  echo "Configurando git repo..."
  cd "$SCRIPT_DIR"
  git init
  git remote add origin "$REPO" 2>/dev/null || true
  git fetch origin
  git checkout -b main origin/main 2>/dev/null || git checkout main 2>/dev/null || true
fi

# Update remote URL with token for this session
git remote set-url origin "$REPO" 2>/dev/null || true

echo ""
echo "Preparando archivos..."
git add -A

echo ""
echo "Archivos a subir:"
git status --short

echo ""
git commit -m "feat: update website — Claude changes" 2>/dev/null || echo "(sin cambios nuevos — solo pushing)"

echo ""
echo "Subiendo a GitHub..."
git push origin main

# Remove token from remote URL after push (security)
git remote set-url origin "https://github.com/${REPO_BASE}" 2>/dev/null || true

echo ""
echo "✅ ¡Listo! Vercel desplegará en ~30 segundos."
echo "   Sitio: https://marfa-website.vercel.app"
echo ""
