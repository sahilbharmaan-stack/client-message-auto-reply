"""Expose the FastAPI API and the built frontend on Vercel."""

from backend.main import app

app.frontend("/", directory="dist", fallback="index.html")