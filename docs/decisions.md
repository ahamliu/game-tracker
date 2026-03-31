# Product decisions (locked)

This document resolves the open decisions from the Game list tracker PRD. It applies to MVP and should be referenced in UX and technical design.

## 1. Multi-list membership

**Decision:** One **library entry** per `(user, game)` pair. A **library entry** holds status, rating, notes, progress, and all **character routes** for that game.

**Custom lists** are **collections** that reference library entries (many-to-many). Adding a game to a list does not duplicate data: the user picks an existing library entry or creates it once, then assigns it to zero or more lists.

**Rationale:** Otome/VN players invest heavily in per-route data; duplicating entries across lists would fork routes and ratings. Collections match “Playing 2026”, “Backlog”, “Favorites” without conflicting state.

**Edge cases:**

- Removing a game from a custom list does not delete the library entry unless the user chooses “Remove from library”.
- A **default “All games”** (or “Library”) view shows every entry; custom lists are filters/subsets.

---

## 2. Progress representation

**Decision:** Two optional fields on each library entry:

| Field | Type | Notes |
|-------|------|--------|
| `progressPercent` | integer, 0–100, nullable | Optional slider or input; clear label “Story / overall progress”. |
| `progressNote` | short string, nullable | e.g. chapter, route name, or free text (“End of chapter 3”). |

**Not in MVP:** Hours played as a structured field (can be added later; users may put hours in `progressNote` or notes).

**Rationale:** Percent works across genres; `progressNote` covers VNs and otome where chapter labels matter more than a number.

---

## 3. Route limit (per library entry)

**Decision:** **Soft cap of 50** character routes per entry.

- UI shows a non-blocking warning when approaching or at the cap.
- Hard limit may be raised later; abuse is mitigated by storage quotas and rate limits.

**Rationale:** Covers extreme otome titles while bounding worst-case storage and UI complexity.

---

## 4. User-submitted games moderation

**Decision:** **Auto-approve** new user-submitted games on create, with:

- **Similar-title dedup** warning before submit (fuzzy match against API + local catalog).
- **Report** action on game pages (spam, duplicate, offensive title).
- **Admin/moderator queue** deferred to post-MVP unless abuse appears; schema reserves `submittedBy`, `reportCount`, and optional `moderationStatus` for future use.

**Rationale:** Keeps MVP friction low for niche titles; hybrid catalog depends on user submissions when IGDB misses a game.

---

## 5. Explore / routing semantics (home page)

**Cleared character route:** In Explore UI, a route is **cleared** when `character_routes.status === 'completed'`. Grayscale vs color + checkmark follows [prd-explore-home.md](./prd-explore-home.md). No new DB field.

**Popular games ranking:** **Popularity** = `COUNT(DISTINCT user_id)` over `library_entries` grouped by `game_id`. **Tie-break:** (1) latest activity — `MAX(library_entries.updated_at)` (or `created_at`) for that game descending; (2) title ascending.

**Rating display on Explore cards (priority):**

1. If IGDB **aggregated_rating** (critic) is stored on the game → show as **Critic** (e.g. `/100` scaled to stars or numeric per UI spec).
2. Else if at least one user rating exists → **average** of non-null `library_entries.rating` for that `game_id` → label **Players**.
3. Else show **—**.

**Highest rated sort:** Use the same composite score for ordering: prefer critic score when present, else user average, else nulls last.

---

## Summary table

| Topic | Choice |
|-------|--------|
| Lists | Library entry once per user per game; custom lists = many-to-many collections |
| Progress | `progressPercent` (0–100) + optional `progressNote` |
| Routes | Soft cap 50 per entry |
| User games | Auto-approve + dedup warning + report; mod queue later |
| Explore: cleared route | `status === 'completed'` |
| Explore: popularity | Distinct users per `game_id` on `library_entries` |
| Explore: rating on card | Critic (IGDB) → else Players (avg) → else — |
