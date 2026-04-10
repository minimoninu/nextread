## 2024-04-10 - Header Icon Button Accessibility Pattern
**Learning:** The app's main navigation relies on icon-only action buttons that use `title` attributes for desktop tooltips but lack `aria-label` attributes for screen readers, leading to an inconsistent accessible experience.
**Action:** When adding or modifying interactive icon-only elements, always bind both `title` and `aria-label` to the exact same localized copy variable to ensure consistency between visual tooltips and screen reader announcements.
