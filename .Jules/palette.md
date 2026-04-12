## 2024-04-12 - Icon-only buttons accessibility
**Learning:** Found several icon-only buttons in the main navigation and modal exit components that rely solely on the `title` attribute without an `aria-label`. This pattern prevents screen reader users from effectively understanding the button's purpose while relying only on a tooltip.
**Action:** Always add an `aria-label` to icon-only buttons, especially when they act as critical navigation toggles or close buttons, ensuring the `aria-label` matches the `title` text where applicable to provide consistent visual and screen-reader guidance.
