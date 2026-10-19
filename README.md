# SubmitDesk — Project Review Dashboard

Students submit their projects (GitHub repo + live site). Mentors review them in a dashboard and approve or reject them with feedback.

- **Frontend:** Next.js 16 (App Router), TailwindCSS 4, shadcn/ui, Motion (Framer Motion) animations, TanStack Query, react-hook-form + zod
- **Backend:** Express 5, Prisma 7, PostgreSQL, JWT (httpOnly cookie), zod, express-rate-limit
- **Language:** TypeScript everywhere (`strict: true`)

## Live links

| | URL |
|---|---|
| Frontend | _add after deploy_ |
| Backend health | _add after deploy_ → `/api/health` |

## Demo credentials

The login page has **one-click demo buttons** for both roles. You can also type these in:

| Role | Email | Password |
|---|---|---|
| Demo mentor | `mentor.demo@submitdesk.dev` | `Demo@12345` |
| Demo student | `student.demo@submitdesk.dev` | `Demo@12345` |
| Other seeded students | `student1@example.com` … `student5@example.com` | `Student@12345` |

The demo student already has one pending, one approved and one rejected project, so every state is visible right away. The main mentor account comes from `SEED_MENTOR_EMAIL` / `SEED_MENTOR_PASSWORD` in `backend/.env` and is never shown in the app.

Anyone can create a **student** account at `/signup`. Mentor accounts can't be created through the app. They only come from the seed script.

---

## Product decisions

The task leaves some things open on purpose. These are the decisions this project makes:

| Question | Decision | Why |
|---|---|---|
| What is a "duplicate submission"? | The same **normalized repo URL** anywhere in the system (lowercased host and path, no `www.`, no trailing `/`, no `.git`) | One repo = one project. Normalizing stops `GitHub.com/a/b/` vs `github.com/a/b.git` tricks |
| Where is duplication enforced? | A **database unique constraint** on `repoUrlKey`, plus a friendly check in the service | A check in the service alone has a race condition. The DB constraint is the real guarantee (`P2002` → 409) |
| Roles | `STUDENT`, `MENTOR` | Mentor = admin, seeded in the DB |
| Can a mentor sign up? | No. Signup always creates a `STUDENT` | `role` is never read from the request body |
| Submission statuses | `PENDING` → `APPROVED` or `REJECTED` | Simple state machine |
| Can a submission be reviewed twice? | Only `PENDING` submissions can be reviewed (conditional `updateMany … where status = PENDING`) | Two mentors clicking at once → one wins, the other gets 409 instead of silently overwriting |
| Resubmission after rejection | The owner edits the rejected submission and it goes back to `PENDING` | Realistic flow. Avoids "duplicate" blocking a fixed project |
| Reject reason | Rejecting **requires** feedback (min 10 chars). Approval feedback is optional | Students need to know why they were rejected |
| Feedback model | A separate `Feedback` table (full review history) | A resubmitted project keeps its earlier reviews |
| Who sees which submissions? | Students only see their own. Mentors see all | Data privacy |
| Pagination | Offset-based (`page`, `limit`, max 50) | Simple, and fits "Page X of Y" |
| Filters | Server side: `status` (ALL / PENDING / APPROVED / REJECTED), `search` by project name, `sort` (newest / oldest) | The task requires server-side filters. Filter state lives in the URL, so refresh, back and shared links work |
| Stats | Total / Pending / Approved / Rejected from one `groupBy` query | One DB round trip |
| Token storage | JWT in an **httpOnly cookie**. The frontend proxies `/api/*` to Express | XSS can't read the token, and the cookie stays first-party |
| Rate limits | Global: 100 req / 15 min per IP. Login: 10 **failed** attempts / 15 min per IP. Signup: 10 / 15 min per IP. Create/resubmit: 5 / hour **per student** | Spam protection where it matters. Successful logins don't count, so real users and demo clicks are never locked out, while password guessing still is |
| Do failed submissions count toward the limit? | No. Only successful submissions count (`skipFailedRequests`) | A typo or a 409 shouldn't use up a student's quota. The global limiter still caps spam |

> **Rate-limit store:** the default store is in-memory. It resets on restart and isn't shared between server instances. With several instances in production, use a Redis store.

---

