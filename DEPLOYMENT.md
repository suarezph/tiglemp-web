# Deploying to Cloudflare Pages

This monorepo contains three independent frontends deployed as **three separate Cloudflare Pages projects**, all connected to the same Git repository. The `connect.tiglemp.com` API is hosted elsewhere (Docker host) — Cloudflare just proxies DNS to it.

| Subdomain                | App folder       | Cloudflare Pages project name |
| ------------------------ | ---------------- | ----------------------------- |
| `tiglemp.com`            | `apps/customer`  | `tiglemp-customer`            |
| `partner.tiglemp.com`    | `apps/partner`   | `tiglemp-partner`             |
| `main.tiglemp.com`       | `apps/admin`     | `tiglemp-admin`               |
| `connect.tiglemp.com`    | (separate repo)  | (Docker host, e.g. Fly/Railway) |

---

## Prerequisites

1. Push this repo to GitHub (or GitLab / Bitbucket — Cloudflare supports all three).
2. Have a Cloudflare account with `tiglemp.com` added as a zone.
3. DNS for `tiglemp.com` is managed by Cloudflare.

---

## Per-app Pages setup

You will repeat this **three times**, once per app. The settings differ only in `Project name`, `Root directory`, and `Build output directory`.

### 1. Create the project

1. Go to **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Authorise Cloudflare to read the `tiglemp-web` repo.
3. Select the repository.

### 2. Build configuration (per app)

Use these values exactly:

#### `tiglemp-customer` → `tiglemp.com`

| Field                       | Value                       |
| --------------------------- | --------------------------- |
| Project name                | `tiglemp-customer`          |
| Production branch           | `main`                      |
| Framework preset            | `None` (we override below)  |
| Build command               | `pnpm install --frozen-lockfile && pnpm turbo build --filter=@tiglemp/customer...` |
| Build output directory      | `apps/customer/dist`        |
| Root directory (advanced)   | *(leave blank — repo root)* |
| Node version (env var)      | `NODE_VERSION = 20`         |

#### `tiglemp-partner` → `partner.tiglemp.com`

Same as above, but:

| Field                  | Value                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| Project name           | `tiglemp-partner`                                                               |
| Build command          | `pnpm install --frozen-lockfile && pnpm turbo build --filter=@tiglemp/partner...` |
| Build output directory | `apps/partner/dist`                                                             |

#### `tiglemp-admin` → `main.tiglemp.com`

Same as above, but:

| Field                  | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| Project name           | `tiglemp-admin`                                                               |
| Build command          | `pnpm install --frozen-lockfile && pnpm turbo build --filter=@tiglemp/admin...` |
| Build output directory | `apps/admin/dist`                                                             |

> **Why `--filter=@tiglemp/customer...`?** The trailing `...` tells Turbo to also build everything that package depends on (e.g. `@tiglemp/ui`). Without it, Turbo would build only the app and the import would fail because `ui` was never compiled.
>
> **Why `--frozen-lockfile`?** Forces pnpm to fail if `pnpm-lock.yaml` is out of date with `package.json`. Catches "works on my laptop" bugs in CI.

### 3. Environment variables (per project)

Set these under **Settings → Environment variables** for each Pages project:

| Variable         | Value                                | Notes                                      |
| ---------------- | ------------------------------------ | ------------------------------------------ |
| `NODE_VERSION`   | `20`                                 | Cloudflare reads this to pick Node.        |
| `PNPM_VERSION`   | `10`                                 | Cloudflare auto-detects pnpm if present, but pinning is safer. |
| `VITE_API_URL`   | `https://connect.tiglemp.com/api/v1` | Used by your API client at build time.     |

**Important:** Set `VITE_API_URL` for both **Production** and **Preview** environments. For preview deploys (PRs), point at a staging API if you have one.

### 4. Custom domains

After the first successful deploy:

