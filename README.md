# Forex Trading Roadmap

A self-hosted, interactive learning tracker: 17 modules / 94 sourced forex
concepts, a dedicated "Pro Tools" quick-access page, Google sign-in, and
progress that syncs to MongoDB when you're signed in (or just lives in the
browser as a guest).

Stack: **Next.js 14 (App Router, plain JavaScript)**, **MongoDB** (via
`next-auth`'s MongoDB adapter + a small `progress` collection), **NextAuth.js
with Google as the only provider**. No Tailwind, no TypeScript — one
hand-written stylesheet and plain `.js`/`.jsx` files, to keep the project easy
to read and edit.

> **A note on how this was built:** I wrote every file by hand and
> syntax-checked the whole project (JSX parsing + all internal `@/...` import
> paths) with the TypeScript compiler in `--checkJs false` mode, but I could
> **not** run a live `npm install` or `npm run build` in the sandbox I built
> this in — outbound network access to the npm registry was blocked there.
> The code follows standard, current NextAuth v4 + MongoDB adapter patterns,
> but please run `npm install && npm run dev` locally as your first real
> smoke test, and open an issue-to-yourself (or just ping me back) if
> anything doesn't line up with the dependency versions npm resolves for you.

---

## 1. What you get

- **`/`** — the full roadmap: 17 modules, 94 concepts, each with a one-line
  explanation and a real source link. Filter by level, search, and a
  "ticker" bar across the top shows progress per module at a glance.
- **`/tools`** — every broker, platform, calendar, calculator, journaling
  tool, algo-trading resource, and prop-firm link pulled out into one
  quick-access page ("getting started with professional trading tools").
- **Google sign-in** (only) via NextAuth — signed-in progress is stored in
  MongoDB; signed-out ("guest") progress is stored in `localStorage` on that
  device. The first time you sign in, any guest progress on that browser is
  automatically copied into your account.
- **Donate button** in the footer — opens a small modal with your M-Pesa
  number (`0706258077`) and a "Send Money" walkthrough, plus a copy button.
  This is intentionally a **static instructions modal, not a live payment
  integration** — a personal phone number can only receive manual "Send
  Money" payments; there's no way to automate that without a registered
  M-Pesa **business** till/paybill and Safaricom's Daraja API (see §6 if you
  want to upgrade to that later).

---

## 2. Prerequisites

