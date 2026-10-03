# AI Career Intelligence Platform (MERN)

Track job applications, analyze your resume with AI, match it against job descriptions, practice interviews, and get career recommendations.

A MERN app: **M**ongoDB · **E**xpress · **R**eact · **N**ode. The AI features run inside the Express backend, so there are only two apps to run.

```
React (Vite + Tailwind + Recharts)  ->  Express API (Node)  ->  MongoDB
                                             |
                                             +-->  services/ai/*  ->  LLM API (optional)
```

| Folder | What it is |
|---|---|
| `frontend/` | React 18, Vite, Tailwind CSS 3, Recharts, React Router |
| `backend/` | Node + Express, Mongoose, JWT + bcrypt, Multer, and the AI modules in `backend/services/ai/` |

## Run locally

You need Node 18+ and a MongoDB instance (local, Docker, or Atlas).

```bash
# 0. MongoDB (skip if you already have one)
docker run -d -p 27017:27017 --name mongo mongo:7

# 1. Backend  (http://localhost:5000)
cd backend
npm install
cp .env      # set JWT_SECRET (and MONGO_URI if not local)
npm run dev

# 2. Frontend  (http://localhost:5173)
cd frontend
npm install
cp .env
npm run dev
```

Register an account, upload a PDF resume, then explore.

## LLM vs. rule-based mode

The AI features work **without any API key**: every one has a rule-based
fallback (skill dictionary, section/metric heuristics, a question bank).

Put `GROQ_API_KEY` in `backend/.env` and restart to switch on LLM-powered
resume review, tailored interview questions, real answer grading and
personalised career recommendations.

The model is configured using:

`LLM_MODEL=openai/gpt-oss-120b`

If an LLM call fails, the app silently falls back to the rule-based result.

Be aware of what the fallback can and cannot do:

- Resume scores and job-match scores are heuristics: useful for relative comparison, not a real ATS result.
- Skill extraction only knows the skills in `backend/services/ai/skills.js`; extend that dictionary for your field.
- Interview answer grading without an LLM only looks at length, structure and keyword coverage. It cannot judge technical correctness.
- "Confidence" in the interview report is an estimate from score consistency and communication, not measured directly.

## Backend layout

```
backend/
  server.js
  config/db.js
  models/        User, Resume, Job, Application, Interview
  controllers/   auth, resume, job (matcher + tracker), interview, dashboard
  routes/        auth, resume, job, interview, dashboard, career
  middleware/    authMiddleware (JWT), uploadMiddleware (Multer, PDF only, 5 MB)
  services/
    aiService.js         facade used by the controllers
    ai/                  skills, llm, pdfParser, resumeAnalyzer, jobMatcher, interviewEngine, career
```

## API overview

All routes except the public auth ones need `Authorization: Bearer <JWT>`.

| Route | Purpose |
|---|---|
| `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password/:token` | Auth |
| `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/password` | Profile |
| `POST /api/resume/upload` (field `resume`, PDF) · `GET /api/resume` · `DELETE /api/resume/:id` | Resume analyzer |
| `POST /api/jobs/match` · `GET /api/jobs/matches` | Job description matcher |
| `GET/POST /api/jobs/applications` · `PUT/DELETE /api/jobs/applications/:id` | Application tracker |
| `POST /api/interview/start` · `POST /api/interview/:id/answer` · `GET /api/interview[/:id]` | AI interviewer |
| `GET /api/dashboard` | Aggregated chart data |
| `POST /api/career/recommendations` | Career analysis |

## Notes

- **Password reset**: no email provider is configured. The reset link is printed in the backend console and, when `NODE_ENV` is not `production`, shown on the forgot-password page. Plug a mailer (Resend, SendGrid, Nodemailer) into `forgotPassword` in `backend/controllers/authController.js` before going live.
- **File storage**: uploaded PDFs are saved to `backend/uploads/` on local disk. Render/Railway disks are ephemeral by default, so for production use object storage (S3, Cloudinary) or a persistent disk. Extracted text is stored in MongoDB, so analysis still works if the file disappears.
- **Security before deploying**: set a long random `JWT_SECRET`, restrict `CLIENT_URL` (CORS), and add rate limiting (`express-rate-limit`) on the auth and AI routes, since the AI routes can spend LLM credits.

## Deployment

- **Backend (Render/Railway)**: root `backend`, build `npm install`, start `npm start`. Env: `MONGO_URI` (MongoDB Atlas), `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), `NODE_ENV=production`, optional `GROQ_API_KEY`.
- **Frontend (Vercel)**: root `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL=https://<your-backend>/api`. The included `vercel.json` handles client-side routing.
- Deploy the backend first (you need its URL for the frontend), then set the backend's `CLIENT_URL` to the final Vercel URL, because CORS blocks requests otherwise.
