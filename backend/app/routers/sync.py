# backend/app/routers/sync.py
from datetime import datetime, timezone
from fastapi import APIRouter
from ..schemas import PushSyncRequest, PushSyncResponse

router = APIRouter(prefix="/sync", tags=["Sync"])

@router.post("/push", response_model=PushSyncResponse)
def push_sync(payload: PushSyncRequest):
    return PushSyncResponse(
        status="success",
        synced_count=len(payload.records),
        conflicts=[],
        server_timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.get("/pull")
def pull_sync(since: str = "1970-01-01T00:00:00Z"):
    return {
        "deltas": [],
        "server_timestamp": datetime.now(timezone.utc).isoformat()
    }
