## 2024-05-20 - Added ARIA labels to icon-only navigation buttons
**Learning:** Interactive icon-only elements (such as header navigation buttons) must include `aria-label` attributes to ensure screen reader accessibility. Depending exclusively on the `title` attribute is insufficient.
**Action:** When adding `aria-label` to interactive icon-only elements that already possess a `title` attribute, bind both attributes to the exact same localized copy variable or equivalent text to ensure consistency between visual tooltips and screen reader announcements.
