FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

# Clear npm cache before install
RUN npm cache clean --force && npm ci

COPY . .

# важно: prisma/schema.prisma уже будет в /app
RUN npx prisma generate

# Build
RUN rm -rf dist node_modules/.cache && npm run build

CMD ["npm", "start"]
