# Vercel serverless entrypoint — imports the FastAPI app so `app/` stays
# framework-agnostic and could move to another host later without changes.
from app.main import app  # noqa: F401
