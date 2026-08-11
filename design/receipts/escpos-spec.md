# BizBill — ESC/POS Receipt Printing Spec

Status: implementation-ready · Date: 2026-07-31
Source of truth: PRD Section 3 (3.4–3.6) and Section 2 (2.4–2.7).
Companion artifact: `receipts.html` (same folder) — pixel previews of every layout referenced here.
Audience: Android engineers implementing the receipt renderer (Kotlin, printing over Bluetooth SPP / USB).

All byte values are hex unless suffixed with `d`. Multi-byte length parameters (`pL pH`)
are little-endian: `value = pL + pH × 256`.

---

## 1. Printer assumptions & print-job lifecycle

| Property | 58 mm class | 80 mm class |
|---|---|---|
| Printable width | 48 mm = **384 dots** | 72 mm = **576 dots** |
| Dot density | 8 dots/mm (203 dpi) | 8 dots/mm (203 dpi) |
| Font A cell | 12 × 24 dots → **32 columns** | 12 × 24 dots → **48 columns** |
| Font B cell (optional) | 9 × 17/24 dots → 42 columns | 9 × 17/24 dots → 64 columns |
| Command dialect | Epson ESC/POS (incl. low-cost clones) | same |
| Cutter | usually none (tear bar) | usually auto-cutter |

Every print job MUST follow this lifecycle:

1. `ESC @` — initialize (resets fonts, alignment, line spacing, print modes).
2. `ESC t 00` — select code page CP437 (see §6; all BizBill receipt bytes are 7-bit ASCII).
3. Body — text lines and QR blocks per the mapping in §7.
4. `ESC d 04` — feed 4 lines clear of the tear bar / cutter.
5. `GS V 42 03` — partial cut with 3-dot feed (harmless no-op on cutterless 58 mm units).

The renderer is a pure function `(order, profile receipt template, paper width) → ByteArray`;
it runs fully offline (PRD §3 preamble). Send the ByteArray in chunks of ≤ 512 bytes with a
short (≈20 ms) inter-chunk delay on Bluetooth SPP — many 58 mm clones have no flow control
and drop bytes on large raster payloads.

---

## 2. Core command set (byte reference)

### 2.1 Initialization & code page

| Command | Bytes | Effect |
|---|---|---|
| `ESC @` | `1B 40` | Initialize printer, clear modes/buffers |
| `ESC t n` | `1B 74 n` | Select character code table; BizBill uses `n = 00` (CP437) |

### 2.2 Alignment — `ESC a n`

| Bytes | Effect |
|---|---|
| `1B 61 00` | Left justify (default; all tabular body lines) |
| `1B 61 01` | Center (shop header, Order No, QR symbols, footer) |
| `1B 61 02` | Right justify (not used — right alignment is done by space-padding, §5) |

Alignment applies per line; it also positions native `GS ( k` QR symbols on compliant
printers (some clones ignore it for graphics — see §4.2 for the centering-by-padding fallback).

### 2.3 Emphasis & character size

| Command | Bytes | Effect |
|---|---|---|
| `ESC E n` | `1B 45 n` | Emphasis (bold) off/on, `n = 00 / 01` |
| `ESC ! n` | `1B 21 n` | Master select: bit 0 = Font B, bit 3 (`08`) = emphasized, bit 4 (`10`) = double height, bit 5 (`20`) = double width, bit 7 (`80`) = underline |
| `GS ! n` | `1D 21 n` | Character size: low nibble = height multiplier − 1, high nibble = width multiplier − 1 |

`GS !` values used by BizBill:

| Bytes | Size | Used for |
|---|---|---|
| `1D 21 00` | 1×1 (normal) | everything not listed below |
| `1D 21 01` | 1× wide, 2× tall | **Order No line** (still 32 columns wide — `ORDER No: PRNT-0231` is 19 chars) |
| `1D 21 11` | 2× wide, 2× tall | **KOT Token No** (`TOKEN 042` = 9 chars ≤ 16-column double-width budget) |

