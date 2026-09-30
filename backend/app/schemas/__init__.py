# backend/app/schemas/__init__.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class PushSyncRequest(BaseModel):
    client_id: str
    last_sync_timestamp: str
    records: List[Dict[str, Any]] = []

class PushSyncResponse(BaseModel):
    status: str
    synced_count: int
    conflicts: List[Dict[str, Any]] = []
    server_timestamp: str

class OutbreakClusterResult(BaseModel):
    cluster_id: int
    village_names: List[str]
    case_count: int
    predominant_symptoms: List[str]
    alert_level: str
