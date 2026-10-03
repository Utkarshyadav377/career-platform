# AI Career Intelligence Platform

> Track job applications, analyze your resume with AI, match it against job descriptions, practice mock interviews, and get personalized career recommendations, all in one MERN application.

![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [LLM vs. Rule-Based Mode](#llm-vs-rule-based-mode)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Production Notes](#production-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **AI Career Intelligence Platform** is a full-stack MERN application (**M**ongoDB, **E**xpress, **R**eact, **N**ode.js) that helps job seekers manage their search and improve their candidacy. All AI features run inside the Express backend, so there are only two apps to run: the API and the frontend.

## Features

| Feature | Description |
|---|---|
| **Resume Analyzer** | Upload a PDF resume and receive a score, section analysis, and improvement suggestions. |
| **Job Description Matcher** | Compare your resume against a job description to see match score and skill gaps. |
| **Application Tracker** | Create, update, and manage job applications through your pipeline. |
| **AI Interviewer** | Practice with tailored interview questions and get graded feedback with an end-of-session report. |
| **Career Recommendations** | Receive personalized career-path analysis based on your profile. |
| **Dashboard** | Aggregated charts and insights across all your activity. |
| **Authentication** | JWT-based auth with bcrypt password hashing and password reset flow. |

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS 3, Recharts, React Router |
| **Backend** | Node.js, Express, Mongoose, JWT, bcrypt, Multer |
| **Database** | MongoDB |
| **AI** | Groq-hosted LLM (optional) with rule-based fallbacks |

## Architecture

```
React (Vite + Tailwind + Recharts)
            │
            ▼
     Express API (Node)  ──►  MongoDB
            │
            └──►  services/ai/*  ──►  LLM API (optional)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **MongoDB**: local install, Docker, or [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Start MongoDB (skip if you already have an instance)

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

### 2. Run the backend (`http://localhost:5000`)

```bash
cd backend
npm install
cp .env.example .env   # then set JWT_SECRET (and MONGO_URI if not local)
npm run dev
```

### 3. Run the frontend (`http://localhost:5173`)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the app, register an account, upload a PDF resume, and start exploring.

---

## Configuration

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes (if not local) | MongoDB connection string. |
| `JWT_SECRET` | Yes | Long, random secret used to sign JWTs. |
| `CLIENT_URL` | Production | Allowed frontend origin for CORS. |
| `NODE_ENV` | No | Set to `production` when deployed. |
| `GROQ_API_KEY` | No | Enables LLM-powered features. |
| `LLM_MODEL` | No | Model name, e.g. `openai/gpt-oss-120b`. |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL, e.g. `http://localhost:5000/api`. |

---

## LLM vs. Rule-Based Mode

Every AI feature works **without an API key** thanks to built-in rule-based fallbacks (skill dictionary, section and metric heuristics, and a question bank).

To enable LLM-powered resume review, tailored interview questions, real answer grading, and personalized career recommendations, add the following to `backend/.env` and restart:

```env
GROQ_API_KEY=your_api_key_here
LLM_MODEL=openai/gpt-oss-120b
```

If an LLM call fails, the app silently falls back to the rule-based result.

### Fallback limitations

- Resume and job-match scores are heuristics: useful for relative comparison, **not** a real ATS result.
- Skill extraction only recognizes skills listed in `backend/services/ai/skills.js`. Extend that dictionary for your field.
- Interview grading without an LLM only considers length, structure, and keyword coverage. It cannot judge technical correctness.
- The interview "confidence" metric is an estimate derived from score consistency and communication, not a direct measurement.

---

## Project Structure

```
backend/
├── server.js
├── config/
│   └── db.js
├── models/            # User, Resume, Job, Application, Interview
├── controllers/       # auth, resume, job (matcher + tracker), interview, dashboard
├── routes/            # auth, resume, job, interview, dashboard, career
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   └── uploadMiddleware.js   # Multer, PDF only, 5 MB limit
└── services/
    ├── aiService.js          # Facade used by controllers
    └── ai/                   # skills, llm, pdfParser, resumeAnalyzer,
                              # jobMatcher, interviewEngine, career

frontend/
└── React + Vite application
```

---

## API Reference

All routes except the public auth endpoints require the header:

```
Authorization: Bearer <JWT>
```

| Method & Route | Purpose |
|---|---|
| `POST /api/auth/register` · `/login` · `/forgot-password` · `/reset-password/:token` | Authentication |
| `GET /api/auth/me` · `PUT /api/auth/profile` · `PUT /api/auth/password` | Profile management |
| `POST /api/resume/upload` (field `resume`, PDF) · `GET /api/resume` · `DELETE /api/resume/:id` | Resume analyzer |
| `POST /api/jobs/match` · `GET /api/jobs/matches` | Job description matcher |
| `GET/POST /api/jobs/applications` · `PUT/DELETE /api/jobs/applications/:id` | Application tracker |
| `POST /api/interview/start` · `POST /api/interview/:id/answer` · `GET /api/interview[/:id]` | AI interviewer |
| `GET /api/dashboard` | Aggregated chart data |
| `POST /api/career/recommendations` | Career analysis |

---

## Deployment

Deploy the **backend first**, since the frontend needs its URL. Then set the backend's `CLIENT_URL` to the final frontend URL, otherwise CORS will block requests.

### Backend (Render / Railway)

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm install` |
| Start command | `npm start` |
| Environment | `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), `NODE_ENV=production`, optional `GROQ_API_KEY` |

### Frontend (Vercel)

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `VITE_API_URL=https://<your-backend>/api` |

The included `vercel.json` handles client-side routing.

---



## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

Distributed under the MIT License. See `LICENSE` for details.