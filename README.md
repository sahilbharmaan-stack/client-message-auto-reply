# Client Message Auto Reply

A React/Vite inbox backed by a FastAPI API and SQLite. Features include customer
conversations and message history, keyword-based automatic replies, reply-rule
management, dashboard analytics, demo data, and CSV export.

## Run locally (Windows)

1. Install the frontend dependencies from the repository root:

   ```powershell
   npm install
   ```

2. In a second terminal, install and start the backend from the repository root:

   ```powershell
   py -m venv backend\venv
   backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
   backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload
   ```

3. Start the frontend from the repository root:

   ```powershell
   npm run dev
   ```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).
The frontend proxies `/api` requests to the backend at `http://127.0.0.1:8000`.
If the backend runs elsewhere, set `VITE_API_BASE_URL` to its base URL or update
the Vite proxy target in `vite.config.ts`.
The local demo admin login defaults to `admin@company.com` / `admin123`; these
defaults are disabled on Render and must never be used for a deployed service.

## Deploy

Vercel runs the FastAPI API and serves the built Vite frontend from the same
deployment. Set `SECRET_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the Vercel
project's Environment Variables for Production and Preview before deploying.
The Vercel function stores SQLite in `/tmp`, which is temporary and may not be
shared between function instances. For data that must persist, deploy the API
using the included `render.yaml` and configure `VITE_API_BASE_URL` with its URL.

1. In Vercel Project Settings → Environment Variables, set the three required
   secrets. Do not use the local demo credentials for a deployed service.
2. Deploy the repository on Vercel. `main.py` serves the FastAPI API and the
   production Vite build; frontend API requests use the same deployment origin.
3. To keep conversations and rules across restarts, create a Render Blueprint
   using `render.yaml`, then set Vercel's `VITE_API_BASE_URL` to the Render API
   URL and redeploy. SQLite on Vercel is only suitable for temporary demos.

The admin API endpoints require a bearer token from the login endpoint. The
customer chat endpoints remain public by design; add customer identity and
conversation-level authorization before using them for sensitive customer data.

## Backend API

FastAPI documentation is available at `http://127.0.0.1:8000/docs` while the
backend is running. The supported API includes conversation CRUD and message
history, auto-reply-rule CRUD, dashboard and daily analytics, demo seeding,
and conversation CSV export.
