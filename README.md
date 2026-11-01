# IDEA UNIVERSE — local and Vercel edition

Complete application source exported from the working site, including account creation, admin password changes, permanent user/idea deletion, AI refinement, and shared idea storage. The deployed Sites version is unchanged by this export.

## 1. Run locally (Windows PowerShell)

Install Node.js 22.13 or newer (Node 22 LTS recommended), then open this folder in VS Code. Run:

```powershell
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

Open `.env.local` and fill in the empty values before starting:

| Variable | Value/source |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL; the existing project URL is prefilled. |
| `SUPABASE_ANON_KEY` | Publishable key (or legacy anon key), from Supabase project API keys. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret key or legacy service-role key, from the same project. |
| `AI_API_KEY` | Your OpenRouter API key. |
| `AI_BASE_URL` | `https://openrouter.ai/api/v1` |
| `AI_MODEL` | `deepseek/deepseek-v4.1-flash-1017` |

All six variables are server-only. Do not rename them with `NEXT_PUBLIC_`, commit `.env.local`, or put keys into frontend files. No API keys or passwords are included in this download.

```powershell
pnpm dev
```

Open http://localhost:3000. Restart the dev server after editing environment variables. Development cookies support local HTTP; production cookies require HTTPS.

## 2. Use the existing database

Use keys from the existing **IDEA UNIVERSE** Supabase project (`diqclfpkkxowmermnonj`) to keep all existing accounts, passwords, and ideas. **Do not run the SQL setup files again on that project.** Both schema files are already applied there.

Local and Vercel installations connected to this project share live data. Deletions or password changes made locally affect the live workspace too. Use a separate Supabase project if you want isolated development data.

The existing admin username is `brokeadmin`. Use the password you set previously. Passwords live in Supabase Auth, not in source code, and do not change when moving hosts.

## 3. Optional: start with a NEW Supabase database

Skip this section if reusing the existing database.

1. Create a Supabase project and put its URL and keys in `.env.local`.
2. In the Supabase SQL Editor, run these files in order, once each:
   - `supabase/migrations/001_workspace.sql`
   - `db/admin-management.sql`
3. Disable public self-signup in Authentication settings. The app provisions accounts through the admin panel or validated invitations.
4. In Supabase Authentication → Users, create your initial admin using an email and password. Confirm the email. Copy the new user's UUID.
5. Run this SQL, replacing the UUID with that real Auth user's UUID:

```sql
insert into public.profiles (id, username, role)
values ('REPLACE_WITH_REAL_AUTH_UUID', 'brokeadmin', 'admin');
```

6. Sign in on the app using `brokeadmin` and that password. The app looks up the email internally; users sign in by username.

## 4. Publish on Vercel

1. Push the contents of this folder to a GitHub repository. Keep `package.json` at the repository root; do not upload `node_modules`, `.next`, or `.env.local`.
2. In Vercel, choose **Add New → Project**, import the repository, and select **Next.js**. If the repository contains a parent folder, set Root Directory to `idea-universe`.
3. Select Node.js 22.x. `vercel.json` supplies `pnpm install --frozen-lockfile` and `pnpm build`; leave Output Directory at the Next.js default.
4. Add all six environment variables from your local configuration to Vercel's project settings for Production (and Preview if wanted).
5. Deploy. After changing environment variables, redeploy for them to take effect.
6. Verify login, create a member, save an idea, and check the Control Room on the Vercel URL.

No Sites tooling, Cloudflare account, or Sites-specific environment variables are needed. This package uses standard `next dev`, `next build`, and `next start` commands. AI requests run in the Node.js runtime with a 60-second route budget, subject to your Vercel plan limits.

Sites sharing permissions do not transfer to Vercel. Application login still protects workspace data; configure Vercel Deployment Protection separately if you want an additional hosting access gate.

## 5. Admin controls

- Sign in through `/`; admin accounts open `/control-room`.
- Members: create accounts, change passwords (including admin), disable/enable access, or permanently delete users.
- Deleting a user keeps their shared ideas and marks attribution as Deleted user. Their unused invitations are removed.
- You cannot delete the currently signed-in admin account.
- Ideas: archive/restore, or permanently delete content and revision history after confirmation.
- Passwords require at least 6 characters. Existing passwords cannot be displayed; set a new password instead.

## 6. Checks and production build

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

For local development, use `pnpm dev`. Production sessions use Secure cookies; use HTTPS when testing production authentication outside localhost.

Browser test scaffolding is in `tests/browser`. It is separate from the automated unit/database tests and requires Playwright browser installation and a running app.

## Structure

- `app/`: UI, styles, pages, server API routes
- `lib/`: authentication, database calls, validation, motion, data models
- `public/`: bundled fonts and assets
- `supabase/` and `db/`: database setup SQL
- `tests/`: API, session, permission, database, color, and browser tests

Original source revision: `4349018a18beb3649742366694ebb54dd5483469`. Export-only changes: standard Next.js scripts, Vercel route runtime/budget, local-development cookie support, lean dependencies, and this setup guide.

Reference documentation: https://vercel.com/docs/frameworks/full-stack/nextjs and https://nextjs.org/docs/app/api-reference/cli/next
