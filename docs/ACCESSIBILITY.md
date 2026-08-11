# Accessibility — WCAG 2.1 AA

## Target Standard

CompuTrain targets **WCAG 2.1 Level AA** compliance across all public-facing pages of the website.

---

## Running Accessibility Checks Locally

### Prerequisites

Install the required dev dependencies once:

```bash
cd website
npm install --save-dev axe-core puppeteer
```

### Start the dev server (or a production build)

```bash
# Development
npm run dev

# Or production build
npm run build && npm start
```

### Run the audit

```bash
# From the website/ directory
npm run a11y

# Against a specific base URL (e.g. staging)
BASE_URL=https://staging.computrain.example.com npm run a11y
```

The script checks five pages (`/`, `/courses`, `/verify`, `/legal/terms`, `/legal/privacy`), prints each violation with its impact level and help URL, and exits with code 1 if any **critical** or **serious** violations are found.

---

## Lighthouse CI (Automated)

A GitHub Actions workflow (`.github/workflows/lighthouse.yml`) runs on every pull request to `main` and enforces:

| Category       | Minimum score |
|----------------|--------------|
| Performance    | 80           |
| Accessibility  | 90           |
| Best Practices | 90           |
| SEO            | 90           |

Core Web Vital budgets (via `website/lighthouserc.js`):

| Metric                     | Budget   |
|----------------------------|----------|
| Largest Contentful Paint   | < 2500 ms |
| First Contentful Paint     | < 1800 ms |
| Cumulative Layout Shift    | < 0.1    |

Reports are uploaded as workflow artifacts and to temporary public storage for each run.

---

## Known Issues

None at this time.

---

## Keyboard Navigation Test Checklist

Run through this checklist manually on each release using only the keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys, Escape):

1. **Focus indicator visible** — every interactive element shows a clearly visible focus ring when focused.
2. **Tab order logical** — focus moves through the page in a reading-order sequence that matches the visual layout.
3. **Skip-to-content link** — a "Skip to main content" link appears as the first focusable element and works correctly.
4. **Navigation menu operable** — all top-level and dropdown/mobile menu items can be opened, navigated, and closed without a mouse.
5. **Forms completable** — all form fields, labels, error messages, and submit buttons are reachable and operable by keyboard alone.
6. **Modals and dialogs** — focus is trapped inside open modals; Escape closes the modal and returns focus to the trigger element.
7. **Interactive cards and links** — course cards and any linked tile components can be activated with Enter or Space.
8. **Accordion / expandable sections** — expand and collapse controls are keyboard-operable and announce state changes.
9. **No keyboard trap outside modals** — it is always possible to navigate away from any component using Tab or Shift+Tab.
10. **Page title and landmark regions** — each page has a descriptive `<title>`; `<main>`, `<nav>`, `<header>`, and `<footer>` landmarks are present and accessible via screen-reader shortcut keys.
