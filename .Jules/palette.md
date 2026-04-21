## 2024-05-24 - Icon Button Accessibility
**Learning:** Relying only on `title` attributes for icon-only buttons is insufficient for optimal accessibility. Screen readers need `aria-label` to announce the button's purpose, while desktop users benefit from the visual tooltip provided by `title`.
**Action:** Always include both `aria-label` and `title` on interactive icon-only elements, binding them to the exact same localized copy variable to ensure consistency.
