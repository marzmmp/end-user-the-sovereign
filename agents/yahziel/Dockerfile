# Build from repo root: docker build -f agents/yahziel/Dockerfile -t sovereign-yahziel .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/yahziel/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/yahziel/tsconfig.json ./tsconfig.json
COPY agents/yahziel/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7004
ENV NODE_ENV=production
EXPOSE 7004
CMD ["node", "dist/server.js"]
