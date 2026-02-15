FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# важно: prisma/schema.prisma уже будет в /app
RUN npx prisma generate

RUN npm run build

CMD ["npm","start"]
