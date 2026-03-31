# Social features: phased scope (MAL-like)

Breakdown of **MVP+**, **Next**, and **Later** with explicit screens, data surfaces, and **notification** scope. Aligns with the Game list tracker PRD.

---

## MVP+ (first social slice — ship after core library + routes)

**Goal:** Public discovery of people and lists; lightweight graph (follow); minimal activity visibility.

### Screens (must ship)

| Screen | Route (example) | Purpose |
|--------|-----------------|--------|
| Public profile | `/u/:handle` | Avatar, display name, bio, follower/following counts, **tab or section: Public lists** |
| Public list view | `/u/:handle/lists/:slug` | Read-only list contents (respect list visibility) |
| Followers / Following | `/u/:handle/followers`, `/u/:handle/following` | Paginated lists of users |
| Settings → Privacy | `/settings/privacy` | Default list visibility; profile discoverability toggle if needed |

### Behaviors

- **Follow:** One-way follow (no mutual requirement). Optional copy: “Follow” vs “Subscribe to activity.”
- **Activity (minimal):** A simple **activity log** on the profile (chronological): e.g. “Completed *Game Title*”, “Started *Game Title*”, “Rated *Game Title* 8/10”. No global home feed in MVP+.
- **Visibility:** Lists: public | unlisted | private (per list). Only **public** lists appear on profile for others; **unlisted** is link-only.

### Notifications (MVP+)

| Event | In-app | Email | Push |
|-------|--------|-------|------|
| New follower | Optional badge on bell icon | Off by default | Out of scope |
| (Future prep) | Bell dropdown stub OK | — | — |

**Decision:** **Single optional in-app notification center** (bell): “X followed you.” Email digest **off** for MVP+. No push.

---

## Next (social depth)

**Goal:** Richer engagement without full recommendation engine.

### Screens

| Screen | Purpose |
|--------|--------|
| **Home / Feed** | `/home` — aggregated activity from followed users (configurable: all vs highlights) |
| **Game community (light)** | On game detail: “Friends who played” or “People you follow” (if privacy allows) |
| **Comments (optional product decision)** | Comments on **public list** or **profile** — only if moderation plan exists |

### Behaviors

- **Friend requests vs follow:** Either **keep one-way follow only** (simpler) or add **mutual friends** — product call: default recommendation is **one-way follow** + **close friends** list later.
- **Feed filters:** By activity type (completed, rated, list created).
- **Blocking:** Block user → removes follow relationship and hides their content.

### Notifications (Next)

| Event | In-app | Email | Push |
|-------|--------|-------|------|
| New follower | Yes | User opt-in | Optional web push |
| Followed user completed a game | Yes (digest) | Daily/weekly opt-in | Optional |
| Mention (if comments) | Yes | Opt-in | Optional |
| Report outcome (if moderation) | Yes | Optional | — |

**Digest model:** Reduce noise — default **batched** “5 updates from people you follow” rather than per-event email.

---

## Later (growth + recommendations)

**Goal:** Retention and discovery at scale.

### Surfaces

- **Recommendations:** “Because you liked X…” using collaborative filtering or tags (analytics-dependent).
- **Seasonal / charts:** Community stats, trending games — requires aggregate queries and cache.
- **Groups/clubs (optional):** Shared lists or forums — large scope; treat as separate initiative.

### Notifications (Later)

- Personalized recommendation alerts (opt-in only).
- Weekly summary: your progress + friend activity.

---

## Cross-phase requirements

- **Privacy:** Respect list visibility on every API; never leak private entries in activity or feed.
- **Rate limits:** Follow, post activity, and notification fanout must be rate-limited server-side.
- **Consistency:** Activity events emitted from library entry changes (status, rating, completion) with stable event schema for feed + notifications.

---

## Summary

| Phase | Screens | Notifications |
|-------|---------|----------------|
| **MVP+** | Public profile, public list, followers/following, privacy settings | In-app: new follower only (optional); no email default |
| **Next** | Home feed, richer game social, optional comments | In-app + opt-in email digest; optional web push |
| **Later** | Recommendations, charts, optional clubs | Opt-in personalized + weekly summary |
