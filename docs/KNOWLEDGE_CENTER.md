# Poultry Knowledge Center — integration notes

This document records how the Knowledge Center and the related farmer features fit into PoultryHub.

## 1. Existing structure (assessment)

| Layer | What is there | How the Knowledge Center uses it |
|---|---|---|
| Frontend | Next.js 15 App Router, client components, `AppNav` for public pages, `DashboardShell` for role dashboards, FR/EN via `LanguageContext` | Public pages under `/knowledge`, links in the public nav and in every role's sidebar |
| Backend | NestJS 11, one module per area, JWT auth (`JwtAuthGuard`, `OptionalJwtGuard`), roles via `RolesGuard` | New `KnowledgeModule` (`apps/api/src/knowledge`) |
| Database | MongoDB through Mongoose schemas in `apps/api/src/database/schemas.ts` | New `KnowledgeArticle` collection |
| Users & roles | `customer`, `farmer`, `shopkeeper`, `admin`, `super_admin` on one account | Public reading for everyone, farm-linked advice for farmers, editing for admins |
| Farm data | Farms → poultry batches (type, breed, start date, age at start) → feeding, mortality, vaccination, egg, expense and sale records | Recommendations by flock type and age, vaccination reminders, mortality warnings |

## 2. Data model

`KnowledgeArticle` (collection `knowledgearticles`):

| Field | Type | Notes |
|---|---|---|
| `slug` | string, unique | URL id, lowercase with dashes |
| `section` | enum | `production`, `feeding`, `housing`, `health`, `observation`, `prevention`, `treatment`, `followup`, `emergency`, `checklists` |
| `title`, `summary`, `body` | `{ en, fr }` | `body` is Markdown (headings, lists, tables, bold, links) |
| `symptoms` | string[] | Observable signs in both languages, used by the symptom search |
| `tags` | string[] | Extra search words |
| `poultryTypes` | string[] | Empty = every type; otherwise matched against a flock's `poultryType` |
| `minAgeDays`, `maxAgeDays` | number? | Matched against a flock's age |
| `alertLevel` | `info` / `caution` / `urgent` | Drives badges, colours and the urgent banner |
| `warnings`, `checklist` | `{ en, fr }[]` | Shown as warning boxes and as a tick-box checklist |
| `references` | `{ title, url? }[]` | Only `http(s)` URLs are kept |
| `images` | string[] | Only `http(s)` URLs are kept |
| `status` | `draft` / `published` | Drafts are invisible to the public |
| `order` | number | Order inside a section |
| `searchText` | string (hidden) | Lower-case, accent-free copy of all text, maintained by the service |
| `updatedBy` | User id | Last admin who saved it |

The ten sections are fixed in code (`knowledge.constants.ts` on the API, `knowledge-data.ts` on the web, with icons and labels). Articles are entirely in the database, so content changes never need a redeploy.

Starter content (24 bilingual guides, `knowledge.seed.ts`) is inserted automatically the first time the API starts with an empty collection.

## 3. API

Public:

| Method & path | Purpose |
|---|---|
| `GET /api/knowledge/sections` | Sections with published article counts |
| `GET /api/knowledge/articles?section=&q=&poultryType=` | List or search (every word must match; accents and case ignored) |
| `GET /api/knowledge/articles/:slug` | One published article plus related ones |

Signed in:

| Method & path | Purpose |
|---|---|
| `GET /api/knowledge/for-my-flocks` | For each active flock: age in days, matching guides, vaccinations due within 3 days, and a mortality warning when deaths in 24 h exceed twice the usual daily rate (and at least 3) or 1 % of the flock |

Admin only (`admin`, `super_admin`):

| Method & path | Purpose |
|---|---|
| `GET /api/admin/knowledge?section=&q=` | All articles including drafts |
| `GET /api/admin/knowledge/:slug` | One article including drafts |
| `POST /api/admin/knowledge` | Create (defaults to draft) |
| `PATCH /api/admin/knowledge/:id` | Update |
| `DELETE /api/admin/knowledge/:id` | Delete |

All admin input is whitelisted and validated in `KnowledgeService.validate`.

## 4. User interface

| Route | Who | Content |
|---|---|---|
| `/knowledge` | Everyone | Title "Poultry Knowledge Center", symptom search with quick chips, educational disclaimer, emergency card, "For your flocks" panel for farmers, the ten sections |
| `/knowledge/[section]` | Everyone | Guides of one section |
| `/knowledge/article/[slug]` | Everyone | Urgent banner, warnings, body, daily checklist (progress saved on the device for the day), related signs, "When to call a veterinarian", references, related guides |
| `/dashboard/admin?tab=knowledge` | Admins | List, search, filter, create, edit (French and English side by side), publish/unpublish, delete |

### Safety rules applied everywhere

- Health content describes signs and possibilities; it never states a diagnosis and always points to a veterinarian or a laboratory.
- No medicine doses; treatment content covers responsible use, withdrawal periods and records.
- A disclaimer appears on the hub and on health, observation, treatment, follow-up and emergency pages.
- Suspected avian influenza is flagged as a notifiable disease (MINEPIA in Cameroon).

## 5. Related features delivered with it

- **PoultryBot**: answers for the role the user is working in (from the dashboard they are on, only if they hold that role), receives the list of guides so it can link them, flock ages and breeds for tailored advice, and strict no-diagnosis rules. Offline, health questions are matched against guide symptoms and answered with links and safe next steps.
- **Farm records PDF** (`/dashboard/farmer/records`): choose farm, flock, period and record types; the API (`GET /api/farm-ops/records-export`, owner or admin only) returns the records and the browser builds the PDF with jsPDF.
- **Farmer products**: "My Products" is now in the farmer sidebar; products go to admin approval.
- **Approval notifications**: approving, rejecting (with reason) or suspending a farm, shop or product notifies its owner in French and English; clicking the notification opens the related page.

## 6. Possible next steps

- Image upload for articles (today: image URLs) once the media/upload module exists.
- Article version history and an "updated on" note for readers.
- Server-side push or SMS reminders for vaccinations due.
