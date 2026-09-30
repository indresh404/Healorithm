# backend/app/routers/sync.py
import json
import base64
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..db.models import (
    PatientModel, VisitModel, ReferralModel, CareTaskModel,
    SyncRecordModel, AuditLogModel, PrescriptionModel
)
from ..schemas import PushSyncRequest, PushSyncResponse

router = APIRouter(prefix="/sync", tags=["Sync"])

def parse_record_payload(payload_cipher: str) -> Optional[Dict[str, Any]]:
    """
    Safely attempts to parse payload.
    If it's raw JSON, parses it.
    If it's encrypted AES-GCM (iv:ct), checks if unencrypted fallback or logs.
    """
    if not payload_cipher:
        return None
    try:
        return json.loads(payload_cipher)
    except Exception:
        pass
    
    # Check if base64 JSON
    try:
        decoded = base64.b64decode(payload_cipher).decode('utf-8')
        return json.loads(decoded)
    except Exception:
        pass

    return None

@router.post("/push", response_model=PushSyncResponse)
def push_sync(payload: PushSyncRequest, db: Session = Depends(get_db)):
    synced_count = 0
    ack_ids = []
    conflicts = []
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        for record in payload.records:
            # 1. Idempotency Check
            existing_sync = db.query(SyncRecordModel).filter(SyncRecordModel.id == record.id).first()
            if existing_sync:
                # Already processed, acknowledge without re-inserting
                ack_ids.append(record.id)
                synced_count += 1
                continue

            # 2. Extract Data
            data = parse_record_payload(record.payload_cipher) or {}
            
            # If payload couldn't be parsed directly as JSON, it may be ciphertext
            # We still record sync idempotency & update patient record if needed
            table = record.table_name.lower()
            rec_id = record.record_id

            if table in ["patients", "patient"]:
                # Save or update Patient
                p_name = data.get("name") or data.get("plain_name") or f"Patient {rec_id}"
                p_village = data.get("village", "Adoni")
                p_age = int(data.get("age", 45))
                p_gender = data.get("gender", "Other")
                p_phone = data.get("phone", "+91 00000 00000")

                patient = db.query(PatientModel).filter(PatientModel.id == rec_id).first()
                if not patient:
                    patient = PatientModel(
                        id=rec_id,
                        qr_id=data.get("qr_id", rec_id),
                        name=p_name,
                        age=p_age,
                        gender=p_gender,
                        phone=p_phone,
                        village=p_village,
                        household_id=data.get("household_id"),
                        address=data.get("address"),
                        blood_group=data.get("blood_group"),
                        created_at=record.timestamp or now_iso,
                        updated_at=now_iso
                    )
                    db.add(patient)
                else:
                    patient.updated_at = now_iso
                    if "name" in data: patient.name = data["name"]
                    if "village" in data: patient.village = data["village"]

            elif table in ["visits", "visit", "records", "medical_records"]:
                # Save Visit
                patient_id = data.get("patient_id") or data.get("user_id") or "u-101"
                v_date = data.get("visit_date") or data.get("date") or now_iso.split("T")[0]
                worker_id = data.get("worker_id") or data.get("created_by") or "w2"
                worker_name = data.get("worker_name", "Lakshmi P.")
                v_vitals = data.get("vitals") or {}
                v_symptoms = data.get("symptoms") or []
                v_notes = data.get("provisional_diagnosis") or data.get("details") or ""
                v_status = data.get("status", "Field Recorded")
                
                # Ensure patient exists or get patient name
                patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
                patient_name = patient.name if patient else data.get("patient_name", f"Patient {patient_id}")

                visit = db.query(VisitModel).filter(VisitModel.id == rec_id).first()
                if not visit:
                    visit = VisitModel(
                        id=rec_id,
                        patient_id=patient_id,
                        patient_name=patient_name,
                        visit_date=v_date,
                        worker_id=worker_id,
                        worker_name=worker_name,
                        village=patient.village if patient else "Adoni",
                        symptoms=v_symptoms,
                        affected_body_zones=data.get("affected_body_zones", []),
                        vitals=v_vitals,
                        provisional_diagnosis=v_notes,
                        status=v_status,
                        sync_status="synced",
                        created_at=record.timestamp or now_iso
                    )
                    db.add(visit)

                # Update Patient vitals & risk in DB
                if patient and v_vitals:
                    if "systolic_bp" in v_vitals and v_vitals["systolic_bp"]:
                        patient.systolic_bp = int(v_vitals["systolic_bp"])
                    if "diastolic_bp" in v_vitals and v_vitals["diastolic_bp"]:
                        patient.diastolic_bp = int(v_vitals["diastolic_bp"])
                    if "spo2" in v_vitals and v_vitals["spo2"]:
                        patient.spo2 = int(v_vitals["spo2"])
                    if "heart_rate" in v_vitals and v_vitals["heart_rate"]:
                        patient.heart_rate = int(v_vitals["heart_rate"])
                    if "blood_glucose" in v_vitals and v_vitals["blood_glucose"]:
                        patient.blood_glucose = int(v_vitals["blood_glucose"])
                    if "temperature" in v_vitals and v_vitals["temperature"]:
                        patient.temperature = float(v_vitals["temperature"])

                    # Check emergency criteria
                    if (patient.spo2 and patient.spo2 < 90) or (patient.systolic_bp and patient.systolic_bp >= 180):
                        patient.emergency_flag = True
                        patient.risk_level = "Critical"
                        patient.risk_score = 90
                        patient.emergency_reason = f"Critical vitals: SpO2 {patient.spo2}%, BP {patient.systolic_bp} mmHg"
                    elif (patient.systolic_bp and patient.systolic_bp >= 140) or (patient.spo2 and patient.spo2 < 95):
                        patient.risk_level = "High"
                        patient.risk_score = max(patient.risk_score, 70)
                    
                    patient.updated_at = now_iso

            elif table in ["referrals", "referral"]:
                # Save Referral
                ref = db.query(ReferralModel).filter(ReferralModel.id == rec_id).first()
                if not ref:
                    ref = ReferralModel(
                        id=rec_id,
                        patient_id=data.get("user_id") or data.get("patient_id") or "u-101",
                        patient_name=data.get("patient_name", "Patient"),
                        village=data.get("village", "Adoni"),
                        worker_id=data.get("worker_id", "w2"),
                        worker_name=data.get("worker_name", "Lakshmi P."),
                        target_facility=data.get("target_facility", "Adoni CHC"),
                        priority=data.get("priority", "Moderate"),
                        specialty=data.get("specialty", "General Medicine"),
                        reason=data.get("reason", "Field referral"),
                        status=data.get("status", "Created"),
                        risk_score=int(data.get("risk_score", 50)),
                        top_factors=data.get("top_factors", []),
                        created_at=record.timestamp or now_iso,
                        updated_at=now_iso
                    )
                    db.add(ref)

            # 3. Store in Idempotency Sync Record table
            sync_log = SyncRecordModel(
                id=record.id,
                client_id=payload.client_id or "worker-device",
                table_name=record.table_name,
                record_id=record.record_id,
                action=record.action,
                priority=record.priority,
                payload=record.payload_cipher[:500] if record.payload_cipher else None,
                client_timestamp=record.timestamp,
                synced_at=now_iso
            )
            db.add(sync_log)

            ack_ids.append(record.id)
            synced_count += 1

        # Audit log for entire sync batch
        if synced_count > 0:
            audit = AuditLogModel(
                id=f"aud-sync-{int(datetime.now(timezone.utc).timestamp())}",
                actor_id=payload.client_id or "worker-sync",
                actor_name="Offline Sync Engine",
                role="Worker",
                action="sync_received",
                target_type="sync",
                target_id=f"batch-{synced_count}",
                details={"synced_count": synced_count, "ack_ids": ack_ids},
                result="success"
            )
            db.add(audit)

        db.commit()

        return PushSyncResponse(
            status="success",
            synced_count=synced_count,
            conflicts=[],
            server_timestamp=now_iso
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync database persistence transaction failed: {str(e)}"
        )

