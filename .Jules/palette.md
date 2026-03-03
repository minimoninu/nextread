## 2026-03-03 - Adding ARIA labels to Icon Buttons
**Learning:** Found that the top navigation icon buttons relied solely on `title` for context. Screen readers heavily rely on `aria-label` for elements that have no text content, and many users might not hover to see a `title`. Explicitly adding `aria-label` matching the `title` is a crucial a11y enhancement for icon-only navigational structures.
**Action:** Always ensure icon-only buttons have an `aria-label` alongside or instead of just `title` for full accessibility support.
