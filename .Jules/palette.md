## 2024-05-15 - Interactive Icon Accessibility
**Learning:** This app frequently relies on 'title' attributes for icon-only buttons instead of 'aria-label', which degrades the screen-reader experience. Specifically, the top navigation icons (Sanctuary, Theme Toggle, Today Mode, Stats, Authors) are missing 'aria-label'.
**Action:** Always add 'aria-label' matching the 'title' attribute to all interactive icon-only elements.