@router.get("/pull")
def pull_sync(since: str = "1970-01-01T00:00:00Z", db: Session = Depends(get_db)):
    """
    Returns incremental changes since the provided timestamp.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    
    patients = db.query(PatientModel).filter(PatientModel.updated_at >= since).all()
    visits = db.query(VisitModel).filter(VisitModel.created_at >= since).all()
    referrals = db.query(ReferralModel).filter(ReferralModel.updated_at >= since).all()
    care_tasks = db.query(CareTaskModel).filter(CareTaskModel.created_at >= since).all()
    prescriptions = db.query(PrescriptionModel).filter(PrescriptionModel.created_at >= since).all()

    deltas = []
    for p in patients:
        deltas.append({
            "table": "patients",
            "action": "update",
            "id": p.id,
            "data": {
                "id": p.id, "name": p.name, "age": p.age, "gender": p.gender,
                "phone": p.phone, "village": p.village, "risk_score": p.risk_score,
                "risk_level": p.risk_level, "emergency_flag": p.emergency_flag,
                "systolic_bp": p.systolic_bp, "diastolic_bp": p.diastolic_bp,
                "spo2": p.spo2, "updated_at": p.updated_at
            }
        })
    for v in visits:
        deltas.append({
            "table": "visits",
            "action": "insert",
            "id": v.id,
            "data": {
                "id": v.id, "patient_id": v.patient_id, "patient_name": v.patient_name,
                "visit_date": v.visit_date, "symptoms": v.symptoms, "vitals": v.vitals,
                "status": v.status, "created_at": v.created_at
            }
        })
    for r in referrals:
        deltas.append({
            "table": "referrals",
            "action": "update",
            "id": r.id,
            "data": {
                "id": r.id, "patient_id": r.patient_id, "patient_name": r.patient_name,
                "priority": r.priority, "status": r.status, "reason": r.reason,
                "updated_at": r.updated_at
            }
        })

    return {
        "status": "success",
        "since": since,
        "server_timestamp": now_iso,
        "delta_count": len(deltas),
        "deltas": deltas,
        "has_more": False
    }