## Run it locally

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (a free [Neon](https://neon.tech) database, or a local install)

### 1. Database

Create a database (for example on Neon) and copy its connection string. It goes in `DATABASE_URL`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in the values (see the table below)
npx prisma migrate dev      # creates the tables and generates the Prisma client
npm run db:seed             # your mentor, demo mentor/student, 5 students, 28 submissions
npm run dev                 # http://localhost:5050/api/health → { "ok": true }
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # BACKEND_URL + the SAME JWT_SECRET as the backend
npm run dev                 # http://localhost:3000
```

### Environment variables

**`backend/.env`**

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `5050` | Optional, defaults to 5050 (not 5000: macOS AirPlay Receiver uses it) |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `DATABASE_URL` | `postgresql://user:password@host/db?sslmode=require` | Required |
| `JWT_SECRET` | 32+ random characters | Required. Generate one with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `1d` | Optional |
| `CLIENT_URL` | `http://localhost:3000` | Required. CORS origin |
| `SEED_MENTOR_EMAIL` | `mentor@example.com` | Used by the seed script |
| `SEED_MENTOR_PASSWORD` | `Mentor@12345` | Used by the seed script |

Blank values count as "not set". The server checks the env with zod at startup and exits with a clear message if a value is missing or invalid.

**`frontend/.env.local`**

| Variable | Example | Notes |
|---|---|---|
| `BACKEND_URL` | `http://localhost:5050` | Where `/api/*` is proxied. Read at **build time** (Next.js rewrites) |
| `JWT_SECRET` | same as backend | `proxy.ts` uses it to read the role for route protection |

### Useful scripts

| Backend | |
|---|---|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` / `npm start` | Generate the Prisma client, compile to `dist/`, run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the API tests (Vitest + Supertest) |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma helpers |

| Frontend | |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |

### Tests

The backend has 27 API tests in [`backend/tests/`](backend/tests). They cover the rules that matter most:

- duplicate repos → 409 (including `.git`, trailing `/`, uppercase, and two identical requests racing)
- RBAC → 401 without a token, 403 for the wrong role, 403 when resubmitting someone else's project
- two mentors reviewing the same submission at once → one 200, one 409, and only one feedback row
- signup can never create a mentor, and login doesn't reveal whether an email exists
- server-side filters, search, pagination and stats

The tests use a **separate local database**, never the one in `.env`, and refuse to run unless its name contains `test`:

```bash
createdb submitdesk_test    # once
cd backend && npm test      # migrations are applied automatically
```

If your local Postgres needs a password, set `TEST_DATABASE_URL=postgresql://user:password@localhost:5432/submitdesk_test`.

A Postman collection is in [`backend/postman/`](backend/postman/SubmitDesk.postman_collection.json). The login requests save the token into a collection variable automatically.

---

## Architecture

```
browser ──► Next.js (:3000) ──/api/* rewrite──► Express (:5050) ──► Prisma ──► PostgreSQL
              │ proxy.ts: redirects by role (UX only)
              └ pages + TanStack Query
```

- **Backend pattern:** `routes → controller → service → prisma`. Controllers handle HTTP. Services hold the business logic.
- **AuthN vs AuthZ:** `authenticate` verifies the JWT (401). `authorize("MENTOR")` checks the role (403). Services also check ownership (a student can't resubmit someone else's project → 403).
- **Validation:** zod schemas on the backend, mirrored on the frontend. Errors come back as `{ errors: { field: [messages] } }` and appear under the matching input.
- **Frontend protection is only UX.** The real security is the backend middleware. Hiding a page is not access control.

### ER diagram

```mermaid
erDiagram
    User ||--o{ Submission : "submits (StudentSubmissions)"
    User ||--o{ Submission : "last reviewed (ReviewedSubmissions)"
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
        string comment "nullable"
        SubmissionStatus decision
        string submissionId FK
        string mentorId FK
        datetime createdAt
    }
```

Indexes: `submissions(status, createdAt)` for the mentor table and `submissions(studentId)` for "my submissions".

---

## API reference

Base URL: `/api`. Every success response is `{ success: true, message, data, meta? }` and every error is `{ success: false, message, errors? }`.

| Method | Endpoint | Role | Body / Query | Success | Errors |
|---|---|---|---|---|---|
| GET | `/health` | Public | — | 200 | — |
| POST | `/auth/signup` | Public | `name, email, password` | 201 + cookie | 400, 409, 429 |
| POST | `/auth/login` | Public | `email, password` | 200 + cookie | 400, 401, 429 |
| POST | `/auth/logout` | Any | — | 200 | — |
| GET | `/auth/me` | Logged in | — | 200 user | 401 |
| POST | `/submissions` | STUDENT | `projectName, repoUrl, liveUrl, description` | 201 | 400, 401, 403, 409, 429 |
| GET | `/submissions/me` | STUDENT | — | 200 list (with latest feedback) | 401, 403 |
| PATCH | `/submissions/:id/resubmit` | STUDENT (owner) | same as create | 200 | 400, 403, 404, 409, 429 |
| GET | `/mentor/stats` | MENTOR | — | 200 counts | 401, 403 |
| GET | `/mentor/submissions` | MENTOR | `?page&limit&status&search&sort` | 200 items + `meta` | 400, 401, 403 |
| PATCH | `/mentor/submissions/:id/review` | MENTOR | `decision` (`APPROVED`/`REJECTED`), `comment` | 200 | 400, 401, 403, 404, 409 |

Validation rules: the repo URL must be `https://github.com/<user>/<repo>`, the live URL must use `https://`, the description must be 20–1000 characters, and the password must be 8+ characters with an uppercase letter and a number.

---

## Deployment

| Part | Where | Notes |
|---|---|---|
| Database | Neon | Migrations run on every backend deploy. Seed once with `npm run db:seed` |
| Backend | Render | [`render.yaml`](render.yaml) is a ready blueprint: **New → Blueprint** → pick the repo, then fill in the secret env vars. Build: `npm ci --include=dev && npx prisma migrate deploy && npm run build` · Start: `npm start` |
| Frontend | Vercel | Root directory `frontend`. Set `BACKEND_URL` (the Render URL) and `JWT_SECRET` (same as the backend) **before** building: the rewrite is baked in at build time |

After the first deploy, set the backend's `CLIENT_URL` to the Vercel URL and redeploy.

Because the browser only talks to the frontend's `/api`, the cookie stays first-party and `sameSite: "lax"` keeps working in production.

---

## Video lessons

| Topic | Link |
|---|---|
| _Category 1 topic_ | _add link_ |
| _Category 2 topic_ | _add link_ |
