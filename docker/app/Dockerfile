# ─────────────────────────────────────────────
# STAGE 1: BASE — shared system dependencies
# ─────────────────────────────────────────────
FROM node:24-alpine AS base

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    wget

WORKDIR /app

# ─────────────────────────────────────────────
# STAGE 2: DEPENDENCIES — install all deps
# ─────────────────────────────────────────────
FROM base AS deps

COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────────
# STAGE 3: BUILDER — compile TypeScript
# ─────────────────────────────────────────────
FROM deps AS builder

COPY . .
RUN node ace build

# ─────────────────────────────────────────────
# STAGE 4: DEVELOPMENT — hot reload
# ─────────────────────────────────────────────
FROM deps AS development

ENV NODE_ENV=development
COPY . .
EXPOSE 3333
CMD ["node", "ace", "serve", "--hmr"]

# ─────────────────────────────────────────────
# STAGE 5: PRODUCTION — lean final image
# ─────────────────────────────────────────────
FROM node:24-alpine AS production

RUN apk add --no-cache curl wget

WORKDIR /app

ENV NODE_ENV=production

# Copy built output from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install production deps only (no devDeps)
RUN npm ci --omit=dev && npm cache clean --force

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adonisjs -u 1001 -G nodejs
USER adonisjs

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3333/health || exit 1

CMD ["node", "build/bin/server.js"]
