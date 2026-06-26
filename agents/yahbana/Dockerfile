# Build from repo root: docker build -f agents/yahbana/Dockerfile -t sovereign-yahbana .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/yahbana/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/yahbana/tsconfig.json ./tsconfig.json
COPY agents/yahbana/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7005
ENV NODE_ENV=production
EXPOSE 7005
CMD ["node", "dist/server.js"]