Prefer `GS !` + `ESC E` over `ESC !` bit-twiddling; some clones reset unrelated attributes
on `ESC !`. Always restore `1D 21 00` and `1B 45 00` after the styled line.

### 2.4 Reverse (white-on-black) — `GS B n`

| Bytes | Effect |
|---|---|
| `1D 42 01` | Reverse print ON |
| `1D 42 00` | Reverse print OFF |

Used for the `** DUPLICATE **` banner (FR-3.20), the `PAID` chip that replaces QR #2 on
fully-paid bills (FR-3.18), and the `** DINE-IN ** / ** PARCEL **` flag on KOT tickets.
Pad the reversed text with one leading and trailing space so the black block has margins.
If a printer ignores `GS B` (rare), the text still prints in plain caps — acceptable degradation.

### 2.5 Feed & paper cut

| Command | Bytes | Effect |
|---|---|---|
| `LF` | `0A` | Print buffer and feed one line (terminates every text line) |
| `ESC d n` | `1B 64 n` | Print and feed `n` lines; use `1B 64 04` before cut |
| `GS V m` | `1D 56 00` / `1D 56 01` | Full / partial cut at current position |
| `GS V m n` | `1D 56 41 n` / `1D 56 42 n` | Feed `n` dots then full / partial cut |

BizBill standard: `1D 56 42 03` (function B, partial cut, 3-dot feed). Between the two
copies of a custom-order print (Customer Copy then Shop Copy), emit feed + cut so the
merchant can hand over copy 1 while copy 2 prints.

---

## 3. QR printing — native `GS ( k` (QR Code symbol, cn = 49)

All six functions share the frame `1D 28 6B pL pH cn fn [params]` with `cn = 31` (ASCII `'1'`,
QR Code). `pL pH` counts the bytes **after** `pH` (i.e. `cn fn params`). Epson documentation
numbers these Functions 165 / 167 / 169 / 180 / 181 / 182; the `fn` bytes actually transmitted
are `41 / 43 / 45 / 50 / 51 / 52` hex (65 / 67 / 69 / 80 / 81 / 82 decimal).

### 3.1 Function 165 — select model

```
1D 28 6B 04 00 31 41 n1 n2
```

| Byte | Value | Meaning |
|---|---|---|
| `pL pH` | `04 00` | 4 parameter bytes follow |
| `cn` | `31` | QR Code |
| `fn` | `41` (65d — Epson Function 165) | Select model |
| `n1` | `32` | Model 2 (always; Model 1 is legacy, Micro QR unsupported by ZXing scanners) |
| `n2` | `00` | Fixed |

### 3.2 Function 167 — module size

```
1D 28 6B 03 00 31 43 n
```

| Byte | Value | Meaning |
|---|---|---|
| `fn` | `43` (67d — Epson Function 167) | Set module size |
| `n` | `01`–`10` | Module edge length in printer dots |

BizBill values (1 dot = 0.125 mm):

| Symbol | 58 mm | 80 mm | Rationale |
|---|---|---|---|
| QR #1 Tracking (V4, 33 modules) | `n = 06` (0.75 mm module, ≈25 mm symbol) | `n = 08` (≈33 mm) | FR-3.16 verbatim: ≥ 6 dots/module |
| QR #2 Payment (V5–V8, 37–49 modules) | `n = 05` default; drop to `04` iff symbol would exceed 37 mm | `n = 06` | FR-3.19: cap symbol ≤ 37 mm on 58 mm. At `n=05`, V8 (49 modules) = 30.6 mm ✔ |

### 3.3 Function 169 — error correction level

```
1D 28 6B 03 00 31 45 n
```

| `n` | Level | Recovery |
|---|---|---|
| `30` | L | 7 % |
| `31` | **M — BizBill setting for both QRs** | 15 % |
| `32` | Q | 25 % |
| `33` | H | 30 % |

