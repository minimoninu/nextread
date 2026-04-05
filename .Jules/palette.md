## 2024-04-05 - Missing ARIA Labels on Header Icon Buttons
**Learning:** Icon-only buttons relying solely on the `title` attribute for tooltips lack explicit screen-reader support without an `aria-label`. Relying just on `title` is a common anti-pattern that assumes `title` natively provides sufficient accessible text in all contexts.
**Action:** When adding icon-only buttons, specifically verify both `aria-label` (for screen readers) and `title` (for visual tooltip on hover/focus) are present and match to ensure equal experiences for all users.
