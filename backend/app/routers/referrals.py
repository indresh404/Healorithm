# backend/app/routers/referrals.py
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..db.models import ReferralModel, AuditLogModel, PatientModel

router = APIRouter(prefix="/referrals", tags=["Referrals"])

class ReferralCreateRequest(BaseModel):
    id: Optional[str] = None
    patient_id: str
    patient_name: Optional[str] = None
    village: Optional[str] = "Adoni"
    worker_id: Optional[str] = "w2"
    worker_name: Optional[str] = "Lakshmi P."
    target_facility: str
    priority: str
    specialty_required: Optional[str] = "General Medicine"
    specialty: Optional[str] = None
    reason: str
    risk_score: Optional[int] = 50
    top_factors: Optional[List[str]] = []
    target_response_time: Optional[str] = "Within 24 Hours"

class ReferralUpdateRequest(BaseModel):
    status: Optional[str] = None
    target_facility: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

@router.get("")
def list_referrals(db: Session = Depends(get_db)):
    referrals = db.query(ReferralModel).order_by(ReferralModel.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "patient_id": r.patient_id,
            "user_id": r.patient_id,
            "patient_name": r.patient_name,
            "village": r.village,
            "worker_id": r.worker_id,
            "worker_name": r.worker_name,
            "target_facility": r.target_facility,
            "priority": r.priority,
            "specialty_required": r.specialty,
            "specialty": r.specialty,
            "reason": r.reason,
            "status": r.status,
            "risk_score": r.risk_score,
            "top_factors": r.top_factors or [],
            "target_response_time": r.target_response_time,
            "created_at": r.created_at,
            "updated_at": r.updated_at
        }
        for r in referrals
    ]

@router.get("/{referral_id}")
def get_referral(referral_id: str, db: Session = Depends(get_db)):
    r = db.query(ReferralModel).filter(ReferralModel.id == referral_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Referral not found")
    return {
        "id": r.id,
        "patient_id": r.patient_id,
        "user_id": r.patient_id,
        "patient_name": r.patient_name,
        "village": r.village,
        "worker_id": r.worker_id,
        "worker_name": r.worker_name,
        "target_facility": r.target_facility,
        "priority": r.priority,
        "specialty_required": r.specialty,
        "specialty": r.specialty,
        "reason": r.reason,
        "status": r.status,
        "risk_score": r.risk_score,
        "top_factors": r.top_factors or [],
        "target_response_time": r.target_response_time,
        "created_at": r.created_at,
        "updated_at": r.updated_at
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_referral(body: ReferralCreateRequest, db: Session = Depends(get_db)):
    rid = body.id or f"ref-{int(datetime.now(timezone.utc).timestamp())}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    patient = db.query(PatientModel).filter(PatientModel.id == body.patient_id).first()
    p_name = body.patient_name or (patient.name if patient else f"Patient {body.patient_id}")
    village = body.village or (patient.village if patient else "Adoni")

    ref = ReferralModel(
        id=rid,
        patient_id=body.patient_id,
        patient_name=p_name,
        village=village,
        worker_id=body.worker_id or "w2",
        worker_name=body.worker_name or "Lakshmi P.",
        target_facility=body.target_facility,
        priority=body.priority,
        specialty=body.specialty or body.specialty_required or "General Medicine",
        reason=body.reason,
        status="Created",
        risk_score=body.risk_score or 50,
        top_factors=body.top_factors or [],
        target_response_time=body.target_response_time or "Within 24 Hours",
        created_at=now_iso,
        updated_at=now_iso
    )
    db.add(ref)

    audit = AuditLogModel(
        id=f"aud-ref-{rid}-{int(datetime.now(timezone.utc).timestamp())}",
        actor_id=body.worker_id or "w2",
        actor_name=body.worker_name or "Lakshmi P.",
        role="Worker",
        action="referral_created",
        target_type="referral",
        target_id=rid,
        details={"patient_id": body.patient_id, "priority": body.priority, "target_facility": body.target_facility},
        result="success"
    )
    db.add(audit)
    db.commit()
    return {"status": "created", "referral_id": ref.id}

@router.patch("/{referral_id}")
def update_referral(referral_id: str, body: ReferralUpdateRequest, db: Session = Depends(get_db)):
    r = db.query(ReferralModel).filter(ReferralModel.id == referral_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Referral not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    if body.status:
        r.status = body.status
    if body.target_facility:
        r.target_facility = body.target_facility
    if body.priority:
        r.priority = body.priority
    r.updated_at = now_iso

    audit = AuditLogModel(
        id=f"aud-refup-{referral_id}-{int(datetime.now(timezone.utc).timestamp())}",
        actor_id="admin-doc",
        actor_name="Clinical Administrator",
        role="Doctor",
        action="referral_status_changed",
        target_type="referral",
        target_id=referral_id,
        details={"new_status": body.status, "priority": body.priority},
        result="success"
    )
    db.add(audit)
    db.commit()

    return {"status": "updated", "referral_id": referral_id, "new_status": r.status}
