## 2024-04-25 - Consistent ARIA labels for icon-only buttons
**Learning:** Found multiple icon-only utility buttons in the header (Sanctuary mode, Theme toggle, Today mode, Stats, Authors, Filters) that used the `title` attribute for visual tooltips but lacked `aria-label`s for screen readers. Using `title` alone isn't consistently announced by all screen readers across all contexts.
**Action:** Always add `aria-label` matching the `title` text for icon-only buttons to ensure consistent screen reader announcements while preserving the visual tooltip behavior.
