# META (FACEBOOK / INSTAGRAM) APP REVIEW — PREPARATION CHECKLIST

**Business:** InfluFunnel (social-media post scheduling SaaS)
**Purpose:** Get approval to publish/schedule posts to customers' Facebook Pages & Instagram accounts
**Prepared for:** Chartered Accountant + business owner
**Date printed:** ____________________

> ⚠️ NOTE: Meta changes these requirements often. Treat this as a preparation
> guide. The **live Meta App Dashboard at time of submission is the final
> authority.** Cross-check there before submitting.

---

## THE TWO SEPARATE APPROVALS (both required)

| # | Process | What it proves | Who mainly handles it |
|---|---------|----------------|------------------------|
| 1 | **Business Verification** | Your company is a real, registered legal entity | **CA / accountant** (documents) |
| 2 | **App Review** | Each app permission is used legitimately | **Developer / owner** (technical) |

Business Verification usually must be completed FIRST — it unlocks the
permissions needed for App Review.

---

# PART A — BUSINESS VERIFICATION (CA's primary task)

Meta requires **TWO proofs**: (1) legal name, (2) address + phone.
A single document (e.g. a business bank statement) can sometimes satisfy both.

## A1. Proof of LEGAL BUSINESS NAME — provide at least ONE:
- [ ] **GST Registration Certificate**  ← recommended, easiest for India
- [ ] Certificate of Incorporation / Company Registration (if Pvt Ltd / LLP)
- [ ] Business PAN Card
- [ ] Udyam / MSME Registration Certificate
- [ ] Shop & Establishment License
- [ ] Partnership Deed (if partnership firm)

## A2. Proof of ADDRESS + PHONE — provide at least ONE:
- [ ] **Business Bank Statement** (recent, ≤ 3 months)  ← often covers BOTH A1 & A2
- [ ] Utility bill in the business name (electricity / telephone / internet)
- [ ] Government-issued correspondence showing business name + address
- [ ] Rent/lease agreement for business premises (if asked)

## A3. TRUST SIGNALS — these make or break approval (confirm all):
- [ ] **Business phone number** that is REAL (a landline/mobile — NOT a VoIP /
      virtual number). Should ideally appear on the documents AND the website.
- [ ] **Company website on your OWN domain** (e.g. influfunnel.com) that is LIVE
      — Meta guides call this near-mandatory; very hard to pass without it.
- [ ] **Domain email address** (e.g. admin@influfunnel.com) —
      ❌ do NOT use gmail.com / yahoo.com (major red flag / common rejection).
- [ ] **Name, address, and phone MATCH** across: documents ↔ website ↔ Meta
      Business Manager account. Mismatches cause rejection.

## A4. Meta Business Manager account:
- [ ] A Meta Business Manager account created at business.facebook.com
- [ ] Business legal name, address, phone entered EXACTLY as on the documents
- [ ] Documents uploaded as clear scans / PDFs (not blurry phone photos)

---

# PART B — TECHNICAL SETUP (Developer / owner)

- [ ] Meta Developer account (developers.facebook.com)
- [ ] Meta App created (type: **Business**)
- [ ] App ID + App Secret generated and stored securely (in server env vars)
- [ ] App icon uploaded
- [ ] App category set
- [ ] **Privacy Policy URL** live and reachable (Terms + Privacy pages)
- [ ] **Data Deletion callback** URL configured
- [ ] OAuth redirect / callback URL set to the production backend URL
- [ ] Domain verified in Meta (Facebook Domain Verification — separate from
      Business Verification; confirms you own the website)
- [ ] Facebook Login for Business product added to the app
- [ ] (If Instagram) Instagram linked + an IG Business/Creator account for testing

---

# PART C — APP REVIEW SUBMISSION (per permission)

## C1. Permissions to request (POST SCHEDULING ONLY — the light version):

**Facebook Pages:**
- [ ] `pages_show_list`        (list the user's Pages)
- [ ] `pages_manage_posts`     (publish the post — the core one)
- [ ] `pages_read_engagement`  (required dependency)
- [ ] `business_management`    (reach Business-Manager-owned Pages)

**Instagram (only if launching with IG too):**
- [ ] `instagram_basic`
- [ ] `instagram_content_publish`

> NOTE: Comment auto-reply, analytics, and DM automation permissions are NOT
> in this list — they are added LATER as a separate submission. Keeping this
> submission to publishing-only makes approval faster and easier.

## C2. For EACH permission, prepare:
- [ ] A clear, DETAILED use-case description (vague text = #1 rejection cause)
- [ ] A screencast video showing the full flow:
      log in → connect a Page → schedule/publish a post → show the result
- [ ] Test login credentials for YOUR app's dashboard (a non-admin test account)
      ❌ NEVER include the actual Facebook/Instagram account passwords
- [ ] Step-by-step reviewer instructions (how to log in and reproduce the flow)

## C3. Final pre-submission checks:
- [ ] Data Handling questions answered (what data you collect + how you process)
- [ ] Privacy Policy linked in App Settings
- [ ] App is in the correct mode and permissions set to "Advanced Access"
- [ ] Tested end-to-end with your OWN page in Development mode (works for up to
      25 test users with NO review — validate everything first)

---

# DOCUMENT SHORTLIST (what to physically gather for the CA)

1. [ ] GST Registration Certificate
2. [ ] Business Bank Statement (recent)
3. [ ] Business PAN Card
4. [ ] Certificate of Incorporation / Udyam / Shop & Est. (whichever applies)
5. [ ] Proof the business phone number is real and non-VoIP
6. [ ] Website domain details + domain email address
7. [ ] Any utility bill / lease in the business name (backup address proof)

> The single strongest combo for India:
> **GST Certificate + Business Bank Statement + live website on own domain +
> domain email — all with matching name, address & phone.**

---

# REALISTIC TIMELINE & NOTES

- [ ] Business Verification: typically a few days to ~2 weeks
- [ ] App Review (publishing permissions): usually days to ~2 weeks
- [ ] Rejections are NORMAL — usual causes: vague use-case text, missing demo
      video, no privacy policy, non-domain email, or mismatched details.
- [ ] You can TEST everything with your own pages TODAY in Development mode
      without any review — only real customers require full approval.

**Common rejection reasons to avoid:**
- [ ] Vague permission use-case descriptions
- [ ] Missing / unclear screencast
- [ ] Gmail/Yahoo email instead of a domain email
- [ ] No live website
- [ ] Name / address / phone mismatch across documents & accounts
- [ ] VoIP / virtual phone number

---

*This checklist is a preparation aid, not official Meta documentation. Always
verify current requirements in the live Meta App Dashboard and Meta Business
Help Center before submitting.*
