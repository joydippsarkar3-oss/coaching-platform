# Accessibility — CompuTrain Website

## Target standard

WCAG 2.1 Level AA.

## Fixes applied in this pass

### `components/home/HeroSection.tsx`
- Added `aria-hidden="true"` to the `ShieldCheck` badge icon and the `ArrowRight` CTA icon (both decorative).
- Added `aria-hidden="true"` to the hero image placeholder `<div>` so its development-only placeholder text is not read by screen readers.

### `components/shared/EnquiryForm.tsx`
- Added `role="status"` to the success confirmation `<div>` so screen readers announce it when the form is replaced after successful submission.
- No label/`htmlFor` fixes needed: the `Input` component already derives `id` from `name` and renders an associated `<label htmlFor>`. Error messages are already linked via `aria-describedby` and `aria-invalid` inside that component. The submission error already uses `role="alert"`.

### `app/components/typing/TypingPractice.tsx`
- Added `aria-live="polite"` and `aria-atomic="true"` to the live-stats container (WPM, Accuracy, Backspace count) so screen readers announce updates during the test without interrupting typing.
- The textarea already carries `aria-label="Typing input (use keyboard)"` and is exposed to assistive technology (`aria-hidden="false"`); no change needed there.

### `components/verify/CertificateResult.tsx`
- Added `role="status"` to the valid/invalid banner so the certificate result is announced to screen readers when it renders.
- Added `aria-hidden="true"` to the `ShieldCheck` and `ShieldX` icons (decorative; the adjacent text already conveys the status).

### `app/verify/[certNo]/page.tsx`
- No changes. This page is a server-side redirect (`redirect()`) that renders no HTML; there are no accessibility issues.

## Known remaining issues

- **Translation strings**: CTA labels (`ctaPrimary`, `ctaSecondary`) and form field labels come from `next-intl` translation keys. Their actual text values are not in scope here; ensure they are descriptive and not generic strings like "Learn More" or "Click here".
- **`Input` component `required` attribute**: The spread passes HTML `required`, which browsers expose as `aria-required="true"` implicitly. If strict WCAG tooling flags the absence of an explicit `aria-required` attribute, add it to the `Input` component alongside the existing `required` spread.
- **Focus ring on `sr-only` textarea (TypingPractice)**: The textarea is visually hidden via `sr-only`. Keyboard focus lands on it but is invisible; users navigate by clicking the passage div or via the hint text. Consider adding a visible focus outline on the wrapping passage `<div>` when the textarea is focused (e.g., via a `focus-within` ring).
- **Color contrast**: Brand and danger/success palette colours have not been audited for contrast ratios in this pass. Run axe or Colour Contrast Analyser against the final colour tokens.
- **Result modal focus management (TypingPractice)**: The `ResultModal` dialog does not move focus inside itself on open, nor trap focus. Consider using a focus-trap library or the native `<dialog>` element.

## How to test

### axe DevTools (browser extension)
1. Install the [axe DevTools extension](https://www.deque.com/axe/devtools/) for Chrome or Firefox.
2. Open the page under test, open DevTools, and select the **axe DevTools** panel.
3. Click **Scan ALL of my page**. Review and resolve every violation before shipping.

### Keyboard-only navigation checklist
- [ ] Tab through the entire page without a mouse. Every interactive element (links, buttons, inputs) must receive a visible focus indicator.
- [ ] Activate all buttons and links with Enter / Space.
- [ ] On the Enquiry Form: tab to each field, verify the label is announced, fill it in, submit — confirm the success message is announced.
- [ ] On the Typing Practice page: tab to the passage area, start typing, confirm WPM/Accuracy updates are announced by a screen reader (e.g., NVDA + Firefox or VoiceOver + Safari).
- [ ] On the Verify page: submit a certificate number, confirm the valid/invalid result is announced.
- [ ] Confirm no focus is trapped anywhere unintentionally (except inside the result modal while it is open).
