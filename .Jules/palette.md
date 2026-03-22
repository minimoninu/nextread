## 2026-03-22 - Floating Button Accessibility
**Learning:** Relying solely on the title attribute for floating icon-only buttons (like a close/exit action) is insufficient for screen readers and creates an inaccessible experience.
**Action:** Always pair title with an explicitly bound aria-label, preferably reusing identical content (e.g., localized copy variables) to ensure both desktop hover and screen reader announcements convey the same exact purpose.
