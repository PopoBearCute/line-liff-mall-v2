# Project guide for coding agents

Read this file before changing the project. For the full system map, read
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Project purpose

This repository contains the CPC LINE LIFF group-buy mall. It lets LINE users
choose a group leader, browse products, register purchase intent, and share
product cards. Group leaders can enable products, inspect registrations,
generate a printable DM, and access a PIN-protected product administration
page.

## Technology

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui, Radix UI
- Supabase for products, leaders, registrations, and bindings
- LINE LIFF SDK for identity and sharing
- Docker, Google Cloud Build, and Google Cloud Run for deployment

## Important routes and files

- `/`: `app/page.tsx` — main LIFF application and most client-side orchestration
- `/admin`: `app/admin/page.tsx` — PIN-protected product administration
- `/dm`: `app/dm/page.tsx` — printable group-leader catalogue
- `/intro`: `app/intro/page.tsx` — embeds the generated static guide
- `/api/products`: `app/api/products/route.ts` — product, intent, binding, and
  leader actions
- `/api/leaders`: `app/api/leaders/route.ts` — leader lookup and selection
- `/api/admin`: `app/api/admin/route.ts` — product CRUD and batch import
- `components/group-buy/` — mall and leader-facing UI
- `components/admin/` — administration forms and batch parser
- `lib/supabase.ts` — browser Supabase client

## Supabase tables

- `products`: product catalogue, prices, wave, dates, links, and MOQ
- `GroupLeaders`: leader identity, station, location, address, and LINE binding
- `intentdb`: member registrations and quantities
- `leaderbinding`: products enabled by each leader for each wave
- `Members`: LINE member profile data

Do not rename database columns casually. Several tables use Chinese column
names that are referenced literally in API code.

## Product phases

`app/api/products/route.ts` derives the visible phase from product dates:

- `collecting`: wish/registration period
- `active`: sale period after wish registration closes
- `closed`: omitted from the storefront

Products with all phase dates empty currently fall back to `collecting`.

## Guide subproject

`中油團購主系統操作導引/` is a separate Vite/React source project. Its build
output is copied into `public/intro-content/`, and `/intro` embeds
`/intro-content/index.html` in an iframe. Editing only the generated files or
only the Vite source will leave the two copies out of sync.

## Local commands

```bash
npm ci
npm run dev
npm run build
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

## Required environment variable names

- `NEXT_PUBLIC_LIFF_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or the currently supported public-key alias
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PIN`

Never add secret values to documentation, source code, Dockerfiles, logs, or
committed environment exports. Do not commit `.env.local`.

## Change rules

1. Preserve the LIFF `leaderId` redirect/state/storage flow unless the task is
   explicitly about changing it.
2. Verify identity-changing and write actions with the LINE ID token on the
   server. A hidden UI control is not an authorization boundary.
3. Keep service-role Supabase credentials server-only.
4. Reuse `components/ui/` and existing group-buy components before adding a new
   design system.
5. Prefer shared types for new code. Existing product and voter interfaces are
   duplicated and should not be duplicated further.
6. Avoid expanding `app/page.tsx` or `app/api/products/route.ts` with another
   large responsibility; extract a hook, component, helper, or service module.
7. Do not edit generated assets in `.next/`, `node_modules/`, or the guide
   `dist/` directory.

## Verification

For ordinary changes, run at least:

```bash
npm run build
```

Also exercise the affected route locally. For LIFF or Supabase changes, verify
both a normal member and a group-leader flow. For administration changes,
verify PIN rejection as well as the intended action.

The repository currently has known TypeScript errors, the Next.js build skips
type and lint failures, and the root `lint` script lacks an installed ESLint
dependency. Do not treat a successful production build as proof that type and
lint checks pass. Do not introduce additional errors.

## Known risks

- `app/page.tsx` and `app/api/products/route.ts` are large orchestration files.
- There are legacy group-buy components that are no longer imported by the
  current storefront.
- Development mode relaxes part of the leader-view check for local testing.
- Historical tracked configuration and diagnostic files may contain
  credentials. Rotate exposed credentials and remove them from Git history as
  a dedicated security task; never copy them into new files.
- Review the live Supabase grants and RLS policies before relying on the SQL
  scripts in `db_scripts/` as the current production security model.

