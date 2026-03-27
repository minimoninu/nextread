## 2024-03-27 - Icon Button Accessibility

**Learning:** When using dual labels (`title` for tooltips and `aria-label` for screen readers) on interactive icon-only elements in this app, binding both to the exact same localized copy variable (e.g., `COPY.sanctuary.exit`) ensures consistency and maintainability across both visual tooltips and screen reader announcements.
**Action:** Always verify if an icon-only button uses `title`. If it does, ensure there is an identically-bound `aria-label`. If it doesn't, add both `title` and `aria-label` matching the localized text variable.
