# Деплой English Trainer на Railway

## Что такое Railway?

Railway — это PaaS (Platform as a Service) платформа для деплоя приложений. Предоставляет:
- Автоматический деплой из GitHub
- Встроенные базы данных (PostgreSQL, MySQL, Redis, MongoDB)
- Простое управление переменными окружения
- CI/CD из коробки

## Тарификация Railway

### Free Plan (Hobby)
- **$5/месяц бесплатно** (500 execution hours)
- После этого: **$0.000231/GB-s** за compute
- Нет лимита на количество проектов
- Unlimited deploys

### Расчет стоимости для бота

**Компоненты:**
1. **Bot Service** (Node.js app)
   - ~100-200 MB RAM в idle
   - ~500 MB RAM при активной работе с LLM

2. **Redis Service**
   - ~50-100 MB RAM

**Примерная стоимость:**
- **Легкое использование** (10-20 пользователей/день):
  - Укладывается в **$5/месяц FREE tier** ✅

- **Среднее использование** (100-200 пользователей/день):
  - ~$8-12/месяц (учитывая Redis + Bot)

- **Активное использование** (500+ пользователей/день):
  - ~$20-30/месяц

**Важно:** Основные расходы будут на **LLM API** (OpenAI/Gemini), не на хостинг!

---

## Пошаговая инструкция деплоя

### 1. Подготовка проекта

Убедитесь что:
- ✅ Код в Git репозитории (GitHub)
- ✅ Установлен `tsc-alias` (уже добавлен в package.json)
- ✅ Файлы `railway.json`, `.railwayignore` созданы

### 2. Создание проекта в Railway

1. Зайдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Нажмите **"New Project"**
4. Выберите **"Deploy from GitHub repo"**
5. Выберите ваш репозиторий `EnglishTrainer`

### 3. Добавление Redis сервиса

В Railway проекте:

1. Нажмите **"+ New"** → **"Database"** → **"Add Redis"**
2. Redis автоматически создаст переменную `REDIS_URL`
3. Эта переменная автоматически будет доступна в боте

### 4. Настройка переменных окружения

В Railway Dashboard → ваш сервис → **Variables**:

Добавьте:
```bash
# Telegram
BOT_TOKEN=ваш_токен_от_BotFather

# LLM Provider
LLM_PROVIDER=openai

# OpenAI (или Gemini)
OPENAI_API_KEY=ваш_openai_api_key

# Database (SQLite)
DATABASE_URL=file:/app/data/production.db

# Redis (уже создана автоматически при добавлении Redis сервиса)
# REDIS_URL уже будет там
```

### 5. Настройка Persistent Storage для SQLite

SQLite требует постоянное хранилище для базы данных.

1. В Railway Dashboard → ваш сервис → **Settings** → **Volumes**
2. Нажмите **"Add Volume"**
3. **Mount Path**: `/app/data`
4. **Name**: `sqlite-data`

Теперь база данных будет сохраняться между редеплоями.

### 6. Настройка Build & Deploy

Railway автоматически определит команды из `railway.json`:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

Проверьте в **Settings** → **Deploy**:
- ✅ Build Command установлена
- ✅ Start Command установлена
- ✅ Auto-deploy включен (для автоматического деплоя при push в GitHub)

### 7. Первый деплой

Railway автоматически запустит деплой после подключения репозитория.

Следите за логами:
1. Перейдите в **Deployments**
2. Кликните на активный деплой
3. Откройте **Deploy Logs**

Успешный деплой покажет:
```
[Boot] Bot is running...
```

### 8. Мониторинг

После деплоя проверьте:
- **Metrics** — использование CPU/RAM
- **Logs** — логи бота в реальном времени
- **Variables** — все переменные окружения установлены

---

## Структура Railway проекта

```
Railway Project: EnglishTrainer
│
├── Service: englishtrainer (Node.js Bot)
│   ├── Variables:
│   │   ├── BOT_TOKEN
│   │   ├── LLM_PROVIDER
│   │   ├── OPENAI_API_KEY
│   │   ├── DATABASE_URL
│   │   └── REDIS_URL (from Redis)
│   │
│   ├── Volume:
│   │   └── /app/data → SQLite database
│   │
│   └── Deploy:
│       ├── Build: npm install && npm run build
│       └── Start: npm start
│
└── Service: Redis
    └── Auto-configured
    └── Exposes: REDIS_URL
```

---

## Проверка работы

После деплоя:

1. **Откройте Telegram** и найдите вашего бота
2. Отправьте `/start`
3. Проверьте что бот отвечает

Если есть проблемы:
- Проверьте **Deploy Logs** в Railway
- Убедитесь что `REDIS_URL` доступен (должен быть вида `redis://default:password@redis.railway.internal:6379`)
- Проверьте что Volume примонтирован к `/app/data`

---

## Обновление бота

Railway автоматически деплоит при каждом `git push` в main:

```bash
git add .
git commit -m "Update bot logic"
git push origin main
```

Railway автоматически:
1. Запустит build
2. Обновит сервис
3. Перезапустит бот

---

## Откат версии

Если что-то сломалось:

1. Railway Dashboard → **Deployments**
2. Найдите предыдущий успешный деплой
3. Нажмите **"Redeploy"**

---

## Полезные команды Railway CLI

Установите Railway CLI (опционально):

```bash
npm install -g @railway/cli
railway login
railway link  # Привязать проект
railway logs  # Посмотреть логи
railway run npm run dev  # Запустить локально с Railway env vars
```

---

## Troubleshooting

### Бот не отвечает
- ✅ Проверьте логи: `[Boot] Bot is running...`
- ✅ Проверьте `BOT_TOKEN` в Variables
- ✅ Убедитесь что сервис запущен (не в crashed состоянии)

### Ошибка подключения к Redis
- ✅ Убедитесь что Redis сервис создан
- ✅ Проверьте `REDIS_URL` в Variables (должен быть вида `redis://default:...@redis.railway.internal:6379`)

### Ошибка базы данных
- ✅ Убедитесь что Volume примонтирован к `/app/data`
- ✅ Проверьте `DATABASE_URL=file:/app/data/production.db`

### Path alias ошибки
- ✅ Убедитесь что `tsc-alias` установлен (`npm install`)
- ✅ Проверьте что в `package.json` build script: `prisma generate && tsc && tsc-alias`

---

## Альтернативы Railway

Если Railway не подходит:
- **Fly.io** — похожая платформа, $5/месяц free tier
- **Render** — бесплатный tier с ограничениями
- **DigitalOcean App Platform** — от $5/месяц
- **Heroku** — нет free tier, от $7/месяц

---

## Итого

**Рекомендация:**
- ✅ Railway отлично подходит для Telegram ботов
- ✅ Простой деплой и управление
- ✅ $5/месяц free tier хватит для старта
- ✅ Redis и persistent storage из коробки

**Основные расходы будут на LLM API, не на хостинг!**
