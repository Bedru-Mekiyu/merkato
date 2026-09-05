# Merkato — Complete Setup Guide

This guide walks you through everything from zero to a fully running Merkato
platform. Follow every step in order. Nothing is skipped.

---

## What you will need

Before you start, create free accounts on these services:

| Service | What it's for | Cost |
|---|---|---|
| [supabase.com](https://supabase.com) | Database, Auth, Storage, Realtime | Free |
| [resend.com](https://resend.com) | Sending emails (invites, notifications, password reset) | Free — 3,000 emails/month, 100/day |
| [anthropic.com](https://anthropic.com) | AI Assistant feature | Pay-per-use, very cheap for internal use |
| [vercel.com](https://vercel.com) | Deploying the app online *(optional for local run)* | Free |

You also need a **domain name** for email (e.g. `yourdomain.com`). If you
don't have one yet, email will not work until you get one. The rest of the
app works fine without email during development.

---

## Part 1 — Install tools on your computer

### 1.1 Install Node.js

You need Node.js version 18.18 or higher.

**Check if you already have it:**
```bash
node --version
```
If it says `v18.x.x`, `v20.x.x`, or higher, skip to step 1.2.

**Install Node.js:**
- Go to [nodejs.org](https://nodejs.org)
- Download the **LTS** version (the green button)
- Run the installer
- Open a new terminal and run `node --version` to confirm

### 1.2 Download the project

1. Download the `merkato.zip` file you received
2. Unzip it — you will get a folder called `merkato`
3. Open your terminal and navigate into it:

```bash
cd merkato
```

All future commands in this guide are run from inside this folder.

---

## Part 2 — Set up Supabase (database + auth)

### 2.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (GitHub login is fastest)
2. Click **New project**
3. Fill in:
   - **Name**: `merkato` (or anything you like)
   - **Database Password**: click **Generate a password** and save it somewhere (you won't need it often but don't lose it)
   - **Region**: pick the one closest to you
4. Click **Create new project**
5. Wait 1–2 minutes for it to fully start up (you'll see a spinning indicator)

### 2.2 Get your API keys

Once your project is ready:

1. In the left sidebar, click **Settings** (gear icon at the bottom)
2. Click **API**
3. You will see two values you need — copy them somewhere:
   - **Project URL** — looks like `https://abcdefghijklm.supabase.co`
   - **anon public** key — a very long string starting with `eyJ...`

> ⚠️ Never share your `service_role` key. Only copy the `anon public` key.

### 2.3 Run the database migrations

This is the most important step. You must run 14 SQL files in exact order.
Each file creates the database tables Merkato needs.

**How to run each file:**
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file from `merkato/supabase/migrations/` in any text editor
4. Copy the entire contents of the file
5. Paste it into the SQL Editor
6. Click **Run** (the green button, or press Ctrl+Enter / Cmd+Enter)
7. Wait for "Success" to appear
8. Then move to the next file

**Run these files in this exact order:**

| Order | File | What it creates |
|---|---|---|
| 1 | `001_core_schema.sql` | User profiles, organizations (workspaces), memberships |
| 2 | `002_crm_schema.sql` | CRM: companies, contacts, deals, notes |
| 3 | `003_projects_schema.sql` | Projects, tasks, subtasks, task comments |
| 4 | `004_collaboration_schema.sql` | Channels, messages, activity log, real-time chat |
| 5 | `005_knowledge_base_schema.sql` | Knowledge base categories and articles |
| **6a** | `006a_support_schema_enums.sql` | ⚠️ **STOP — read the note below** |
| **6b** | `006b_support_schema_continued.sql` | ⚠️ Run this ONLY after 6a fully succeeds |
| 7 | `007_documents_schema.sql` | Document metadata and file versions |
| 8 | `008_audit_log_schema.sql` | Audit/compliance log |
| 9 | `009_notifications_schema.sql` | In-app notifications (real-time bell) |
| 10 | `010_invitations_schema.sql` | Team invitation tokens |
| 11 | `011_email_helpers.sql` | Email lookup functions for notifications |
| 12 | `012_production_security_hardening.sql` | Production security hardening & RLS adjustments |
| 13 | `013_remove_ambiguous_ticket_relationship.sql` | Schema refinement for support ticket relationships |

> ⚠️ **Important — why 006 is split into two files:**
> PostgreSQL has a rule: when you add a new value to a database enum type
> (`ALTER TYPE ... ADD VALUE`), that change must be saved ("committed") in its
> own transaction before anything else can use the new value.
> Running `006a` by itself satisfies this. Then you run `006b` as a separate
> step. If you paste both files together and run them at once, you will get an
> error like `"unsafe use of new value of enum type"`. Just run them one at a
> time and you'll be fine.

### 2.4 Create the Documents Storage bucket

The document upload feature stores files in Supabase Storage. You need to
create the bucket manually:

1. In your Supabase project, click **Storage** in the left sidebar
2. Click **New bucket**
3. Set the **Name** to exactly: `documents` (all lowercase, no spaces)
4. Make sure **Public bucket** is **OFF** (leave it private)
5. Click **Save**

That's it. The permissions for this bucket were already set up when you ran
`007_documents_schema.sql`.

### 2.5 Disable email confirmation (for local development)

By default, Supabase requires new users to click a confirmation link before
they can log in. During development this is annoying because you'd have to
check email for every test account.

**To disable it for development:**
1. In your Supabase project, go to **Authentication** in the left sidebar
2. Click **Providers**
3. Click on **Email**
4. Turn off **Confirm email**
5. Click **Save**

> Re-enable this before you launch publicly.

### 2.6 Configure the Auth redirect URL

Supabase needs to know where to send users after they click email links
(password reset, email confirmation, OAuth). You need to tell it your app's URL.

**For local development:**
1. In Supabase, go to **Authentication** → **URL Configuration**
2. Under **Site URL**, set it to: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/**`
4. Click **Save**

**For production (Vercel):** Come back here after deploying and replace
`http://localhost:3000` with your actual Vercel URL like `https://merkato.vercel.app`.

---

## Part 3 — Configure the app

### 3.1 Create your environment file

In the `merkato` folder, there is a file called `.env.local.example`.
Copy it and rename the copy to `.env.local`:

**On Mac/Linux:**
```bash
cp .env.local.example .env.local
```

**On Windows:**
```
copy .env.local.example .env.local
```

Now open `.env.local` in any text editor (Notepad, VS Code, etc.).

### 3.2 Fill in the required values

#### Supabase (required — the app won't start without these)

Replace the placeholder values with what you copied in step 2.2:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### App URL (required)

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Change this to your real domain when you deploy.

#### Anthropic API key (required for AI Assistant)

The AI Assistant feature uses Claude. Without this key, the AI chat page will
show a clear error message — everything else still works normally.

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **Settings → API Keys**
4. Click **Create Key**, give it a name like `merkato`
5. Copy the key (starts with `sk-ant-`)
6. Add it to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

#### Resend API key (required for email features)

Email features include: team invitations, password reset emails, ticket reply
notifications, and task assignment emails. Without this, emails are silently
skipped — the app still works, just no emails are sent.

1. Go to [resend.com](https://resend.com) and sign up
2. Click **API Keys** in the left sidebar
3. Click **Create API Key**
4. Name it `merkato`, choose **Sending access**, click **Add**
5. Copy the key (starts with `re_`)
6. Add it to `.env.local`:

```
RESEND_API_KEY=re_abc123...
EMAIL_FROM=noreply@yourdomain.com
```

> If you don't have a domain yet, use `onboarding@resend.dev` as `EMAIL_FROM`
> — Resend provides this for testing without domain verification.
> Real emails will only be sent to your own verified Resend email address
> in this mode.

#### Verify your domain in Resend (to send to anyone)

Without domain verification, Resend can only send to your own email address.
To send to your users, verify a domain:

1. In Resend, click **Domains** in the left sidebar
2. Click **Add Domain**
3. Enter your domain (e.g. `yourdomain.com`) — or use a subdomain like `mail.yourdomain.com`
4. Resend will show you DNS records to add — they look like this:

```
Type: TXT   Name: @           Value: "v=spf1 include:amazonses.com ~all"
Type: TXT   Name: resend._domainkey   Value: p=MIGfMA0...
Type: MX    Name: @           Value: feedback-smtp.us-east-1.amazonses.com
```

5. Log into wherever you bought your domain (GoDaddy, Namecheap, Cloudflare, etc.) and add those records
6. Come back to Resend and click **Verify** — DNS can take 5–30 minutes to propagate
7. Once verified, update `EMAIL_FROM` in `.env.local` to use your domain:
   ```
   EMAIL_FROM=noreply@yourdomain.com
   ```

#### OAuth (Google + GitHub login buttons — optional)

If you skip this, the OAuth buttons on the login/signup page are visible but
clicking them will show a Supabase error. Everything else works. To activate:

**GitHub OAuth:**
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - Application name: `Merkato`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
     (replace `YOUR_SUPABASE_PROJECT_REF` with the part before `.supabase.co` in your Supabase URL)
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it
7. In Supabase → **Authentication** → **Providers** → **GitHub**:
   - Enable GitHub
   - Paste Client ID and Secret
   - Click Save
8. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true
   ```

**Google OAuth:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth 2.0 Client IDs**
5. Set Application type to **Web application**
6. Under **Authorized redirect URIs**, add:
   `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
7. Click **Create** — copy the **Client ID** and **Client Secret**
8. In Supabase → **Authentication** → **Providers** → **Google**:
   - Enable Google
   - Paste Client ID and Client Secret
   - Click Save
9. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
   ```

Your final `.env.local` should look something like this:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-api03-...
RESEND_API_KEY=re_abc123...
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true
```

---

## Part 4 — Run the project locally

### 4.1 Install dependencies

In your terminal, inside the `merkato` folder, run:

```bash
npm install
```

This downloads all the code packages Merkato needs. It takes 1–3 minutes
the first time. You'll see a lot of text — this is normal.

### 4.2 Start the development server

```bash
npm run dev
```

You'll see output like:
```
▲ Next.js 14.2.15
- Local: http://localhost:3000
- Ready in 2.1s
```

### 4.3 Open the app

Open your browser and go to: **http://localhost:3000**

You will be redirected to the login page.

---

## Part 5 — First-time walkthrough

### 5.1 Create your account

1. Click **Sign up**
2. Enter your name, email, and a password (minimum 8 characters)
3. Click **Create account**
4. If email confirmation is still on (you didn't do step 2.5), check your email and click the link
5. If you turned it off, you go straight to the next step

### 5.2 Create your workspace

After signing up, you'll land on the workspace creation page:
1. Enter your company or team name (e.g. `Acme Inc.`)
2. Click **Create workspace**
3. You'll land on the Dashboard

### 5.3 Try every feature

Here's the recommended order to verify everything works:

**Dashboard**
- You'll see metric cards — they'll show zeros until you add data

**CRM → Companies**
- Click **New Company**, fill in a name, click Create
- Try **Contacts** and **Deals** the same way
- On the Deals/Pipeline view, drag a deal card between columns

**Projects**
- Click **New Project**, create one
- Open it — click **New Task**, fill in the title
- Drag tasks between Board columns
- Switch between Board / List / Calendar views
- Click a task to open the detail panel — add a subtask, add a comment

**Team**
- Create a channel with the `+` button in the sidebar
- Send a message — it arrives in real time
- Check the Activity tab to see everything logged

**Knowledge Base**
- Create a category, then click **New Article**
- Write some Markdown: `# Heading`, `**bold**`, `- list item`
- Click **Publish** — then open the article to see it rendered

**Support**
- Copy your portal link (click "Copy customer portal link" on the Support page)
- Open an incognito/private window and paste the URL
- Sign up as a different user in the incognito window (this simulates a customer)
- Submit a support request from the portal
- Switch back to your main account — the ticket appears in the Support queue
- Click the ticket, write an internal note (check the checkbox), then write a public reply

**Documents**
- Drag any file onto the drop zone — it uploads to Supabase Storage
- Create folders with the **New Folder** button

**Analytics**
- View the three tabs — charts update as you add data

**AI Assistant**
- Only works if you added `ANTHROPIC_API_KEY`
- Ask: "What should I focus on today?" — it pulls live context from your workspace

**Settings → Security**
- Click **Team Members & Invitations** → invite a colleague by email
  (only sends email if you configured Resend)
- Click **Two-Factor Authentication** → set it up with any authenticator app

**Audit Log**
- Go to Settings → Security → View Audit Log
- You'll see a record of everything you just did

---

## Part 6 — Deploy to production (Vercel)

When you're ready to put Merkato online so your team can use it:

### 6.1 Push to GitHub

1. Create a free account at [github.com](https://github.com) if you don't have one
2. Create a new repository (click the **+** at the top right → **New repository**)
3. Name it `merkato`, set it to **Private**, click **Create repository**
4. In your terminal inside the `merkato` folder:

```bash
git init
git add .
git commit -m "Initial Merkato build"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/merkato.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

### 6.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (GitHub login is fastest)
2. Click **Add New Project**
3. Click **Import** next to your `merkato` repository
4. On the configuration screen:
   - Framework Preset: **Next.js** (auto-detected)
   - Leave everything else as default
5. Click **Environment Variables** and add all of these:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `NEXT_PUBLIC_APP_URL` | `https://your-app-name.vercel.app` (you'll know this after deploy) |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `RESEND_API_KEY` | Your Resend key |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | `true` (if you set up Google) |
| `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED` | `true` (if you set up GitHub) |

6. Click **Deploy**
7. Wait 2–3 minutes for the build to complete
8. Vercel gives you a URL like `https://merkato-abc123.vercel.app`

### 6.3 Update your Supabase redirect URLs for production

After deploying:
1. In Supabase → **Authentication** → **URL Configuration**
2. Change **Site URL** to your Vercel URL (e.g. `https://merkato-abc123.vercel.app`)
3. Add to **Redirect URLs**: `https://merkato-abc123.vercel.app/**`
4. Click **Save**
5. Also update `NEXT_PUBLIC_APP_URL` in Vercel to match
6. After changing an env var in Vercel, redeploy: go to **Deployments** → click the three dots on the latest deployment → **Redeploy**

### 6.4 Update OAuth callback URLs for production

If you set up Google or GitHub OAuth:

**GitHub:** Go to github.com/settings/developers → your OAuth App → update the callback URL to your production Supabase URL (it should already be `https://YOUR_REF.supabase.co/auth/v1/callback` — this doesn't change, but add your Vercel URL to **Homepage URL**).

**Google:** Go to console.cloud.google.com → your OAuth client → add your Vercel URL to **Authorized JavaScript origins**.

### 6.5 Enable email confirmation for production

Now that you're live, re-enable email confirmation:
1. Supabase → **Authentication** → **Providers** → **Email**
2. Turn **Confirm email** back ON
3. Click **Save**

---

## Part 7 — Common problems and fixes

### "Invalid API key" or blank page after login

Your `.env.local` values are wrong. Double-check:
- No spaces around the `=` sign
- The URL ends in `.supabase.co` with no trailing slash
- The anon key is the full long string starting with `eyJ`

Restart the dev server after changing `.env.local`:
```bash
# Press Ctrl+C to stop, then:
npm run dev
```

### "relation does not exist" error

A SQL migration didn't run successfully. Go back to Part 2.3 and re-run the
migration that corresponds to the missing table. You can run them again safely
— they use `CREATE TABLE IF NOT EXISTS` so they won't break existing data.

### Email confirmation loop (redirected to login after confirming)

Make sure your Supabase **Site URL** and **Redirect URLs** match exactly what
you're running on. For local dev: `http://localhost:3000`.

### "unsafe use of new value of enum type" when running migrations

You ran `006a` and `006b` together in the same query. Run them separately —
paste `006a`, click Run, wait for success, then paste `006b` and click Run.

### Documents not uploading

You either:
- Forgot to create the `documents` storage bucket (go to Supabase → Storage → New Bucket → name it `documents`)
- Or the bucket is set to Public instead of Private

### AI Assistant shows "ANTHROPIC_API_KEY is not set"

Add `ANTHROPIC_API_KEY=sk-ant-...` to your `.env.local` and restart the server.

### Emails not being sent

1. Check that `RESEND_API_KEY` is set and starts with `re_`
2. Check that `EMAIL_FROM` is a domain you have verified in Resend
3. Check the **Emails** section in your Resend dashboard to see if sends are being attempted
4. On the free tier: Resend has a limit of **100 emails per day**. If you hit it, emails queue until tomorrow.

### OAuth buttons give a "redirect_uri_mismatch" error

The callback URL you entered in Google/GitHub doesn't exactly match Supabase's
callback URL. Make sure you used:
`https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
(not your Vercel URL, not `localhost` — always the Supabase URL)

### MFA "could not create challenge" error

This happens if you refresh the enroll page mid-setup. Click **Cancel** and
start the MFA setup again from Settings → Security → Two-Factor Authentication.

---

## Quick reference — what each URL does

| URL | What it is |
|---|---|
| `/` | Redirects to login or dashboard |
| `/signup` | Create a new account |
| `/login` | Log in |
| `/forgot-password` | Request a password reset email |
| `/reset-password` | Set a new password (Supabase redirects here) |
| `/verify-mfa` | Enter 6-digit code after login (if MFA is on) |
| `/onboarding` | Create your workspace (shown once, after signup) |
| `/dashboard` | Main dashboard |
| `/crm/deals` | Deal pipeline |
| `/crm/contacts` | Contacts list |
| `/crm/companies` | Companies list |
| `/projects` | All projects |
| `/projects/[id]` | Single project (Board/List/Calendar) |
| `/team` | Team channels |
| `/team/channels/[id]` | A specific channel |
| `/team/dm/[userId]` | Direct message |
| `/team/directory` | Team member directory |
| `/team/activity` | Workspace activity feed |
| `/knowledge-base` | KB home (search + categories) |
| `/knowledge-base/new` | Write a new article |
| `/knowledge-base/[id]` | Read an article |
| `/knowledge-base/[id]/edit` | Edit an article |
| `/support` | Staff ticket queue |
| `/support/tickets/[id]` | Staff ticket detail |
| `/portal/[orgSlug]` | Customer support portal (public) |
| `/portal/[orgSlug]/new` | Customer submits a new ticket |
| `/documents` | File manager |
| `/analytics` | Analytics dashboard |
| `/audit-log` | Security audit log (owners/admins only) |
| `/ai-assistant` | AI chat |
| `/settings` | Profile + workspace settings |
| `/settings/mfa` | Set up two-factor authentication |
| `/settings/invites` | Manage team invitations |
| `/invite/[token]` | Accept an invitation (link from email) |

---

## Your workspace's customer portal URL

Customers submit support tickets at:
```
https://your-app-url.vercel.app/portal/your-org-slug
```

To find your org slug: go to **Settings** in Merkato. It's shown in the
**Workspace URL** field. You can copy the portal link directly from the
**Support** page using the **Copy customer portal link** button.

---

*Built with Next.js 14, Supabase, Anthropic Claude, and Resend.*
