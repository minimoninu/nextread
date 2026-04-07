## 2024-04-06 - Initial Setup
## 2024-04-06 - Icon-Only Button Accessibility Pattern
**Learning:** Icon-only buttons often rely exclusively on `title` attributes for tooltips, which are insufficient for screen readers without a corresponding `aria-label`.
**Action:** When adding `title` for visual tooltips on interactive icon-only elements, consistently bind both `title` and `aria-label` to the exact same localized string to ensure unified accessibility across visual and assistive experiences.
