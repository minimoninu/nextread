## 2024-03-25 - [Add ARIA labels to Icon-only Action Buttons]
**Learning:** React component icon-only buttons with tooltip \`title\`s are inaccessible to screen readers. For consistent accessibility, we must ensure both \`title\` and \`aria-label\` are present.
**Action:** Always map both attributes, often to the same localized strings (e.g., \`COPY.sanctuary.exit\`).
