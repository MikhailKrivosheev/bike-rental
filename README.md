# Bike Rental

Bike rental service.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (`radix-nova` style, `mist` base color, Remix Icon)
- Backend — Route Handlers / Server Components inside Next.js (Node.js runtime)
- **Prisma 7** + **PostgreSQL 18** (via the `@prisma/adapter-pg` driver adapter)
- **next-intl** for translations (English + Portuguese), **next-themes** for light/dark mode
- **pnpm** as the package manager, Node.js 24 (see `.nvmrc`)

## Getting started

```bash
nvm use              # Node 24 from .nvmrc
pnpm install
cp .env.example .env # adjust DATABASE_URL if needed

pnpm db:up           # Postgres in docker (host port 5433)
pnpm db:migrate      # apply migrations
pnpm db:seed         # sample data

pnpm dev             # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm build` / `pnpm start` | production build and start |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm db:up` / `pnpm db:down` | start / stop Postgres in docker |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:push` | sync the schema without a migration |
| `pnpm db:generate` | regenerate Prisma Client |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | load sample data |

## Project layout

```
messages/              en.json, pt.json — translation catalogues
prisma/
  schema.prisma        models: User, Station, Bike, Rental
  migrations/          migrations
  seed.ts              sample data (3 bikes: gravel, MTB, city)
public/Images/Bikes/   bike photos
src/
  middleware.ts        next-intl locale negotiation and redirects
  i18n/                routing, navigation helpers, request config
  app/
    [locale]/          localised pages (catalogue, bikes/[id])
    api/bikes/         catalogue REST endpoint (not localised)
  components/layout/   site header and footer
  components/ui/       shadcn/ui components
  components/theme-*   theme provider and light/dark toggle
  components/locale-switcher.tsx
  lib/prisma.ts        Prisma Client singleton
  lib/format.ts        locale-aware price formatting
  generated/prisma/    generated Prisma Client (not committed)
```

## Conventions

- Code, comments and message keys are English; user-facing copy lives in `messages/*.json`.
- Locales are prefixed (`/en`, `/pt`); `/` redirects to the negotiated locale. Add a locale in
  `src/i18n/routing.ts` plus a matching `messages/<locale>.json`.
- Bike descriptions are translated under `BikeDescriptions.<bike id>` and fall back to
  `Bike.description` from the database.
- Theme is class-based (`next-themes`, `attribute="class"`), light by default, toggled between light and dark only — the system option is disabled.
- Prices are stored in **cents** (`Int`) and rendered with `formatPrice`.
- Pages that read the database are marked `export const dynamic = 'force-dynamic'`.
- Add shadcn components with `pnpm dlx shadcn@latest add <name>`.
- The theme comes from shadcn preset `b5F1CoTVeS`; re-apply with `pnpm dlx shadcn@latest apply --preset b5F1CoTVeS`.
- Fonts: Roboto (`--font-sans`), Noto Serif (`--font-heading`), Geist Mono (`--font-geist-mono`).
