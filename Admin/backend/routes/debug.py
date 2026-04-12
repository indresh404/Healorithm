# admin_backend/routes/debug.py
# ─────────────────────────────────────────────────────────────────────────────
# Debug endpoints for troubleshooting the AI pipeline
# ─────────────────────────────────────────────────────────────────────────────

import logging
from fastapi import APIRouter

from db import supabase_client as db

logger = logging.getLogger("admin.debug")
router = APIRouter(tags=["Debug"])


@router.get("/debug/status", summary="System health check")
def debug_status():
    """Check Supabase connection and data availability."""
    try:
        # Test connection
        connection_ok = db.test_connection()
        
        # Count all workers
        workers_res = db.get_client().table("worker").select("id, name, phone_no").execute()
        workers = workers_res.data or []
        
        # Count all patients
        patients_res = db.get_client().table("users").select("id, name").execute()
        patients = patients_res.data or []
        
        # Check worker_assignments table
        try:
            assignments_res = db.get_client().table("worker_assignments").select("*").execute()
            assignments = assignments_res.data or []
        except Exception as e:
            assignments = []
            logger.error(f"worker_assignments table error: {e}")
        
        return {
            "status": "healthy" if connection_ok else "unhealthy",
            "supabase_connected": connection_ok,
            "database_stats": {
                "total_workers": len(workers),
                "total_patients": len(patients),
                "total_assignments": len(assignments),
            },
            "workers": [{"id": w["id"], "name": w["name"], "phone": w["phone_no"]} for w in workers],
            "sample_patients": [{"id": p["id"], "name": p["name"]} for p in patients[:3]],
            "assignments": assignments,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "supabase_connected": False,
        }


@router.get("/debug/worker/{worker_id}", summary="Check worker assignment")
def debug_worker_assignment(worker_id: str):
    """Check what patients are assigned to a specific worker."""
    try:
        assignment = db.fetch_worker_assignment(worker_id)
        
        if not assignment:
            # Try to create one
            all_patient_ids = db.fetch_all_patient_ids()
            return {
                "worker_id": worker_id,
                "assignment_found": False,
                "available_patients": len(all_patient_ids),
                "message": "No assignment found — backend will use all patients as fallback",
                "all_patient_ids": all_patient_ids[:5],  # Show first 5
            }
        
        assigned_ids = assignment.get("assigned_patients") or []
        
        # Fetch patient names for display
        patients = db.fetch_patients_by_ids(assigned_ids)
        
        return {
            "worker_id": worker_id,
            "assignment_found": True,
            "total_assigned": len(assigned_ids),
            "assigned_patient_ids": assigned_ids[:10],  # Show first 10
            "assigned_patients": [{"id": p["id"], "name": p["name"]} for p in patients[:5]],
        }
    except Exception as e:
        return {
            "worker_id": worker_id,
            "error": str(e),
        }
