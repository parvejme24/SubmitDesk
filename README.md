<div align="center">

<img src="frontend/src/app/icon.svg" alt="SubmitDesk logo" width="84" />

# SubmitDesk

**Hand in a project. Get it reviewed. Get a mark out of 100.**

A full-stack project submission and review platform: students submit their GitHub repo and live site,
mentors review it in a dashboard, approve or reject it, and give a mark with feedback.

[![Live demo](https://img.shields.io/badge/Live%20demo-submitdesk--frontend.vercel.app-6d5dfc?style=for-the-badge&logo=vercel&logoColor=white)](https://submitdesk-frontend.vercel.app)
[![API health](https://img.shields.io/badge/API-health%20check-10b981?style=for-the-badge&logo=express&logoColor=white)](https://submitdesk-backend.vercel.app/api/health)

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/API%20tests-52%20passing-22c55e?logo=vitest&logoColor=white)

[The problem](#-the-problem) ·
[Features](#-key-features) ·
[How it works](#-how-it-works) ·
[Calculations](#-how-the-numbers-are-calculated) ·
[Tech stack](#-tech-stack) ·
[Getting started](#-getting-started) ·
[API](#-api-reference)

</div>

---

## 🧩 The problem

In most courses and bootcamps, project reviews run on a mix of Google Forms, spreadsheets and chat messages. That causes the same problems again and again:

| Pain point | What actually happens |
|---|---|
| **Scattered submissions** | Links arrive in forms, DMs and emails. Mentors hunt for them. |
| **Duplicate and broken entries** | The same repo is submitted twice (`.git`, trailing `/`, different casing), or with a broken link. |
| **No clear status** | Students keep asking "has my project been checked yet?" |
| **Feedback gets lost** | Rejection reasons live in a chat thread, so after a resubmission nobody remembers what was wrong. |
| **Inconsistent grading** | Marks sit in a private spreadsheet, without a fixed scale or history. |
| **Spam and abuse** | Open forms can be flooded with junk submissions. |

## 💡 Why SubmitDesk

SubmitDesk puts the whole review cycle in **one place with clear rules**:

- **One repo = one submission.** URLs are normalized and the database refuses duplicates, even when two identical requests race.
- **Every project has a visible status:** Pending → Approved or Rejected, with a progress tracker the student can follow.
- **Every review is recorded:** decision, mark out of 100, feedback, mentor and date, kept as a history across resubmissions.
- **Roles are enforced on the server**, not just hidden in the UI. Students see only their own work, and only mentors can review.
- **Built to be safe in public:** validation on both sides, rate limits, httpOnly cookies and security headers.

---

## ✨ Key features

### 🎓 For students

- **Submit a project** with a minimal form: name, GitHub repo, live site and description, validated as you type.
- **Track progress** on each card: *Submitted → In review → Approved / Rejected*.
- **See the result:** the **mark out of 100** and the mentor's written feedback.
- **Edit or delete** a project while it's Pending or Rejected. Fixing a rejected one resubmits it for review.
- Approved projects are **locked**, so a mentor's decision can't be changed afterwards.

### 🛡️ For mentors

- **Review dashboard** with a **paginated table** (cards on phones).
- **Server-side filters:** All, Pending, Approved, Rejected, plus search by project name and newest/oldest sorting. Filters live in the URL, so refresh, back and shared links work.
- **Live statistics:** Total, Pending, Approved and Rejected, each with its share of the total. Clicking a card filters the table.
- **Two-step review:** ① approve or reject, ② add or edit the **mark (0–100)** and **feedback** whenever you're ready.
- **Details view** with the full description, links and the **complete review history**.
- **Students directory:** every student with per-status counts and their **average mark**, plus a profile with all their projects.

### 🔐 Platform and quality

- **JWT auth in an httpOnly cookie** with role-based access control (`STUDENT`, `MENTOR`). Mentors are seeded only and can never sign up.
- **Duplicate protection** through a normalized repo URL plus a database `UNIQUE` constraint.
- **Race-safe writes:** two mentors reviewing at once means one wins and the other gets `409`, never a silent overwrite.
- **Rate limits:** login (failed attempts only), signup, submissions per student and a global cap, with per-visitor IPs signed through the proxy.
- **Accessible UI:** skip link, visible focus rings, screen-reader announcements, labels on every field and support for reduced motion.
- **Light and dark themes**, a responsive layout, a phone tab bar and themed scrollbars.
- **52 API tests** (Vitest + Supertest) on a separate test database.

---

## 🔄 How it works

### Submission lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PENDING: student submits
    PENDING --> PENDING: student edits
    PENDING --> APPROVED: mentor approves
    PENDING --> REJECTED: mentor rejects
    REJECTED --> PENDING: student fixes & resubmits
    APPROVED --> APPROVED: mentor adds / edits mark & feedback
    REJECTED --> REJECTED: mentor adds / edits mark & feedback
    PENDING --> [*]: student deletes
    REJECTED --> [*]: student deletes
    note right of APPROVED: Locked for the student (no edit or delete)
```

### Review flow

```mermaid
sequenceDiagram
    actor S as Student
    participant W as SubmitDesk (Next.js)
    participant A as API (Express)
    participant D as PostgreSQL
    actor M as Mentor

    S->>W: Submit repo + live link
    W->>A: POST /api/submissions
    A->>D: insert (repo URL must be unique)
    D-->>A: ok, or 409 duplicate
    M->>W: Open dashboard (filter: Pending)
    W->>A: GET /api/mentor/submissions?status=PENDING
    M->>A: PATCH /review { decision: APPROVED }
    M->>A: PATCH /grade { mark: 88, comment }
    S->>W: Open "My submissions"
    W-->>S: Approved · 88/100 · feedback
```

---

## 🧮 How the numbers are calculated

| Number | Rule |
|---|---|
| **Mark** | A whole number from **0 to 100**, given per review. It's checked by zod on both sides **and** by a database `CHECK` constraint, so `-1`, `101`, `72.5` or `"90"` are always rejected. |
| **Mark colour** | ≥ 80 green · 50–79 amber · < 50 red. The number is always shown too, so colour is only a hint. |
| **Current mark** | The mark of a project's **latest** review. Older reviews stay in the history. |
| **Student average mark** | The mean of the current marks of the student's **reviewed** projects, rounded to one decimal. Pending projects (including a resubmission waiting for review) and unmarked reviews don't count. |
| **Status share** | `round(count ÷ total × 100)` %, shown under each stat card (e.g. 10 approved of 28 → **36%**). |
| **Dashboard stats** | Total, Pending, Approved and Rejected come from one `GROUP BY status` query. |
| **Pagination** | `skip = (page − 1) × limit`, `totalPages = max(1, ⌈total ÷ limit⌉)`, with `limit` capped at 50. |

**Example:** Nadia has three projects. Approved with 88, Rejected with 45, and one Pending. Her average is **(88 + 45) ÷ 2 = 66.5**. The pending one doesn't count until it's graded.

---

## 🛠 Tech stack

| Layer | Technology | Why |
|---|---|---|
| Language | **TypeScript** (`strict`) | One language and shared types across the stack |
| Frontend | **Next.js 16** (App Router), **React 19** | Server components, routing, a proxy for auth and IP forwarding |
| UI | **Tailwind CSS 4**, **shadcn/ui**, **Motion** | Accessible components, fast styling, smooth animation |
| Data fetching | **TanStack Query** | Caching, background refetch, no flicker between pages |
| Forms | **react-hook-form** + **zod** | The same validation rules on the client and the server |
| Backend | **Express 5** | Small, well-known HTTP layer with async error handling |
| Database | **PostgreSQL** (Neon) via **Prisma 7** | Typed queries, migrations, constraints and relation joins |
| Auth | **JWT** in an httpOnly cookie, **bcrypt** | No token readable by JavaScript, hashed passwords |
| Security | **helmet**, **express-rate-limit**, HMAC-signed client IP | Secure headers and spam protection that works behind a proxy |
| Testing | **Vitest** + **Supertest** | Real HTTP tests against a real (test) database |
| Hosting | **Vercel** (two projects) + **Neon** | Auto-deploy on every push to `main` |

---

## 🚀 Try it

**Live:** https://submitdesk-frontend.vercel.app

The login page has **one-click sign-in buttons** for both roles. You can also type these in:

| Role | Name | Email | Password |
|---|---|---|---|
| 🛡️ Mentor | Tanvir Ahmed | `tanvir.ahmed@submitdesk.dev` | `SubmitDesk@2026` |
| 🎓 Student | Nadia Islam | `nadia.islam@submitdesk.dev` | `SubmitDesk@2026` |
| 🎓 Other students | Rahim, Karim, Nusrat, Tania, Sabbir | `rahim.uddin@submitdesk.dev`, … | `Student@12345` |

Nadia already has a pending, an approved and a rejected project, so every state is visible right away. Anyone can create a **student** account at `/signup`. Mentor accounts only come from the seed script.

---

## 🏗 Architecture

```mermaid
flowchart LR
    B([Browser]) -->|pages| N[Next.js<br/>frontend]
    B -->|/api/*| N
    N -->|rewrite /api/*<br/>+ signed visitor IP| E[Express API]
    E --> P[Prisma]
    P --> DB[(PostgreSQL<br/>Neon)]
    N -.->|proxy.ts:<br/>role-based redirects| N
```

- **Backend pattern:** `routes → controller → service → prisma`. Controllers handle HTTP, and services hold the business rules.
- **AuthN vs AuthZ:** `authenticate` verifies the JWT (401), `authorize("MENTOR")` checks the role (403), and services check ownership (403).
- **Validation:** zod schemas on the backend, mirrored on the frontend. Errors come back as `{ errors: { field: [messages] } }` and appear under the matching input.
- **The frontend's route protection is only for UX.** The real security is the backend middleware.

<details>
<summary><b>🗄️ Database schema (ER diagram)</b></summary>

```mermaid
erDiagram
    User ||--o{ Submission : "submits"
    User ||--o{ Submission : "last reviewed"
    User ||--o{ Feedback : writes
    Submission ||--o{ Feedback : "review history"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        Role role "STUDENT | MENTOR"
        datetime createdAt
    }
    Submission {
        string id PK
        string projectName
        string repoUrl "as typed"
        string repoUrlKey UK "normalized, duplicate guard"
        string liveUrl
        string description
        SubmissionStatus status "PENDING | APPROVED | REJECTED"
        string studentId FK
        string reviewedById FK "nullable"
        datetime reviewedAt
        datetime createdAt
    }
    Feedback {
        string id PK
        SubmissionStatus decision
        int mark "0-100, CHECK constraint, nullable"
        string comment "nullable"
        string submissionId FK
        string mentorId FK
        datetime createdAt
    }
```

Indexes: `submissions(status, createdAt)` for the mentor table and `submissions(studentId)` for "my submissions".

</details>

<details>
<summary><b>📁 Project structure</b></summary>

```
SubmitDesk/
├── backend/
│   ├── api/index.ts            # Vercel function entry (re-exports the Express app)
│   ├── prisma/                 # schema, migrations, seed
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # signup, login, logout, me
│   │   │   ├── submissions/    # student: create, list, edit, delete
│   │   │   ├── reviews/        # mentor: list, stats, review, grade
│   │   │   └── students/       # mentor: students directory
│   │   ├── middlewares/        # authenticate, authorize, validate, rate limits, errors
│   │   ├── lib/                # prisma, jwt, URL normalizing, client IP
│   │   └── config/env.ts       # env checked with zod at startup
│   ├── tests/                  # 52 API tests
│   └── postman/                # Postman collection
└── frontend/
    └── src/
        ├── app/                # landing, (auth), student/, mentor/ (dashboard, students)
        ├── components/         # mentor/, student/, auth/, shared/, ui/ (shadcn)
        ├── hooks/              # TanStack Query hooks
        ├── schemas/            # zod (mirrors the backend)
        └── proxy.ts            # role redirects + signed visitor IP
```

</details>

<details>
<summary><b>⚖️ Product decisions</b> (the task left these open on purpose)</summary>

| Question | Decision | Why |
|---|---|---|
| What is a "duplicate submission"? | The same **normalized repo URL** anywhere in the system (lowercased, no `www.`, trailing `/` or `.git`) | One repo = one project. Stops `GitHub.com/a/b/` vs `github.com/a/b.git` tricks |
| Where is duplication enforced? | A **database unique constraint** on `repoUrlKey`, plus a friendly check in the service | A service check alone has a race condition. The constraint is the real guarantee (`P2002` → 409) |
| Roles | `STUDENT`, `MENTOR` | Mentor = admin, seeded in the database |
| Can a mentor sign up? | No. Signup always creates a `STUDENT` | `role` is never read from the request body |
| Can a submission be reviewed twice? | Only `PENDING` ones (conditional `updateMany … where status = PENDING`) | Two mentors at once → one wins, the other gets 409 |
| Edit and delete | Allowed while `PENDING` or `REJECTED`. **Approved projects are locked** (409). Deleting frees the repo URL | Students can fix mistakes, but an approval is final |
| Resubmission | Editing a rejected project puts it back to `PENDING`. Earlier reviews stay in the history | Realistic flow that keeps the past feedback |
| Review flow | ① `/review` (decision), ② `/grade` (mark + feedback), any time after | Decision and grading are separate jobs |
| Marks | Whole number 0–100 per review, enforced by zod and a DB `CHECK` | One clear scale. Each resubmission gets its own mark |
| Feedback | Optional for both decisions (max 500 characters) | Write only when there is something to say |
| Who sees what? | Students see only their own submissions, mentors see all | Data privacy |
| Pagination | Offset (`page`, `limit` ≤ 50) | Simple, and fits "Page X of Y" |
| Filters | Server side: `status`, `search`, `sort`, kept in the URL | Required by the task. Refresh, back and shared links work |
| Token storage | JWT in an **httpOnly cookie**. The frontend proxies `/api/*` | JavaScript (XSS) can't read the token, and the cookie stays first-party |
| Rate limits | Global 100 / 15 min per IP · login 10 **failed** / 15 min · signup 10 / 15 min · create/edit 5 / hour **per student** (failed requests don't count) | Spam protection without locking out real users |

> Rate-limit counters are in memory, so each server instance keeps its own. That's fine for spam protection. For strict global limits, use a shared store such as Upstash Redis.

</details>

---

## 💻 Getting started

**Prerequisites:** Node.js 20+ and a PostgreSQL 16 database (a free [Neon](https://neon.tech) database or a local install).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, SEED_MENTOR_*
npx prisma migrate dev      # create the tables
npm run db:seed             # mentors, 6 students, 28 submissions
npm run dev                 # http://localhost:5050/api/health → { "ok": true }

# 2. Frontend (in a second terminal)
cd frontend
npm install
cp .env.example .env.local  # BACKEND_URL + the SAME JWT_SECRET as the backend
npm run dev                 # http://localhost:3000
```

<details>
<summary><b>🔑 Environment variables</b></summary>

**`backend/.env`**

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `5050` | Optional (not 5000: macOS AirPlay uses it) |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `DATABASE_URL` | `postgresql://user:password@host/db?sslmode=require` | Required. On Neon, use the **pooled** URL |
| `JWT_SECRET` | 32+ random characters | Required. Generate one with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `1d` | Optional |
| `CLIENT_URL` | `http://localhost:3000` | Optional CORS origin, only needed if a browser calls the API directly |
| `SEED_MENTOR_EMAIL` / `SEED_MENTOR_PASSWORD` | your own | Your private mentor account, created by the seed |

The server checks these with zod at startup and exits with a clear message if one is missing.

**`frontend/.env.local`**

| Variable | Example | Notes |
|---|---|---|
| `BACKEND_URL` | `http://localhost:5050` | Where `/api/*` is proxied. Read at **build time** |
| `JWT_SECRET` | same as the backend | `proxy.ts` uses it to read the role and sign the visitor IP |

</details>

<details>
<summary><b>📜 Scripts</b></summary>

| Backend | |
|---|---|
| `npm run dev` | Start with hot reload |
| `npm run build` / `npm start` | Generate the Prisma client, compile to `dist/`, run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | API tests (Vitest + Supertest) |
| `npm run db:migrate` · `db:deploy` · `db:seed` · `db:studio` | Prisma helpers |

| Frontend | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |

</details>

---

## 🧪 Testing

The **52 API tests** in [`backend/tests/`](backend/tests) cover the rules that matter most:

- ✅ duplicate repos → 409, including `.git`, trailing `/`, uppercase and two identical requests racing
- ✅ RBAC → 401 without a token, 403 for the wrong role, 403 on someone else's project
- ✅ two mentors reviewing at once → one 200, one 409, and only one review saved
- ✅ marks: 0 and 100 accepted; missing, −1, 101, 72.5 and `"90"` rejected; grading a pending project → 409
- ✅ edit and delete rules per status, approved projects locked
- ✅ students directory counts and average mark
- ✅ server-side filters, search, pagination and stats
- ✅ signup can never create a mentor, and login doesn't reveal whether an email exists
- ✅ a forged client-IP header is ignored, so rate limits can't be dodged

The tests use a **separate database** and refuse to run unless its name contains `test`:

```bash
createdb submitdesk_test    # once
cd backend && npm test      # migrations are applied automatically
```

Set `TEST_DATABASE_URL` if your local Postgres needs a password. A ready-made **Postman collection** is in [`backend/postman/`](backend/postman/SubmitDesk.postman_collection.json).

---

## 📡 API reference

Base URL: `/api`. Success: `{ success: true, message, data, meta? }`. Error: `{ success: false, message, errors? }`.

<details>
<summary><b>Show all endpoints</b></summary>

| Method | Endpoint | Role | Body / Query | Success | Errors |
|---|---|---|---|---|---|
| GET | `/health` | Public | — | 200 | — |
| POST | `/auth/signup` | Public | `name, email, password` | 201 + cookie | 400, 409, 429 |
| POST | `/auth/login` | Public | `email, password` | 200 + cookie | 400, 401, 429 |
| POST | `/auth/logout` | Any | — | 200 | — |
| GET | `/auth/me` | Logged in | — | 200 user | 401 |
| POST | `/submissions` | STUDENT | `projectName, repoUrl, liveUrl, description` | 201 | 400, 401, 403, 409, 429 |
| GET | `/submissions/me` | STUDENT | — | 200 list (with latest review) | 401, 403 |
| PATCH | `/submissions/:id` | STUDENT (owner) | same as create | 200 (REJECTED → PENDING) | 400, 403, 404, 409, 429 |
| DELETE | `/submissions/:id` | STUDENT (owner) | — | 200 | 403, 404, 409 |
| GET | `/mentor/stats` | MENTOR | — | 200 counts | 401, 403 |
| GET | `/mentor/submissions` | MENTOR | `?page&limit&status&search&sort` | 200 items + `meta` | 400, 401, 403 |
| GET | `/mentor/submissions/:id` | MENTOR | — | 200 + full review history | 401, 403, 404 |
| PATCH | `/mentor/submissions/:id/review` | MENTOR | `decision`, `mark?` (0–100), `comment?` | 200 | 400, 401, 403, 404, 409 |
| PATCH | `/mentor/submissions/:id/grade` | MENTOR | `mark` (0–100), `comment?` (empty clears it) | 200 | 400, 401, 403, 404, 409 |
| GET | `/mentor/students` | MENTOR | `?page&limit&search` | 200 items (`counts`, `averageMark`) + `meta` | 400, 401, 403 |
| GET | `/mentor/students/:id` | MENTOR | — | 200 student + all submissions | 401, 403, 404 |

**Validation:** the repo URL must be `https://github.com/<user>/<repo>`, the live URL must use `https://`, the description must be 20–1000 characters, and the password must be 8+ characters with an uppercase letter and a number.

</details>

---

## ☁️ Deployment

Both apps deploy to **Vercel as two projects from this one repo**, with a **Neon** database. Every push to `main` deploys both.

<details>
<summary><b>Step-by-step</b></summary>

**1. Database (Neon).** Use the **pooled** connection string (the host contains `-pooler`), then apply the migrations and seed once from your machine:

```bash
cd backend
npm run db:deploy   # with DATABASE_URL pointing at Neon; run again after every new migration
npm run db:seed
```

**2. Backend project.** Vercel → Add New → Project → import the repo:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Framework Preset | **Other** |
| Environment variables | `DATABASE_URL`, `JWT_SECRET` (32+ chars), `JWT_EXPIRES_IN=1d` |

[`backend/api/index.ts`](backend/api/index.ts) re-exports the Express app as one Node function. [`backend/vercel.json`](backend/vercel.json) rewrites every request to it, runs `npm run build` (so type errors still fail the deploy) and pins the region to `cle1`, next to Neon's `us-east-2`. `public/` holds only a `robots.txt`, because Vercel needs a non-empty output folder.

> **Why not the Express preset?** It type-checks ESM imports as if they were CommonJS, so dual-format packages like `helmet` and `express-rate-limit` fail with "This expression is not callable", even though the code compiles and runs fine.

**3. Frontend project.** Import the same repo again:

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Next.js |
| Environment variables | `BACKEND_URL=https://<backend>.vercel.app`, `JWT_SECRET` (**same** as the backend) |

Set both **before** the first build, because the `/api` rewrite is baked in at build time.

**How the two talk:** the browser only calls the frontend's `/api/*`, which Next.js rewrites to the backend, so the auth cookie stays first-party. Vercel shows the backend the frontend's IP for every visitor, so `proxy.ts` forwards the real visitor IP in `x-client-ip`, signed with HMAC-SHA256. The backend trusts it only when the signature is valid ([`lib/client-ip.ts`](backend/src/lib/client-ip.ts)).

</details>

---

## 🎥 Video lessons

| Topic | Link |
|---|---|
| _Category 1 topic_ | _add link_ |
| _Category 2 topic_ | _add link_ |

---

## 🏁 Conclusion

SubmitDesk turns a messy, chat-and-spreadsheet review process into a clear, trackable workflow:

- **Students** always know where their project stands, what mark it got and why.
- **Mentors** get one dashboard to filter, review, grade and follow every student's progress.
- **The system** enforces the rules itself: no duplicates, no double reviews, no role tricks, no spam.

It's a small codebase built with production habits: strict TypeScript end to end, validation on both sides, database constraints as the final safety net, race-safe writes, accessible UI, real API tests and automatic deploys.

<div align="center">

**[Open the live app →](https://submitdesk-frontend.vercel.app)**

Made with TypeScript, Next.js and Express

</div>