1. Project → **Custom domains → Set up a custom domain**.
2. Add the domain:
   - `tiglemp-customer` → `tiglemp.com` *(also add `www.tiglemp.com` if you want it)*
   - `tiglemp-partner` → `partner.tiglemp.com`
   - `tiglemp-admin` → `main.tiglemp.com`
3. Cloudflare auto-creates the DNS records inside the `tiglemp.com` zone.

---

## SPA routing fallback

Vite SPAs use client-side routing, so any direct visit to `/anything` must serve `index.html`. Add this file to **each app**:

`apps/<app>/public/_redirects`:

```
/*  /index.html  200
```

This tells Cloudflare Pages: "for any path, serve `index.html` with a 200." React Router (or whatever you use) takes over from there.

---

## Locking down the admin (`main.tiglemp.com`)

Two layers — both cheap, both essential:

### Layer 1: Cloudflare Access (the real lock)

This gates the entire site behind a login *before* any JS is served. Free for ≤50 users.

1. Cloudflare Dashboard → **Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. Application name: `Tiglemp Admin`.
3. Application domain: `main.tiglemp.com`.
4. Identity providers: pick one (Google, GitHub, One-time PIN to email — whichever you prefer).
5. Add a policy:
   - Name: `Allow internal team`
   - Action: `Allow`
   - Include: `Emails ending in @yourcompany.com` *(or specific email list)*

Result: anyone hitting `main.tiglemp.com` is bounced to a Cloudflare-hosted login screen. Only approved emails ever reach the React bundle.

### Layer 2: Block search engines (defense in depth)

Even with Access, add this so the URL never appears in search results.

`apps/admin/public/robots.txt`:

```
User-agent: *
Disallow: /
```

`apps/admin/index.html` — add inside `<head>`:

```html
<meta name="robots" content="noindex, nofollow" />
```

---

## API CORS configuration

Your API (`connect.tiglemp.com`) needs to explicitly allow the three frontend origins. In `tiglemp-api/src/app.js`:

```js
const allowedOrigins = [
  'https://tiglemp.com',
  'https://www.tiglemp.com',
  'https://partner.tiglemp.com',
  'https://main.tiglemp.com',
  // dev:
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
```

Don't use `origin: '*'` once you start sending cookies or auth headers.

---

## Auth cookie isolation

Each portal must have its own session — a stolen customer token must **not** work on admin.

Two ways:

- **Recommended (cleanest):** put each app on its own subdomain (already done) and set the auth cookie with `Domain=partner.tiglemp.com` (no leading dot). The cookie is then scoped to that exact host only.
- **Alternative:** use `Authorization: Bearer <token>` headers and store tokens in app-specific localStorage keys. No cross-domain leakage by definition.

Do **not** set the auth cookie on `.tiglemp.com` (with the leading dot) — that shares it across all subdomains, which is exactly what you want to avoid.

---

## Deploy checklist

- [ ] Repo pushed to GitHub.
- [ ] Three Pages projects created with build commands above.
- [ ] `VITE_API_URL` set in each project (production + preview).
- [ ] Custom domains attached (`tiglemp.com`, `partner.tiglemp.com`, `main.tiglemp.com`).
- [ ] `_redirects` file added to each app's `public/` folder.
- [ ] Cloudflare Access policy live for `main.tiglemp.com`.
- [ ] `robots.txt` and `noindex` meta tag in admin app.
- [ ] API CORS allowlist updated with all three production origins.
- [ ] API deployed to its host (Docker on Fly/Railway/VPS — separate repo).
- [ ] DNS for `connect.tiglemp.com` points at the API host (proxied through Cloudflare orange-cloud).

---

## Local development

```bash
# install once
pnpm install

# run all 3 apps in parallel
pnpm dev
# customer → http://localhost:5173
# partner  → http://localhost:5174
# admin    → http://localhost:5175

# run one app
pnpm dev --filter=@tiglemp/customer

# build everything (uses cache after first run)
pnpm build

# build one app (and its dependencies)
pnpm build --filter=@tiglemp/admin...

# typecheck everything
pnpm typecheck
```
