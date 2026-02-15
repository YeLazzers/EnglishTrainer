FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

# Clear npm cache before install
RUN npm cache clean --force && npm ci

COPY . .

# важно: prisma/schema.prisma уже будет в /app
RUN npx prisma generate

# Build with cache clearing
RUN echo "🔨 Building..." && \
    rm -rf dist node_modules/.cache && \
    npm run build && \
    echo "✅ Build done, checking output..." && \
    ls -lh dist/bot.js && \
    head -10 dist/bot.js

# Copy entrypoint script for env debugging
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm","start"]
