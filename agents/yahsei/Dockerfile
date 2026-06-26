# Build from repo root: docker build -f agents/yahsei/Dockerfile -t sovereign-yahsei .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/yahsei/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/yahsei/tsconfig.json ./tsconfig.json
COPY agents/yahsei/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7007
ENV NODE_ENV=production
EXPOSE 7007
CMD ["node", "dist/server.js"]
