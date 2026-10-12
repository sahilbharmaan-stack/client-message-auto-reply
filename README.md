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

The frontend can be deployed to Vercel, but the FastAPI API and SQLite database
must run on a host with persistent storage. The included `render.yaml` deploys
the API to Render with a persistent disk; SQLite data would be lost if it were
stored in a Vercel function or on Render's temporary filesystem.

1. Create a Render Blueprint from this repository using `render.yaml`. Set
   `ADMIN_EMAIL` and `ADMIN_PASSWORD` when prompted. Render generates
   `SECRET_KEY`; the database is stored on the mounted persistent disk.
2. Set the Vercel project root to this repository and add
   `VITE_API_BASE_URL` with the URL of the deployed Render API (for example,
   `https://client-message-auto-reply-api.onrender.com`, without a trailing
   slash).
3. Deploy the repository on Vercel. The included `vercel.json` builds the root
   Vite app and routes client-side navigation to `index.html`.

The admin API endpoints require a bearer token from the login endpoint. The
customer chat endpoints remain public by design; add customer identity and
conversation-level authorization before using them for sensitive customer data.

## Backend API

FastAPI documentation is available at `http://127.0.0.1:8000/docs` while the
backend is running. The supported API includes conversation CRUD and message
history, auto-reply-rule CRUD, dashboard and daily analytics, demo seeding,
and conversation CSV export.
