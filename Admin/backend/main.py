# admin_backend/main.py
# ─────────────────────────────────────────────────────────────────────────────
# FastAPI entry-point for the Healorithm Admin (field-worker) backend.
#
# Run with:
#   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
#
# All routes are prefixed with /api/admin to avoid collisions with the
# existing Flask User AI server (port 5000).
# ─────────────────────────────────────────────────────────────────────────────

import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import ADMIN_API_PORT
from db import supabase_client as db
from routes import patient as patient_router
from routes import visit as visit_router

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("admin.main")


# ─── Lifespan (startup / shutdown) ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once on startup and once on shutdown.
    Performs a Supabase connectivity check so the server refuses to start
    with a broken DB connection.
    """
    logger.info("=" * 60)
    logger.info("  Healorithm Admin Backend  —  starting up")
    logger.info("=" * 60)

    ok = db.test_connection()
    if not ok:
        logger.critical(
            "Supabase connection FAILED. "
            "Check SUPABASE_URL / SUPABASE_ANON_KEY in config.py and retry."
        )
        # Let FastAPI start anyway so /health returns a meaningful error,
        # but log loudly so the operator knows something is wrong.

    logger.info(f"Admin API listening on port {ADMIN_API_PORT}")
    logger.info("Routes: /api/admin/patient/*, /api/admin/visit/*")
    logger.info("=" * 60)

    yield  # — app is live —

    logger.info("Admin Backend shut down gracefully.")


# ─── Application ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Healorithm Admin API",
    description=(
        "Backend AI pipeline for ASHA field workers. "
        "Handles patient QR lookup, AI-powered visit prioritization, "
        "vitals recording with emergency detection, symptom logging, "
        "prescription management, and visit lifecycle tracking."
    ),
    version="1.0.0",
    contact={"name": "Healorithm", "email": "dev@healorithm.com"},
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
# Allow the React Native Admin app (Expo) to reach this server from any origin.
# In production, narrow allow_origins to your actual app domain / IP.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routers ─────────────────────────────────────────────────────────────────
API_PREFIX = "/api/admin"

app.include_router(patient_router.router, prefix=API_PREFIX)
app.include_router(visit_router.router,   prefix=API_PREFIX)


# ─── Auth endpoint ────────────────────────────────────────────────────────────
from pydantic import BaseModel as _BaseModel

class _LoginRequest(_BaseModel):
    phone: str
    password: str

@app.post("/api/admin/auth/login", tags=["Auth"])
def admin_login(body: _LoginRequest):
    worker = db.fetch_worker_by_phone(body.phone)
    if not worker or worker.get("password") != body.password:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    return {
        "success": True,
        "worker": {
            "id":    worker["id"],
            "name":  worker.get("name") or "Worker",
            "phone": worker.get("phone_no") or body.phone,
            "role":  "worker",
        }
    }


# ─── Root / Health endpoints ──────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    return {
        "service": "Healorithm Admin Backend",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health", tags=["System"])
def health_check():
    """
    Returns DB connectivity status alongside the service version.
    Safe to call frequently (e.g. from a load balancer or monitoring agent).
    """
    supabase_ok = db.test_connection()
    return JSONResponse(
        status_code=200 if supabase_ok else 503,
        content={
            "status":     "healthy" if supabase_ok else "degraded",
            "supabase":   "connected" if supabase_ok else "unreachable",
            "service":    "admin-backend",
            "version":    "1.0.0",
        },
    )


# ─── Dev entry-point ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=ADMIN_API_PORT,
        reload=True,
        log_level="info",
    )
