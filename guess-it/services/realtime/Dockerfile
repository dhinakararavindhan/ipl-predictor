FROM node:22-slim
WORKDIR /app

# monorepo packages the server depends on
COPY packages/engine /app/packages/engine
COPY packages/content /app/packages/content
COPY services/realtime /app/services/realtime

WORKDIR /app/services/realtime
RUN npm install --omit=dev --no-audit --no-fund

ENV PORT=8787
EXPOSE 8787
CMD ["npx", "tsx", "src/server.ts"]
