FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm turbo

# Copy monorepo files
COPY . .

# Generate a pruned workspace for the api app
RUN turbo prune api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:20-alpine AS installer
WORKDIR /app
RUN npm install -g pnpm

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN pnpm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
RUN pnpm turbo build --filter=api...

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer /app .

CMD node apps/api/dist/main.js
