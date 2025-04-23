# E-commerce Application

<<<<<<< HEAD
Полнофункциональное e-commerce приложение с GraphQL API, WebSocket чатом и админ-панелью.
=======
Полнофункциональный интернет-магазин с административной панелью, GraphQL API и чатом поддержки.

## Функциональность

- Управление товарами
- Административная панель
- Чат поддержки в реальном времени
- GraphQL API
- Корзина покупок
- Управление заказами

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/Res0m/4proj.git
```

2. Установите зависимости:
```bash
npm install --legacy-peer-deps
```

## Запуск проекта

### Запуск всех компонентов
```bash
npm run start:all
```

### Запуск в режиме разработки
```bash
npm run dev:all
```

### Запуск отдельных компонентов

- Основной сервер: `npm run start`
- Клиентская часть: `npm run start:client`
- Админ-панель: `npm run start:admin`
- Чат-сервер: `npm run start:chat`

## Доступ к компонентам

- Основной интерфейс магазина: `http://localhost:3000`
- Админ-панель: `http://localhost:3001`
- WebSocket чат: `ws://localhost:3002`
>>>>>>> 42d4e5abf4ae593b3bb58e7ea8b6da6283aee9d3

## Структура проекта

Проект состоит из следующих компонентов:

- **Основной сервер (GraphQL API)** - порт 3000
- **Клиентское приложение** - порт 3002
- **Админ-панель** - порт 3001
- **Чат-сервер (WebSocket)** - порт 3003

## Требования

- Docker
- Docker Compose
- Node.js (для локальной разработки)

## Запуск с помощью Docker

1. Клонируйте репозиторий:
```bash
git clone https://github.com/Res0m/4proj.git
cd <project-directory>
```

2. Запустите приложение:
```bash
docker-compose up --build
```

3. После успешного запуска, приложение будет доступно по следующим URL:
   - Клиентское приложение: http://localhost:3002
   - Админ-панель: http://localhost:3001
   - GraphQL Playground: http://localhost:3000/graphql





