# backend/app/routers/prescriptions.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..db.models import PrescriptionModel, AuditLogModel

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.get("")
def list_prescriptions(db: Session = Depends(get_db)):
    prescriptions = db.query(PrescriptionModel).order_by(PrescriptionModel.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "patient_id": p.patient_id,
            "user_id": p.patient_id,
            "patient_name": p.patient_name,
            "medical_record_id": p.medical_record_id,
            "medicine_name": p.medicine_name,
            "generic_name": p.generic_name,
            "dosage": p.dosage,
            "duration_days": p.duration_days,
            "instructions": p.instructions,
            "brand_price_inr": p.brand_price_inr,
            "generic_price_inr": p.generic_price_inr,
            "estimated_savings_inr": p.estimated_savings_inr,
            "generic_status": p.generic_status,
            "brand_reason": p.brand_reason,
            "prescribed_by": p.prescribed_by,
            "created_at": p.created_at
        }
        for p in prescriptions
    ]

@router.post("/confirm-generic")
def confirm_generic(payload: Dict[str, Any], db: Session = Depends(get_db)):
    rx_id = payload.get("prescription_id")
    status = payload.get("status", "approved")
    brand_reason = payload.get("brand_reason")

    if rx_id:
        rx = db.query(PrescriptionModel).filter(PrescriptionModel.id == rx_id).first()
        if rx:
            rx.generic_status = status
            if brand_reason:
                rx.brand_reason = brand_reason
            db.commit()

    return {"status": "confirmed", "jan_aushadhi_savings_ratio": 0.85, "payload": payload}
