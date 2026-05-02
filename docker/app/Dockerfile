# ─────────────────────────────────────────────
# STAGE 1: BASE
# ─────────────────────────────────────────────
FROM node:24-alpine AS base

# System deps needed for native modules (bcrypt, pg)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    wget

WORKDIR /app

# ─────────────────────────────────────────────
# STAGE 2: DEVELOPMENT (hot reload)
# ─────────────────────────────────────────────
FROM base AS development

ENV NODE_ENV=development

# Copy package files first (Docker layer cache optimization)
COPY package*.json ./

# Install ALL dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 3333

# HMR dev server
CMD ["node", "ace", "serve", "--hmr"]

# ─────────────────────────────────────────────
# STAGE 3: PRODUCTION
# ─────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3333

CMD ["node", "bin/server.js"]
