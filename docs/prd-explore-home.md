# PRD: Explore landing / home (`/`)

Supplements the core Game list tracker PRD. Defines the **Explore** experience on the site root: personal library carousel, popular games discovery grid, search, and filters.

**Related:** [decisions.md](./decisions.md), [technical-design.md](./technical-design.md), [wireframes.md](./wireframes.md).

---

## 1. Goals

- Replace a marketing-only home with a **single Explore page** that serves both **returning users** (my library at a glance) and **discovery** (popular games, metadata, community stats).
- Keep **one library entry per user per game**; the carousel reflects **all** `library_entries` for the signed-in user (not a single custom list).

---

## 2. Audiences and states

| State | Top carousel | Popular grid | Search / filters |
|-------|----------------|--------------|------------------|
| **Signed in** | Full carousel of user’s library entries | Visible | Visible |
| **Signed out** | **Empty state** only: short copy + link to Register / Sign in (“Sign in to see your games here”) — no fake data | Visible | Visible |

Primary CTAs for signed-out users remain **Register** and **Sign in** (header and/or empty carousel).

---

## 3. User stories (summary)

1. As a signed-in user, I want to **see my games in a horizontal carousel** with cover, title, progress status, and route completion hints so I can resume tracking quickly.
2. As a signed-in user, I want a **clear link to my full library** (`/library`) from Explore.
3. As any visitor, I want to **browse popular games** with saves count, rating/critic info, developer, and genres.
4. As any visitor, I want to **search and filter** (genre, sort) and **paginate** through results.

---

## 4. Functional requirements

### 4.1 “My library” carousel (authenticated)

**Data:** `library_entries` for `currentUserId` with joined `games` and `character_routes` (ordered by recency, e.g. `library_entries.updatedAt` desc — exact sort documented for engineering).

**Each carousel card shows:**

- Game **title** (`games.title`).
- **Cover** (`games.coverUrl` or placeholder).
- **Progress status** — entry-level status mapped to concise labels/chips (`planning` | `playing` | `completed` | `on_hold` | `dropped`); see [decisions](./decisions.md) and app status helpers.

**Character routes (visual row of circles):**

- Up to **8** route circles visible; if more, show **“+N”** overflow indicator.
- Each circle uses `character_routes.imageUrl` if present; else **monogram** (first letter of route name) or generic silhouette icon.
- **Cleared route** (see [decisions](./decisions.md#5-explore--routing-semantics)): `character_routes.status === 'completed'` → full color + **green checkmark** badge at **top-right** of the circle.
- **Not cleared:** **grayscale** filter on the circle (e.g. CSS `grayscale(1)`).
- **Accessibility:** each circle has `aria-label` e.g. “Route: {name}, completed” or “Route: {name}, not completed”.

**Interaction:** Horizontal scroll (carousel); optional prev/next controls in a later iteration.

**CTA:** Prominent control — **“View full library”** or **“My library”** → `/library`.

---

### 4.2 Popular games grid (all visitors)

**Popularity definition:** Count **distinct users** with a `library_entries` row for that `game_id` (“saves” / “in library”). **Sort:** descending save count; **tie-breakers:** (1) most recent `max(created_at)` or `max(updated_at)` among entries for that game, (2) title A–Z. Documented in [decisions](./decisions.md).

**Pagination:** Server-driven, e.g. **24** items per page; **page** query param for shareable URLs (`?page=2`). Controls at **bottom** of grid.

**Each game card / row displays:**

| Element | Requirement |
|---------|-------------|
| **Photo** | Cover (`games.coverUrl`) |
| **Name** | Title |
| **Saves** | Distinct user count; **bookmark icon** to the **left** of the number (decorative; number is the accessible stat) |
| **Rating line** | **Priority:** IGDB **aggregated_rating** (critic) when present — label **“Critic”**, star icon left; else **average** of non-null `library_entries.rating` for that game — label **“Players”**; else **“—”**. See [decisions](./decisions.md#5-explore--routing-semantics). |
| **Developer** | Developer name string (catalog extension; IGDB hydrate or “Unknown” for user-only games). |
| **Genres** | Row of **circular chips** or tight pills at **bottom** of card |

**Empty state:** After search/filters, zero results → message + **Clear filters** control.

---

### 4.3 Search and filters (Explore chrome)

**Scope:** Primary effect on the **popular grid** (carousel out of scope for v1 filter unless specified later).

**Search:** Debounced text input; match **game title** (minimum viable); summary/full-text optional later.

**Filters (v1 minimum):**

- **Genre** — multi-select from genres available in catalog (distinct from DB or cached IGDB taxonomy).
- **Sort / popularity:** **Most saved** (default), **Highest rated** (per [decisions](./decisions.md) rating priority for ordering), **Newest** (`games.releaseDate`).

**Deferred (document as phase 1.5+):** platform, release year range, “hide games already in my library” (requires auth).

---

## 5. Acceptance criteria (QA-oriented)

- Signed-out user never sees another user’s library data in the carousel; only empty state + discovery.
- Route circles reflect **completed** vs not using grayscale + checkmark rules above.
- Popular grid shows **save counts** consistent with DB aggregates for a known fixture set.
- Pagination changes URL or state predictably and does not reset filters without user action.
- Keyboard: search field and filter controls reachable; carousel scrollable via keyboard where applicable.

---

## 6. Non-goals and constraints

- **Performance:** Heavy aggregate queries may require indexes on `library_entries(game_id)` and optional materialized rollups; does not block PRD approval.
- **IGDB:** Genre, developer, critic ratings are **best-effort** from API; cache server-side; user-submitted games may show **Unknown** / partial metadata.
- **Analytics:** Optional product events (e.g. `explore_filter_changed`) — specify in analytics backlog, not blocking.

---

## 7. References

- Implementation order for APIs: [technical-design.md](./technical-design.md) (Explore section).
- Visual structure: [wireframes.md](./wireframes.md) (Explore / home).
