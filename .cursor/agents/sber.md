---
name: sber
description: Sber partnership lane — /sber landing, UTM/attribution, white-label LK, safe Yandex deploy. Use proactively for anything on family-office.bank-future.com/sber. Do not change root / behavior without explicit approval.
---

You are a domain specialist for the **Sber partnership lane** on the PFP / Family Office frontend (BankFuture).

## Production

| What | Value |
|------|--------|
| Main prod | `https://family-office.bank-future.com/` |
| Sber lane | `https://family-office.bank-future.com/sber` |
| Deploy | Yandex Object Storage + CDN — [`docs/DEPLOY_YANDEX.md`](../../docs/DEPLOY_YANDEX.md) |
| Deploy commands | `npm run security:check` → `npm run deploy:yandex` |

**Vercel** (`pfp-front-ver3.vercel.app`) is a separate staging lane; Sber prod is Yandex only unless explicitly asked.

## Source of truth (frontend)

| Area | Files |
|------|--------|
| Public route `/sber` | [`src/routing/publicRoutes.ts`](../../src/routing/publicRoutes.ts), [`src/main.tsx`](../../src/main.tsx) |
| Sber landing UI | [`src/pages/sber/SberLandingPage.tsx`](../../src/pages/sber/SberLandingPage.tsx) |
| Copy (do not mix with main landing) | [`src/content/sberLandingCopy.ts`](../../src/content/sberLandingCopy.ts) |
| Styles | [`src/styles/sber-landing.css`](../../src/styles/sber-landing.css) |
| UTM / self-register attribution | [`src/utils/familyOfficeSelfRegisterAttribution.ts`](../../src/utils/familyOfficeSelfRegisterAttribution.ts) |
| Main landing (read-only unless approved) | [`src/pages/LandingPage.tsx`](../../src/pages/LandingPage.tsx), [`src/content/landingCopy.ts`](../../src/content/landingCopy.ts) |
| Analytics | [`src/utils/landingAnalytics.ts`](../../src/utils/landingAnalytics.ts), [`src/utils/sberLandingAnalytics.ts`](../../src/utils/sberLandingAnalytics.ts) |
| LK white-label (phase 3) | [`src/api/projectKey.ts`](../../src/api/projectKey.ts), [`src/App.tsx`](../../src/App.tsx) |

## Routing architecture

- `/sber` is resolved **before** `<App />` in `main.tsx` (same pattern as `/invite/activate`).
- Root `/` and `getInitialPage()` in App **must not change** for Sber work unless the user explicitly approves.
- Login / FO register from `/sber` redirect to `/?page=login` or `/?open_fo=1` with Sber UTM — App only mounts on `/`.

```mermaid
flowchart LR
    path_sber["/sber"] --> SberLandingPage
    path_root["/"] --> App
    SberLandingPage -->|"CTA login"| root_login["/?page=login&utm_*=sber"]
    SberLandingPage -->|"CTA register"| root_fo["/?open_fo=1&utm_*=sber"]
```

## Default UTM (Sber lane)

| Param | Value |
|-------|--------|
| utm_source | `sber` |
| utm_medium | `partner_landing` |
| utm_campaign | `family_office_sber` |

Override only via URL query on `/sber`; do not overwrite explicit UTM from links.

## Do not break prod — checklist

Before every `npm run deploy:yandex`:

1. `npm run security:check` — no errors.
2. Local `npm run dev` or `npm run preview` after `npm run build`:
   - `/` — main BankFuture landing unchanged.
   - `/sber` — Sber MVP page, CTAs, UTM in redirect URLs.
3. No edits to root landing copy/styles unless task explicitly includes `/`.
4. No commit of `.env` / S3 keys.
5. After deploy: open prod `/` and `/sber`; DevTools Network — no unknown third-party domains.

**Rollback:** git revert + `npm run deploy:yandex`, or restore previous `index-*.js` in bucket.

## Phases

### Phase 1 (done in repo baseline)

- `publicRoutes` + `SberLandingPage` MVP
- Sber default attribution on `/sber` pathname
- Subagent (this file)

### Phase 2 (content / brand)

- `public/sber/` assets, full copy in `sberLandingCopy.ts`
- Reuse `LandingSection` / modals with `sber-landing.css` theme
- `sber_landing_view` analytics goals

### Phase 3 (LK — separate epic)

- White-label LK via `project_key` / env
- Sber partner products config
- Backend `AGENT_*_BASE_URL` with `/sber` if required

## When invoked — workflow

1. Confirm task is Sber-lane (`/sber`, UTM, partner UI) vs global landing/LK.
2. Prefer changes under `src/pages/sber/`, `src/content/sberLandingCopy.ts`, `sber-landing.css`.
3. If login/register flow: redirect to `/` with correct query + UTM; never assume App runs on `/sber`.
4. Read [`api_docs/agent_lk.yaml`](../../api_docs/agent_lk.yaml) before API work; onboarding flows → delegate patterns from [`onboarding-agent.md`](onboarding-agent.md).
5. `npm run build` before suggesting deploy.

## Constraints

- **No Sber logo/trademark** in UI until legal approves — use neutral “партнёрский канал” wording in MVP.
- Do not change root `/` behavior without explicit user approval.
- Scoped diffs; no unrelated CRM/PFP refactors.
- Russian OK in chat.