**Normative: BizBill prints both QR #1 and QR #2 at level M (`n = 31`).** The PRD fixes
level M explicitly (FR-3.16, FR-3.19): M survives typical thermal fade and Shop-Copy handling
while keeping QR #1 at Version 4 (33×33). Level H was evaluated and rejected — H pushes the
50-char tracking URL to Version 6 (41 modules) and the UPI link toward Version 10+, which at
the ≥6 dots/module floor no longer fits 58 mm paper. Do not "upgrade" the EC level.

### 3.4 Function 180 — store symbol data

```
1D 28 6B pL pH 31 50 30 d1 ... dk
```

| Byte | Value | Meaning |
|---|---|---|
| `pL pH` | `k + 3`, little-endian | `k` = payload byte count |
| `fn` | `50` (80d — Epson Function 180) | Store data in symbol buffer |
| `m` | `30` | Fixed |
| `d1..dk` | payload | Raw bytes, **no terminator, no quoting** |

Payloads (ASCII only, byte-exact):

| Symbol | Payload template | Sample (order PRNT-0231) | k | `pL pH` |
|---|---|---|---|---|
| QR #1 | `https://track.bizbill.app/t/{token}` | `https://track.bizbill.app/t/Kx9mQ2rTn8vWcE5uHb7dZa` | 50 | `35 00` |
| QR #2 | `upi://pay?pa={vpa}&pn={shop_name_urlenc}&am={balance_due}&tn={order_no}` | `upi://pay?pa=sharmaprinters@okhdfcbank&pn=Sharma%20Printers&am=834.00&tn=PRNT-0231` | 82 | `55 00` |

QR #2 rules (FR-3.17–3.19): `pn` is URL-encoded and capped at 25 characters before encoding;
`am` is the **current** `balance_due` formatted `NNNN.NN` (no thousands separator, `.` decimal);
regenerate on every reprint; never emit when `balance_due = 0`.

### 3.5 Function 181 — print stored symbol

```
1D 28 6B 03 00 31 51 30
```

`fn = 51` hex (81d — Epson Function 181), `m = 30`. Prints at the current position honoring `ESC a` centering.
The stored data survives until overwritten, so a reprint within the same job may re-issue
just this function — BizBill always re-stores anyway (stateless renderer).

### 3.6 Function 182 — transmit symbol size info (capability probe)

```
1D 28 6B 03 00 31 52 30
```

`fn = 52` hex (82d — Epson Function 182). The printer replies over the read channel with the symbol size/status.
Used once during **printer setup / test print**: if no reply arrives within 500 ms or the
reply is malformed, persist `native_qr = false` for that paired printer and use the raster
fallback (§4) for all QRs. Do not probe on every receipt (slow, and some clones wedge on
unknown commands mid-job).

### 3.7 Canonical byte sequences

QR #1, 58 mm Customer/Shop Copy (centered, model 2, 6-dot modules, EC M, 50-byte URL):

```
1B 61 01                                        center
1D 28 6B 04 00 31 41 32 00                      F165: model 2
1D 28 6B 03 00 31 43 06                         F167: module = 6 dots
1D 28 6B 03 00 31 45 31                         F169: EC = M
1D 28 6B 35 00 31 50 30 68 74 74 70 73 3A 2F   F180: store "https://track.bizbill.app/t/…"
2F 74 72 61 63 6B 2E 62 69 7A 62 69 6C 6C 2E          (50 data bytes total)
61 70 70 2F 74 2F ...token 22 bytes...
1D 28 6B 03 00 31 51 30                         F181: print
0A                                              feed
```

QR #2 differs only in F167 (`… 43 05`) and F180 (`pL = 55`, UPI payload).

### 3.8 Quiet zone & sizing

