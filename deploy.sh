#!/bin/bash
# ─────────────────────────────────────────────────────────────
# deploy.sh — Manual Production Deployment Script
# Usage: ./deploy.sh [--fresh]
# ─────────────────────────────────────────────────────────────
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✅ OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[❌ ERR]${NC} $1"; exit 1; }

FRESH=${1:-""}

log "🚀 ConvoCore Production Deployment"
log "======================================"

# ── Pre-flight checks ─────────────────────
log "Running pre-flight checks..."
command -v docker   >/dev/null 2>&1 || error "Docker not installed"
command -v git      >/dev/null 2>&1 || error "Git not installed"
[ -f .env.production ] || error ".env.production not found! Copy .env.production.example and fill in values"
success "Pre-flight checks passed"

# ── Pull latest code ──────────────────────
log "Pulling latest code from main..."
git pull origin main
success "Code updated"

# ── Build production image ────────────────
log "Building production Docker image..."
docker compose -f docker-compose.prod.yml build app
success "Image built"

# ── Fresh install (optional) ──────────────
if [ "$FRESH" == "--fresh" ]; then
  warn "Fresh install — removing all volumes!"
  docker compose -f docker-compose.prod.yml down -v
fi

# ── Start infrastructure ──────────────────
log "Starting PostgreSQL and Redis..."
docker compose -f docker-compose.prod.yml up -d postgres redis
log "Waiting for services to be healthy..."
sleep 10
success "Infrastructure ready"

# ── Run migrations ────────────────────────
log "Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm app \
  node build/ace migration:run --force
success "Migrations complete"

# ── Start app ─────────────────────────────
log "Starting application..."
docker compose -f docker-compose.prod.yml up -d app nginx
success "Application started"

# ── Health check ──────────────────────────
log "Waiting for health check..."
sleep 15
HEALTH=$(docker compose -f docker-compose.prod.yml exec app \
  wget -qO- http://localhost:3333/health 2>/dev/null || echo "failed")

if echo "$HEALTH" | grep -q "healthy\|ok\|true"; then
  success "Health check passed!"
else
  warn "Health check response: $HEALTH"
fi

# ── Summary ───────────────────────────────
echo ""
echo -e "${GREEN}======================================"
echo -e "  🎉 Deployment Complete!"
echo -e "======================================${NC}"
docker compose -f docker-compose.prod.yml ps
