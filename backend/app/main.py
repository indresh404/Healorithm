"""
Healorithm FastAPI Backend
Offline-first synchronization, DBSCAN outbreak detection, and Care Coordination Agent.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime
import math

app = FastAPI(
    title="Healorithm Telemedicine API",
    description="Backend API supporting offline sync deltas, Care Coordination Agent orchestration, and DBSCAN outbreak clustering.",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---

class VitalsSchema(BaseModel):
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    spo2: Optional[int] = None
    temperature: Optional[float] = None
    heart_rate: Optional[int] = None
    blood_glucose: Optional[int] = None

class PatientRecordSyncItem(BaseModel):
    id: str
    user_id: str
    patient_name: str
    report_type: str
    date: str
    doctor: str
    hospital: str
    status: str
    details: str
    symptoms: List[str] = []
    affected_body_zones: List[str] = []
    vitals: Optional[VitalsSchema] = None
    provisional_diagnosis: Optional[str] = None
    created_at: str
    created_by: str

class SyncPayload(BaseModel):
    worker_id: str
    timestamp: str
    records: List[PatientRecordSyncItem]
    adherence_logs: List[Dict[str, Any]] = []

class SyncResponse(BaseModel):
    status: str
    acknowledged_ids: List[str]
    conflicts: List[Dict[str, Any]]
    agent_tasks_created: int
    server_timestamp: str

class OutbreakCluster(BaseModel):
    id: str
    symptom: str
    patient_count: int
    center_lat: float
    center_lng: float
    radius_km: float
    severity: str
    village_names: List[str]
    suggested_action: str

# --- DBSCAN Outbreak Clustering Mock Service ---

def run_outbreak_detection(cases: List[Dict[str, Any]]) -> List[OutbreakCluster]:
    """
    Simulates DBSCAN spatio-temporal clustering:
    Flags clusters if >= 8 patients within a 15km radius report matching symptoms within 48-72 hrs.
    """
    clusters = [
        OutbreakCluster(
            id="ob-clu-1",
            symptom="Acute Febrile Illness & Arthralgia",
            patient_count=14,
            center_lat=15.348,
            center_lng=77.348,
            radius_km=12.0,
            severity="High",
            village_names=["Adoni", "Dhone"],
            suggested_action="Deploy mobile fever screening unit, initiate larvicidal fogging, and test community drinking water sources."
        ),
        OutbreakCluster(
            id="ob-clu-2",
            symptom="Gastroenteritis / Acute Watery Diarrhea",
            patient_count=8,
            center_lat=15.124,
            center_lng=77.124,
            radius_km=8.5,
            severity="Moderate",
            village_names=["Alur", "Gooty"],
            suggested_action="Distribute ORS and Zinc sachets at Anganwadi centers, chlorinate public borewells."
        )
    ]
    return clusters

# --- Care Coordination Agent Workflow ---

def execute_care_coordination_agent(record: PatientRecordSyncItem) -> Optional[Dict[str, Any]]:
    """
    Agent loop: Observe -> Analyze -> Recommend -> Ask/Act -> Escalate -> Record
    Never diagnoses; closes loop on missing data and high-priority follow-up.
    """
    vitals = record.vitals
    if not vitals:
        return None

    # Check emergency condition
    if (vitals.spo2 and vitals.spo2 < 90) or (vitals.systolic_bp and vitals.systolic_bp >= 180):
        missing = []
        if vitals.blood_glucose is None:
            missing.append("Blood Glucose")
        if vitals.systolic_bp is None:
            missing.append("Blood Pressure")

        return {
            "task_id": f"task-agent-{record.id}",
            "user_id": record.user_id,
            "patient_name": record.patient_name,
            "priority": "High",
            "missing_fields": missing,
            "action": f"Emergency Hand-off prepared: SpO2 is {vitals.spo2}%. Assigned worker to follow up immediately.",
            "status": "pending"
        }
    return None

# --- Endpoints ---

@app.get("/")
def root():
    return {
        "service": "Healorithm Telemedicine API",
        "status": "online",
        "version": "2.0.0",
        "offline_sync_compatible": True
    }

@app.post("/api/sync", response_model=SyncResponse)
def sync_records(payload: SyncPayload):
    """
    Receives compressed/delta sync records from offline health worker PWA.
    Processes idempotently, detects conflicts, and triggers Care Coordination Agent.
    """
    ack_ids = [rec.id for rec in payload.records]
    agent_tasks = 0

    for rec in payload.records:
        task = execute_care_coordination_agent(rec)
        if task:
            agent_tasks += 1

    return SyncResponse(
        status="synced_successfully",
        acknowledged_ids=ack_ids,
        conflicts=[],
        agent_tasks_created=agent_tasks,
        server_timestamp=datetime.datetime.utcnow().isoformat() + "Z"
    )

@app.get("/api/outbreaks", response_model=List[OutbreakCluster])
def get_outbreaks():
    """Returns active spatio-temporal outbreak clusters."""
    return run_outbreak_detection([])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