`GS ( k` prints the bare symbol — **it does not add the quiet zone**. Guarantee the
4-module quiet zone (FR-3.16) by (a) horizontal: centering on paper that is wider than
symbol + 2 × quiet (QR #1: 246 + 48 = 294 dots < 384 ✔), and (b) vertical: one blank line
(`0A`) before F181 and after the symbol. Never print text on the same baseline as a symbol.

| Symbol | Version | Modules | Module dots | Symbol size | + quiet (4 mod/side) |
|---|---|---|---|---|---|
| QR #1, 58 mm | 4 | 33 | 6 | 198 dots ≈ 24.8 mm | 246 dots ≈ 30.8 mm |
| QR #1, 80 mm | 4 | 33 | 8 | 264 dots ≈ 33.0 mm | 328 dots ≈ 41.0 mm |
| QR #2, 58 mm (worst V8) | 8 | 49 | 5 | 245 dots ≈ 30.6 mm | 285 dots ≈ 35.6 mm |
| QR #2, 80 mm (worst V8) | 8 | 49 | 6 | 294 dots ≈ 36.8 mm | 342 dots ≈ 42.8 mm |

---

## 4. Raster-bitmap fallback — `GS v 0`

For printers with `native_qr = false` (§3.6) — common on the cheapest 58 mm clones — QRs
are rendered on-device with ZXing into a monochrome bitmap and sent as a raster image.

### 4.1 Command

```
1D 76 30 m xL xH yL yH d1 ... dk
```

| Byte | Value | Meaning |
|---|---|---|
| `m` | `00` | Normal mode (01/02/03 = double width/height/both — unused; scale in the bitmap instead) |
| `xL xH` | bytes per row, little-endian | BizBill always sends **full-width rows**: 58 mm → `x = 48` (`30 00`); 80 mm → `x = 72` (`48 00`) |
| `yL yH` | dot rows, little-endian | e.g. QR #1 with quiet zone: 246 rows → `F6 00` |
| `d1..dk` | bitmap | `k = x × y` bytes; MSB = leftmost dot; `1` = black |

### 4.2 Bitmap composition (QR #1, 58 mm)

1. ZXing-encode the URL: Model 2, EC M → 33×33 boolean matrix (assert version 4).
2. Scale ×6 (6 dots/module) → 198 × 198.
3. Add 4-module (24-dot) white quiet zone on all sides → 246 × 246.
4. Center horizontally into a 384-wide row buffer: left pad = (384 − 246) / 2 = **69 dots**
   (centering is done in the bitmap because `ESC a` does not affect `GS v 0` on many clones).
5. Pack each 384-dot row into 48 bytes → header `1D 76 30 00 30 00 F6 00` + 11 808 data bytes.
6. Chunked send per §1.

The same routine renders QR #2 (module 5) and, at 80 mm widths, both symbols.

### 4.3 Two QRs on one row — 58 mm vs 80 mm (normative clarification)

The Section 3.6 ASCII sketch draws `[QR#1] [QR#2]` side by side. On 58 mm this is
**physically impossible** at the mandated sizes: 25 mm + ≈31–36 mm > 48 mm printable, and
shrinking below 6 dots/module violates FR-3.16. Therefore:

- **58 mm:** print QR #1 (caption `Scan to track` / `your order`) then QR #2 (caption
  `Scan to pay` / `Rs {balance_due}`) **stacked, each centered**, separated by one blank line.
