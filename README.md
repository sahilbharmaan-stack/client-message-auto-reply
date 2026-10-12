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

## Backend API

FastAPI documentation is available at `http://127.0.0.1:8000/docs` while the
backend is running. The supported API includes conversation CRUD and message
history, auto-reply-rule CRUD, dashboard and daily analytics, demo seeding,
and conversation CSV export.
