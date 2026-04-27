## 2024-05-16 - Accessible Icon-Only Buttons
**Learning:** Many icon-only buttons in the application header had a `title` attribute for visual tooltips but lacked an `aria-label`. The Filters button was missing both. This pattern creates inconsistent accessibility experiences.
**Action:** Ensure all interactive icon-only elements have both `title` and `aria-label` bound to the exact same text or localized variable (e.g., `COPY.sanctuary.enter`) so that screen reader announcements match visual tooltips.
