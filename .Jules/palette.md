## 2024-04-17 - Icon Button Accessibility
**Learning:** Depending exclusively on the `title` attribute for icon-only buttons is insufficient for optimal accessibility. Several icon buttons in the header were missing `aria-label`, and some were missing both. Screen readers do not consistently read `title` predictably.
**Action:** Always include both `aria-label` (for screen readers) and `title` (for desktop users) on interactive icon-only elements, and bind both to the exact same localized string variable to ensure consistency between visual tooltips and screen reader announcements.
