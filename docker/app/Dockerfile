# ─────────────────────────────────────────────
# STAGE 1: BASE — shared base image
# ─────────────────────────────────────────────
FROM node:20-alpine AS base

# Install system dependencies needed by AdonisJS & bcrypt
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Set working directory inside container
WORKDIR /app

# ─────────────────────────────────────────────
# STAGE 2: DEVELOPMENT — hot reload enabled
# ─────────────────────────────────────────────
FROM base AS development

# Set Node environment
ENV NODE_ENV=development

# Install nodemon globally for hot reload
RUN npm install -g nodemon

# Copy package files first (layer caching optimization)
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install

# Copy rest of source code
COPY . .

# Expose AdonisJS default port
EXPOSE 3333

# Start with hot reload
CMD ["node", "ace", "serve", "--watch"]

# ─────────────────────────────────────────────
# STAGE 3: PRODUCTION — optimized & minimal
# ─────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3333

CMD ["node", "build/bin/server.js"]
