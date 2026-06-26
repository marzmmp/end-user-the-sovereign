# Build from repo root: docker build -f agents/yahriel/Dockerfile -t sovereign-yahriel .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/yahriel/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/yahriel/tsconfig.json ./tsconfig.json
COPY agents/yahriel/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7001
ENV NODE_ENV=production
EXPOSE 7001
CMD ["node", "dist/server.js"]