- [Node.js 18.18+](https://nodejs.org/) and npm
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
- A [Google Cloud](https://console.cloud.google.com/) project for OAuth
  credentials
- A [Vercel](https://vercel.com/) account (free tier is enough) + a
  [GitHub](https://github.com/) account to push this code to

---

## 3. Local setup

```bash
# 1. Unzip, then install dependencies
cd forex-roadmap
npm install

# 2. Copy the env template and fill it in (see §4 and §5 below)
cp .env.example .env.local

# 3. Run it
npm run dev
```

Open http://localhost:3000 — the roadmap works immediately even before you
configure Mongo/Google (you'll just be in guest mode with no working sign-in
button yet).

---

## 4. MongoDB Atlas setup

1. Create a free cluster at Atlas (the M0 free tier is enough).
2. **Database Access** → add a database user with a username/password.
3. **Network Access** → add `0.0.0.0/0` (allow access from anywhere) so
   Vercel's serverless functions can reach it. (You can lock this down later
   with Atlas's Vercel integration if you want.)
4. **Connect** → "Drivers" → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
5. Paste it into `.env.local` as `MONGODB_URI`. You don't need to put a
   database name in the URI — the app always uses a database called
   `forex_roadmap` inside your cluster, and creates it automatically on
   first sign-in.

Once someone signs in for the first time, Atlas will show four collections
under `forex_roadmap`: `users`, `accounts`, `sessions` (all managed
automatically by NextAuth), and `progress` (this app's own roadmap-checkbox
data, one document per user).

---

## 5. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create
   a project (or use an existing one).
2. **APIs & Services → OAuth consent screen** — set it up as "External",
   fill in the required fields, and add your own Google account as a test
   user while it's not yet published.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   → Application type: **Web application**.
4. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google
   ```
   (Add the production one once you know your Vercel URL — you can edit
   this later.)
5. Copy the generated **Client ID** and **Client Secret** into `.env.local`
   as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. Generate `NEXTAUTH_SECRET` with:
   ```bash
   openssl rand -base64 32
   ```
7. Set `NEXTAUTH_URL=http://localhost:3000` for local dev.

---

## 6. Deploying to Vercel (free tier)

**Push to GitHub first:**
```bash
cd forex-roadmap
git init
git add .
git commit -m "Initial commit: forex trading roadmap"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/forex-roadmap.git
git push -u origin main
```

**Then in Vercel:**
1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo. Vercel
   auto-detects Next.js — no build settings to change.
2. Before your first deploy (or right after, then redeploy), go to
   **Project → Settings → Environment Variables** and add all five:
   `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (set this one to your real
   `https://your-project.vercel.app` URL).
3. Deploy. Once you have your real `.vercel.app` URL, go back to the Google
   Cloud Console and add
   `https://your-project.vercel.app/api/auth/callback/google` to the
   authorized redirect URIs (step 5.4 above) if you haven't already.
4. Every `git push` to `main` auto-redeploys.

If you later buy a custom domain and attach it in Vercel, remember to: (a)
update `NEXTAUTH_URL` to the new domain, and (b) add its callback URL in
Google Cloud Console too.

---

## 7. Editing content

- **Roadmap data** (all 94 concepts, descriptions, links, levels, and which
  ones show up on `/tools`) lives entirely in `lib/data.js`. Each item is a
  plain object:
  ```js
  { id: "m01i1", title: "...", desc: "...", url: "https://...", level: "beginner", tool: false }
  ```
  Add, remove, or edit items directly there — the UI (progress %, ticker
  bar, filters, `/tools` page) all derive from this one file automatically.
- **M-Pesa number**: `components/DonateButton.js`, the `MPESA_NUMBER`
  constant at the top.
- **Colors / fonts / spacing**: `app/globals.css` (CSS custom properties at
  the top of the file) and the font choices in `app/layout.js`.
- **Site name / meta description**: `export const metadata` in
  `app/layout.js` and `app/tools/page.js`.

---

## 8. Project structure

```
forex-roadmap/
├── app/
│   ├── api/auth/[...nextauth]/route.js   # NextAuth handler (Google only)
│   ├── api/progress/route.js             # GET/PUT a signed-in user's progress
│   ├── tools/page.js                     # /tools page
│   ├── globals.css                       # entire design system
│   ├── layout.js                         # fonts, <Header>/<Footer>, SessionProvider
│   ├── page.js                           # / (roadmap) page
│   └── providers.js                      # client-side SessionProvider wrapper
├── components/
│   ├── AuthButtons.js      # Sign in / sign out (client)
│   ├── DonateButton.js     # M-Pesa modal (client)
│   ├── Footer.js
│   ├── Header.js           # reads session server-side
│   ├── ItemRow.js          # one concept's checkbox row
│   ├── ModuleCard.js       # one accordion module
│   ├── RoadmapApp.js       # the "/" page's full interactive body
│   └── ToolsApp.js         # the "/tools" page's full interactive body
├── hooks/
│   └── useProgress.js      # guest = localStorage, signed-in = MongoDB
├── lib/
│   ├── authOptions.js      # NextAuth config (Google + MongoDB adapter)
│   ├── data.js             # all 17 modules / 94 concepts
│   └── mongodb.js          # cached MongoClient connection
├── .env.example
├── jsconfig.json           # enables the "@/..." import alias
├── next.config.js
└── package.json
```

---

## 9. Known limitations / honest notes

- **M-Pesa donations are manual**, not an automated checkout — see the note
  in §1. To take it further: Safaricom's **Daraja API** (M-Pesa's developer
  platform) supports **STK Push** (a prompt straight to the payer's phone),
  but it requires you to register a business short code / till number —
  a personal phone number can't receive automated API-initiated payments.
  If you get Daraja sandbox/production credentials later, the natural next
  step is a new `app/api/donate/route.js` that calls the STK Push endpoint;
  happy to help build that out once you have the credentials.
- **Guest → account migration** only runs once, the first time a browser
  with existing guest progress signs in, and only if that account doesn't
  already have progress saved. It won't merge two different sets of guest
  and account progress together after that point.
- I couldn't run a live `npm install`/`npm run build` while building this
  (see the note at the top) — please treat your first local `npm run dev`
  as the real first test.
