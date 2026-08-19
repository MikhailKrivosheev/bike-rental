# Bike Rental

Сервис аренды велосипедов.

## Стек

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (radix base, preset nova)
- Бэкенд — Route Handlers / Server Components внутри Next.js (Node.js runtime)
- **Prisma 7** + **PostgreSQL 18** (драйвер-адаптер `@prisma/adapter-pg`)
- **pnpm** как пакетный менеджер, Node.js 24 (см. `.nvmrc`)

## Быстрый старт

```bash
nvm use              # Node 24 из .nvmrc
pnpm install
cp .env.example .env # при необходимости поправьте DATABASE_URL

pnpm db:up           # Postgres в docker (host-порт 5433)
pnpm db:migrate      # применить миграции
pnpm db:seed         # тестовые данные

pnpm dev             # http://localhost:3000
```

## Скрипты

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | дев-сервер Next.js |
| `pnpm build` / `pnpm start` | прод-сборка и запуск |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm db:up` / `pnpm db:down` | поднять / остановить Postgres в docker |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:push` | синхронизировать схему без миграции |
| `pnpm db:generate` | перегенерировать Prisma Client |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | заполнить БД тестовыми данными |

## Структура

```
prisma/
  schema.prisma      модели: User, Station, Bike, Rental
  migrations/        миграции
  seed.ts            тестовые данные
src/
  app/               роуты App Router
    api/bikes/       REST-эндпоинт каталога
    bikes/[id]/      карточка велосипеда
  components/ui/     компоненты shadcn/ui
  lib/prisma.ts      singleton Prisma Client
  lib/format.ts      форматирование цен
  generated/prisma/  сгенерированный Prisma Client (в git не коммитится)
```

## Соглашения

- Цены хранятся в **копейках** (`Int`), форматируются через `formatPrice`.
- Страницы, читающие БД, помечены `export const dynamic = 'force-dynamic'`.
- Компоненты shadcn добавляются через `pnpm dlx shadcn@latest add <name>`.
