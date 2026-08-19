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
dictionaries/          en.json, pt.json — translation catalogues
prisma/
  schema.prisma        models: User, Station, Bike, Rental, VerificationCode
  migrations/          migrations
  seed.ts              sample data (3 bikes: gravel, MTB, city)
public/Images/Bikes/   bike photos
src/
  middleware.ts        next-intl locale negotiation and redirects
  i18n/                routing, navigation helpers, request config
  app/
    [locale]/          localised pages (catalogue, bikes/[id])
    api/bikes/         catalogue REST endpoint (not localised)
  components/layout/   header and footer
  components/ui/       shadcn/ui components
  components/theme-*   theme provider and light/dark toggle
  components/locale-switcher.tsx
  components/booking/  booking dialog, sticky panel and shared fields
  components/catalogue/ catalogue grid, filters and cards
  hooks/               shared React hooks
  server/              server actions (booking) and the email stub
  styles/globals.css   Tailwind entry point and theme tokens
  styles/fonts.ts      next/font declarations and their CSS variables
  lib/prisma.ts        Prisma Client singleton
  lib/format.ts        locale-aware price formatting
  generated/prisma/    generated Prisma Client (not committed)
```

## Design

`public/design/` holds the handoff: `README.md`, the `bike-rental.dc.html` prototype and
screenshots. The layout, spacing, typography and states follow it; **colors do not** — those
come from the shadcn preset already in `src/styles/globals.css`. The prototype has no
language or theme switcher, no add-ons and no confirmation step: those stay as built.

## Conventions

- Code, comments and message keys are English; user-facing copy lives in `dictionaries/*.json`.
- Locales are prefixed (`/en`, `/pt`); `/` redirects to the negotiated locale. Add a locale in
  `src/i18n/routing.ts` plus a matching `dictionaries/<locale>.json`.
- Bike descriptions are translated under `BikeDescriptions.<bike id>` and fall back to
  `Bike.description` from the database.
- Booking flow: pick a date (or a date range), a start time, add-ons and — for single-day
  rentals — a duration, then confirm with a 6-digit code emailed to the renter.
- Bikes carry two prices. One picked day is charged `pricePerHour × hours`; a range is
  charged `pricePerDay × days`, where the end date is exclusive (1st → 5th is four days). The rental is created as `PENDING` and only becomes
  `ACTIVE` — marking the bike `RENTED` — once the code is verified.
- Prices are always recomputed on the server from `Bike.pricePerHour` and
  `src/lib/rental.ts`; the amount submitted by the client is ignored.
- Theme is class-based (`next-themes`, `attribute="class"`), light by default, toggled between light and dark only — the system option is disabled.
- The neutral ramp in `src/styles/globals.css` is hand-tuned away from the preset's pure
  white / near-black: the page sits a step below `--card` in both modes, which is what makes
  surfaces read as raised. Keep that relationship when editing the tokens.
- Prices are stored in **cents** (`Int`) and rendered with `formatPrice`.
- Pages that read the database are marked `export const dynamic = 'force-dynamic'`.
- Add shadcn components with `pnpm dlx shadcn@latest add <name>`.
- The theme comes from shadcn preset `b5F1CoTVeS`; re-apply with `pnpm dlx shadcn@latest apply --preset b5F1CoTVeS`.
- Not wired up yet: OTP delivery (planned via Resend, codes are logged by
  `src/server/email.ts` in the meantime) and MBWay payment.
- While delivery is stubbed, the code **111111** is accepted as well. It works in `pnpm dev`
  and, in production builds, only when `ALLOW_DEV_OTP=true` — drop both the constant in
  `src/server/booking.ts` and the env var once real emails go out.
- Fonts: Geist (`--font-sans`, `--font-heading`) and Geist Mono (`--font-geist-mono`), per the design handoff.
