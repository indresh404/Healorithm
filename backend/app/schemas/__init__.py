# backend/app/schemas/__init__.py
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel


class OutboxRecord(BaseModel):
    id: str
    table_name: str
    record_id: str
    action: str = "insert"
    priority: str = "normal"
    payload_cipher: str  # AES-GCM ciphertext or JSON string (encrypted on-device)
    timestamp: str


class PushSyncRequest(BaseModel):
    # client_id and last_sync_timestamp are optional for backward compat
    client_id: Optional[str] = None
    last_sync_timestamp: Optional[str] = None
    records: List[OutboxRecord] = []


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