- **80 mm (FR-3.20):** print both **side by side** as a single composed raster row
  (576 dots wide: QR #1 block left-centered in dots 0–287, QR #2 in 288–575), captions on
  the two-column text line beneath. Use raster composition even on native-QR printers —
  `GS ( k` can only print one centered symbol at a time.

`receipts.html` intentionally mirrors the ASCII sketch (side by side) as the visual design
reference; renderer behavior on 58 mm hardware is the stacked layout above.

---

## 5. Column budgets & line formats

### 5.1 Budgets

| Paper | Font A | Font B |
|---|---|---|
| 58 mm | **32 chars** | 42 chars |
| 80 mm | **48 chars** | 64 chars |

All BizBill templates are authored for Font A. Font B is not used in MVP (poor legibility
on faded thermal paper). Double-width text halves the budget (16 / 24 chars).

### 5.2 Two-column line helper

Every "label left, value right" line is built with:

```kotlin
fun twoCol(left: String, right: String, width: Int): String {
    val pad = width - left.length - right.length
    return if (pad >= 1) left + " ".repeat(pad) + right
    else left.take(width - right.length - 1) + " " + right   // truncate label, never the value
}
```

| Line | left | right | 58 mm (32) result | 80 mm (48): same call, `width = 48` |
|---|---|---|---|---|
| Copy label + datetime | `CUSTOMER COPY` | `31-07-2026 18:42` | `CUSTOMER COPY   31-07-2026 18:42` | wider gap, same fields |
| Subtotal | `Subtotal` | `1190.00` | `Subtotal                 1190.00` |〃 |
| Discount | `Discount (5%)` | `-59.50` | `Discount (5%)             -59.50` | 〃 |
| GST slab | `CGST @9%` | `101.74` | `CGST @9%                  101.74` | 〃 |
| Round off | `Round Off` | `+0.02` | `Round Off                  +0.02` | 〃 |
| Grand total | `TOTAL` | `Rs 1334.00` | `TOTAL                Rs 1334.00` | 〃 |
| Advance | `Advance Paid (UPI)` | `Rs  500.00` | `Advance Paid (UPI)   Rs  500.00` | 〃 |
| Balance | `BALANCE DUE` | `Rs  834.00` | `BALANCE DUE          Rs  834.00` | 〃 |
| Shop-copy header | `SHOP COPY` | `{shop_name[:10]}` | `SHOP COPY            SHARMA PRN` | full shop name fits |

Money in the `Rs` block is right-aligned as `"Rs " + amount.padStart(7)` so the rupee
figures of TOTAL / Advance / BALANCE line up (see sample above: `Rs 1334.00` vs `Rs  500.00`).
Receipt amounts never carry thousands separators (column budget); the app UI shows
`Rs 1,234.00` per PRD §3.1.

### 5.3 Item-row format

58 mm (matches the PRD §3.6 sample rows byte-for-byte):

| Columns | Width | Field | Alignment / rule |
|---|---|---|---|
| 1–14 | 14 | `item_name` | Left. If longer, wrap: continuation line indented 1 space, other cells blank |
| 15–19 | 5 | `qty` | Right-aligned ending col 19. Decimals up to 3 places (`0.750`) |
| 20–25 | 6 | `rate` | Right-aligned ending col 25. Minimal decimals: integer rupees print bare (`540`), else 2 dp (`0.90`) |
| 26–32 | 7 | `line_total` | Right-aligned ending col 32, always 2 dp |

Header row (verbatim): `Item            Qty  Rate   Amt`

80 mm adds the HSN/SAC column (FR-3.20):

| Columns | Width | Field |
|---|---|---|
| 1–18 | 18 | `item_name` |
| 19–25 | 7 | `hsn_sac` (right; blank if absent) |
| 26–31 | 6 | `qty` (right) |
| 32–39 | 8 | `rate` (right) |
| 40–48 | 9 | `line_total` (right) |

---

## 6. Character encoding

- **Everything BizBill prints is 7-bit ASCII.** Select `ESC t 00` (CP437) defensively at
  job start; ASCII renders identically on every code page, so clone code-page quirks are moot.
- **Currency is the ASCII string `Rs`, never `₹`** (U+20B9 has no slot in common thermal
  code pages; clones print garbage). This matches the PRD-wide "Rs" display rule.
- Strip/transliterate non-ASCII from merchant-entered strings before layout: NFKD-fold
  Latin diacritics; replace any remaining non-ASCII char with `?`. Shop names collected at
  onboarding are Latin-script in MVP.
- Devanagari / regional-script receipts are out of MVP scope. When added, render text lines
  on-device (Android canvas) and print via `GS v 0` raster — do not attempt printer-resident
  multilingual fonts.
- QR payloads are pure ASCII by construction (URL-safe base64 token; URL-encoded UPI link),
  so byte count = char count in §3.4.

---

## 7. Field-by-field mapping — Customer Copy (58 mm custom order)

Renders the FR-3.6/3.7-computed order. `{rule}` = 32 × `2D` (`-`) + `0A`. Every text line ends `0A`.
Sample values are order `PRNT-0231` as shown in `receipts.html`.

| # | Receipt element | Placeholder(s) | Command bytes around the text | Conditions / notes |
|---|---|---|---|---|
| 1 | Job init | — | `1B 40` `1B 74 00` | Once per job |
| 2 | Top rule | — | `{rule}` | |
| 3 | Shop name | `{shop_name}` | `1B 61 01` `1B 45 01` text `0A` `1B 45 00` | Uppercase; centered block starts here |
| 4 | Address | `{shop_address}` | text `0A` | Single line, ≤ 32 chars (wrap at comma if longer) |
| 5 | Phone | `Ph: {shop_phone}` | text `0A` | |
| 6 | GSTIN | `GSTIN: {gstin}` | text `0A` | **Omit line entirely when merchant has no GSTIN** (FR-3.4) |
| 7 | Rule | — | `{rule}` | |
| 8 | Copy label + datetime | `{copy_label}`, `{created_at:dd-MM-yyyy HH:mm}` | `1B 61 00` twoCol(...) `0A` | `CUSTOMER COPY` / `SHOP COPY` |
| 9 | DUPLICATE banner | — | `1B 61 01` `1D 42 01` ` ** DUPLICATE ** ` `1D 42 00` `0A` + `Reprint: {now:dd-MM-yyyy HH:mm}` `0A` | **Reprints only** (FR-3.20); QR #2 below regenerates with current `balance_due` (FR-3.18) |
| 10 | Blank line | — | `0A` | |
| 11 | Order No (large) | `ORDER No: {order_no}` | `1B 61 01` `1D 21 01` `1B 45 01` text `0A` `1B 45 00` `1D 21 00` | Double height, normal width — 19 chars fits 32-col budget |
| 12 | Rule | — | `1B 61 00` `{rule}` | Left-justified from here down |
| 13 | Item header | — | `Item            Qty  Rate   Amt` `0A` | Verbatim |
| 14 | Item rows × N | `{item_name}` `{qty}` `{rate}` `{line_total}` | per §5.3 `0A` | e.g. `Visiting Cards  500  0.90 450.00` |
| 15 | Rule | — | `{rule}` | |
| 16 | Subtotal | `{subtotal}` | twoCol(`Subtotal`, amt) `0A` | Σ line totals after line discounts (FR-3.6 step 2) |
| 17 | Bill discount | `{bill_discount_label}` `{bill_discount_value}` | twoCol(`Discount (5%)`, `-59.50`) `0A` | Omit when zero; % discounts also show computed rupee value (FR-3.2) |
| 18 | GST slab lines × slab | `{cgst_amt}` `{sgst_amt}` per `gst_rate` | twoCol(`CGST @9%`, `101.74`) `0A` etc. | Only when GSTIN saved (FR-3.4); one CGST+SGST pair per rate slab (FR-3.6 step 5); half of `gst_rate` each |
| 19 | Round off | `{round_off}` | twoCol(`Round Off`, `+0.02`) `0A` | Signed, omit when zero (FR-3.5) |
| 20 | TOTAL | `{total_amount}` | `1B 45 01` twoCol(`TOTAL`, `Rs 1334.00`) `0A` `1B 45 00` | Bold |
| 21 | Advance | `{advance_paid}` `{advance_method}` | twoCol(`Advance Paid (UPI)`, `Rs  500.00`) `0A` | Custom orders; method from latest advance payment row (FR-3.8) |
| 22 | Balance | `{balance_due}` | `1B 45 01` twoCol(`BALANCE DUE`, `Rs  834.00`) `0A` `1B 45 00` | Bold; computed, never stored editable (FR-3.7) |
| 23 | Rule | — | `{rule}` | |
| 24 | QR #1 + caption | `{tracking_url}` | §3.7 sequence, then `1B 61 01` `Scan to track` `0A` `your order` `0A` | Always printed, both copies (FR-3.15) |
| 25 | QR #2 + caption | `{upi_link}` | §3.7 sequence (module 5), then `Scan to pay` `0A` `Rs {balance_due}` `0A` | **Only when `balance_due > 0`.** Else print `1D 42 01` ` PAID ` `1D 42 00` `0A` in its place (FR-3.18). 58 mm: stacked under QR #1 (§4.3) |
| 26 | Rule | — | `{rule}` | |
| 27 | Ready-by | `Ready by: {due_at:dd-MM-yyyy h:mm a}` | `1B 61 01` text `0A` | Omit when no due date set |
| 28 | Footer | `{footer_message}` | text `0A` | Default `Thank you! Visit again.`; merchant-overridable via profile receipt template (FR-2.13) |
| 29 | Bottom rule | — | `{rule}` | |
| 30 | Feed + cut | — | `1B 64 04` `1D 56 42 03` | Then the Shop Copy job follows for custom orders (FR-3.20) |

---

## 8. Variant deltas (vs the Customer Copy mapping)

**Shop Copy (58 mm):** rows 3–6 collapse to twoCol(`SHOP COPY`, first 10 chars of shop name);
Order No block identical (row 11); then `Created:` / `Due:` lines; `JOB SPECS` section printed
from the field pack — every field with `show_on_shop_copy = true` (FR-2.4) as
`{label_or_item} x{qty}` + 1-space-indented ` - {detail}` lines; `NOTES:` free text (wrapped at
32, continuation indented 1); price breakup is **only** `Balance Due: Rs {balance_due}` (bold);
QR #1 with caption ` Scan in app to update status`; **no QR #2** (FR-3.18: Customer Copy only).

**Quick-sale receipt:** single copy; copy label `CASH MEMO`; Bill No line bold, normal size;
no advance/balance rows when paid in full — instead `Paid via {method}` + reversed ` PAID `
chip; tax-inclusive shops print `(Prices incl. of GST)` + `Taxable Value` line before the slab
lines; QR #1 caption `Scan for your e-bill` (PRD §3.6); QR #2 only for CREDIT_LEDGER credit
sales with `balance_due > 0`. Kirana profile: Tracking QR off by default, per-order toggle
prints it and switches the order to the custom-order lifecycle (FR-2.6).

**KOT ticket:** header twoCol(`KOT`, datetime) + centered shop name; Token No via
`1B 61 01` `1D 21 11` `TOKEN {token:%03d}` `0A` `1D 21 00`; reversed dine-in/parcel flag;
`Order No: {order_no}` (never resets, unlike the daily token); item lines
`{qty} x {item_name} ({variant})` bold with add-on/instruction lines indented 4 (`+` add-ons,
`-` instructions); `Items: {count}`; **no prices, no totals, no QRs** (FR-2.8). Routed to the
second printer when configured, else appended after the customer receipt on the same printer.

**80 mm (any variant):** width 48, item rows per §5.3 80 mm format (HSN column), QR modules
per §3.2, two QRs side by side per §4.3.

---

## 9. Decisions & open items

| # | Decision | Rationale |
|---|---|---|
| D1 | EC level **M** for both QRs, not H | PRD FR-3.16/3.19 mandate M; H inflates version past the 58 mm size budget at ≥ 6 dots/module (§3.3) |
| D2 | 58 mm prints the two QRs stacked; side-by-side is 80 mm-only | Geometry: 25 mm + ≥30 mm > 48 mm printable (§4.3) |
| D3 | Raster fallback decided once per paired printer via F182 probe at setup, persisted as `native_qr` | Avoids per-receipt probing latency and clone lock-ups (§3.6) |
| D4 | Reprints add a `Reprint: {timestamp}` line under the DUPLICATE banner | PRD specifies only the banner; the timestamp aids dispute handling and costs one line |
| D5 | Rate column prints integer rupees without `.00` | Matches PRD sample rows (`540`, `200`) and keeps the 6-char budget for 4-digit rates |
| D6 | ASCII-only output, `Rs` not `₹`, CP437 selected defensively | Clone code-page reliability (§6) |
| Open | IGST layout (inter-state) | Out of MVP per FR-3.3; revisit with Section 10 open questions |
| Open | Ledger-statement print format (CREDIT_LEDGER, §2.4) | Separate artifact; reuses §5 line helpers |
