## 2026-03-30 - Consistent ARIA Labels for Interactive Icons
**Learning:** Found multiple icon-only buttons (like Theme Toggle, Stats, Filters) that relied solely on visual context or the `title` attribute for accessibility. Relying only on `title` is insufficient for proper screen reader support.
**Action:** Consistently bind `aria-label` identically to the `title` attribute (using shared variables like `COPY.sanctuary.enter` when available) to synchronize the visual tooltip and the screen reader announcement.
