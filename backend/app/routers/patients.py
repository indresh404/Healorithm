# backend/app/routers/patients.py
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..db.models import (
    PatientModel, VisitModel, ReferralModel, PrescriptionModel,
    DoctorReviewModel, FollowUpModel, CareTaskModel, AuditLogModel
)
from ..core.deps import get_current_user_optional, get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

class VitalsInput(BaseModel):
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    spo2: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    blood_glucose: Optional[int] = None

class PatientCreateRequest(BaseModel):
    id: Optional[str] = None
    qr_id: Optional[str] = None
    name: str
    age: int
    gender: str
    phone: str
    village: str
    preferred_language: Optional[str] = "en"
    household_id: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    consent_status: Optional[str] = "granted"

class DoctorReviewRequest(BaseModel):
    doctor_id: Optional[str] = "doc-01"
    doctor_name: Optional[str] = "Dr. Arjun Verma"
    decision: str
    notes: Optional[str] = None

class FollowUpRequest(BaseModel):
    due_date: str
    reason: str
    priority: Optional[str] = "Moderate"
    notes: Optional[str] = None
    worker_id: Optional[str] = "w2"
    worker_name: Optional[str] = "Lakshmi P."

@router.get("")
def list_patients(
    search: Optional[str] = None,
    village: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PatientModel)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (PatientModel.name.ilike(search_pattern)) |
            (PatientModel.phone.ilike(search_pattern)) |
            (PatientModel.village.ilike(search_pattern)) |
            (PatientModel.id.ilike(search_pattern))
        )
    
    if village and village != "all":
        query = query.filter(PatientModel.village == village)
        
    if risk_level and risk_level != "all":
        query = query.filter(PatientModel.risk_level == risk_level)

    patients = query.order_by(PatientModel.risk_score.desc()).all()

    # Map to frontend expected shape
    result = []
    for p in patients:
        result.append({
            "id": p.id,
            "qr_id": p.qr_id or p.id,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "phone": p.phone,
            "village": p.village,
            "household_id": p.household_id,
            "address": p.address,
            "blood_group": p.blood_group,
            "emergency_contact": p.emergency_contact,
            "lat": p.lat,
            "lng": p.lng,
            "consent_status": p.consent_status,
            "risk_score": p.risk_score,
            "risk_level": p.risk_level,
            "emergency_flag": p.emergency_flag,
            "emergency_reason": p.emergency_reason,
            "vitals": {
                "systolic_bp": p.systolic_bp,
                "diastolic_bp": p.diastolic_bp,
                "spo2": p.spo2,
                "heart_rate": p.heart_rate,
                "blood_glucose": p.blood_glucose,
                "temperature": p.temperature,
            },
            "adherence_rate": p.adherence_rate,
            "missed_followups": p.missed_followups,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        })
    return result

@router.get("/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(
        (PatientModel.id == patient_id) | (PatientModel.qr_id == patient_id)
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found"
        )

    # Fetch related records
    visits = db.query(VisitModel).filter(VisitModel.patient_id == patient.id).order_by(VisitModel.created_at.desc()).all()
    referrals = db.query(ReferralModel).filter(ReferralModel.patient_id == patient.id).order_by(ReferralModel.created_at.desc()).all()
    prescriptions = db.query(PrescriptionModel).filter(PrescriptionModel.patient_id == patient.id).order_by(PrescriptionModel.created_at.desc()).all()
    reviews = db.query(DoctorReviewModel).filter(DoctorReviewModel.patient_id == patient.id).order_by(DoctorReviewModel.created_at.desc()).all()
    care_tasks = db.query(CareTaskModel).filter(CareTaskModel.patient_id == patient.id).order_by(CareTaskModel.created_at.desc()).all()
    follow_ups = db.query(FollowUpModel).filter(FollowUpModel.patient_id == patient.id).order_by(FollowUpModel.created_at.desc()).all()

    return {
        "id": patient.id,
        "qr_id": patient.qr_id or patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "preferred_language": patient.preferred_language,
        "phone": patient.phone,
        "village": patient.village,
        "household_id": patient.household_id,
        "address": patient.address,
        "blood_group": patient.blood_group,
        "emergency_contact": patient.emergency_contact,
        "lat": patient.lat,
        "lng": patient.lng,
        "consent_status": patient.consent_status,
        "risk_score": patient.risk_score,
        "risk_level": patient.risk_level,
        "emergency_flag": patient.emergency_flag,
        "emergency_reason": patient.emergency_reason,
        "vitals": {
            "systolic_bp": patient.systolic_bp,
            "diastolic_bp": patient.diastolic_bp,
            "spo2": patient.spo2,
            "heart_rate": patient.heart_rate,
            "blood_glucose": patient.blood_glucose,
            "temperature": patient.temperature,
        },
        "adherence_rate": patient.adherence_rate,
        "missed_followups": patient.missed_followups,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
        "analytics": {
            "user_id": patient.id,
            "risk_score": patient.risk_score,
            "risk_level": patient.risk_level,
            "systolic_bp": patient.systolic_bp,
            "diastolic_bp": patient.diastolic_bp,
            "spo2": patient.spo2,
            "heart_rate": patient.heart_rate,
            "blood_glucose": patient.blood_glucose,
            "emergency_flag": patient.emergency_flag,
            "emergency_reason": patient.emergency_reason,
            "adherence_rate": patient.adherence_rate,
            "missed_followups": patient.missed_followups,
            "risks": [
                f"Systolic BP {patient.systolic_bp} mmHg" if patient.systolic_bp and patient.systolic_bp > 140 else None,
                f"Low SpO2 ({patient.spo2}%)" if patient.spo2 and patient.spo2 < 95 else None,
                f"Blood Sugar {patient.blood_glucose} mg/dL" if patient.blood_glucose and patient.blood_glucose > 180 else None,
            ],
            "last_checkup_date": patient.updated_at.split("T")[0] if patient.updated_at else None
        },
        "records": [
            {
                "id": v.id,
                "user_id": v.patient_id,
                "patient_name": v.patient_name,
                "report_type": v.report_type,
                "date": v.visit_date,
                "doctor": v.doctor,
                "hospital": v.hospital,
                "status": v.status,
                "details": v.provisional_diagnosis or "Field Encounter",
                "symptoms": v.symptoms or [],
                "affected_body_zones": v.affected_body_zones or [],
                "vitals": v.vitals or {},
                "created_at": v.created_at,
                "created_by": v.worker_id,
                "sync_status": v.sync_status
            } for v in visits
        ],
        "referrals": [
            {
                "id": r.id,
                "user_id": r.patient_id,
                "patient_name": r.patient_name,
                "village": r.village,
                "target_facility": r.target_facility,
                "priority": r.priority,
                "specialty": r.specialty,
                "reason": r.reason,
                "status": r.status,
                "risk_score": r.risk_score,
                "top_factors": r.top_factors or [],
                "target_response_time": r.target_response_time,
                "worker_name": r.worker_name,
                "created_at": r.created_at
            } for r in referrals
        ],
        "prescriptions": [
            {
                "id": rx.id,
                "user_id": rx.patient_id,
                "patient_name": rx.patient_name,
                "medical_record_id": rx.medical_record_id,
                "medicine_name": rx.medicine_name,
                "generic_name": rx.generic_name,
                "dosage": rx.dosage,
                "duration_days": rx.duration_days,
                "instructions": rx.instructions,
                "brand_price_inr": rx.brand_price_inr,
                "generic_price_inr": rx.generic_price_inr,
                "estimated_savings_inr": rx.estimated_savings_inr,
                "generic_status": rx.generic_status,
                "brand_reason": rx.brand_reason,
                "prescribed_by": rx.prescribed_by,
                "created_at": rx.created_at
            } for rx in prescriptions
        ],
        "reviews": [
            {
                "id": rev.id,
                "patient_id": rev.patient_id,
                "doctor_id": rev.doctor_id,
                "doctor_name": rev.doctor_name,
                "decision": rev.decision,
                "notes": rev.notes,
                "status": rev.status,
                "created_at": rev.created_at
            } for rev in reviews
        ],
        "care_tasks": [
            {
                "id": t.id,
                "patient_id": t.patient_id,
                "patient_name": t.patient_name,
                "village": t.village,
                "priority": t.priority,
                "missing_data_fields": t.missing_data_fields or [],
                "reason": t.reason,
                "recommended_action": t.recommended_action,
                "assigned_worker": t.assigned_worker,
                "status": t.status,
                "created_at": t.created_at
            } for t in care_tasks
        ],
        "follow_ups": [
            {
                "id": f.id,
                "patient_id": f.patient_id,
                "patient_name": f.patient_name,
                "worker_id": f.worker_id,
                "worker_name": f.worker_name,
                "due_date": f.due_date,
                "reason": f.reason,
                "priority": f.priority,
                "status": f.status,
                "notes": f.notes,
                "created_at": f.created_at
            } for f in follow_ups
        ]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreateRequest, db: Session = Depends(get_db)):
    pid = data.id or f"u-{int(datetime.now(timezone.utc).timestamp())}"
    existing = db.query(PatientModel).filter(PatientModel.id == pid).first()
    if existing:
        return {"status": "exists", "id": existing.id}

    patient = PatientModel(
        id=pid,
        qr_id=data.qr_id or pid,
        name=data.name,
        age=data.age,
        gender=data.gender,
        phone=data.phone,
        village=data.village,
        preferred_language=data.preferred_language or "en",
        household_id=data.household_id,
        address=data.address,
        blood_group=data.blood_group,
        emergency_contact=data.emergency_contact,
        lat=data.lat,
        lng=data.lng,
        consent_status=data.consent_status or "granted",
        risk_score=20,
        risk_level="Low",
        emergency_flag=False,
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(patient)

    # Audit log
    audit = AuditLogModel(
        id=f"aud-pat-{pid}-{int(datetime.now(timezone.utc).timestamp())}",
        actor_id="system",
        actor_name="Registration Service",
        role="Worker",
        action="patient_created",
        target_type="patient",
        target_id=pid,
        details={"name": data.name, "village": data.village},
        result="success"
    )
    db.add(audit)
    db.commit()
    db.refresh(patient)
    return {"status": "created", "id": patient.id, "name": patient.name}

@router.post("/{patient_id}/doctor-review")
def add_doctor_review(
    patient_id: str,
    body: DoctorReviewRequest,
    db: Session = Depends(get_db)
):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    review = DoctorReviewModel(
        id=f"rev-{patient_id}-{int(datetime.now(timezone.utc).timestamp())}",
        patient_id=patient_id,
        doctor_id=body.doctor_id or "doc-01",
        doctor_name=body.doctor_name or "Dr. Arjun Verma",
        decision=body.decision,
        notes=body.notes,
        status="Completed",
        created_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(review)

    # Audit log
    audit = AuditLogModel(
        id=f"aud-rev-{patient_id}-{int(datetime.now(timezone.utc).timestamp())}",
        actor_id=body.doctor_id or "doc-01",
        actor_name=body.doctor_name or "Dr. Arjun Verma",
        role="Doctor",
        action="doctor_review_decision",
        target_type="patient",
        target_id=patient_id,
        details={"decision": body.decision, "notes": body.notes},
        result="success"
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "review_id": review.id, "decision": review.decision}

@router.post("/{patient_id}/follow-up")
def add_follow_up(
    patient_id: str,
    body: FollowUpRequest,
    db: Session = Depends(get_db)
):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    followup = FollowUpModel(
        id=f"fol-{patient_id}-{int(datetime.now(timezone.utc).timestamp())}",
        patient_id=patient_id,
        patient_name=patient.name,
        worker_id=body.worker_id or "w2",
        worker_name=body.worker_name or "Lakshmi P.",
        due_date=body.due_date,
        reason=body.reason,
        priority=body.priority or "Moderate",
        status="Pending",
        notes=body.notes,
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(followup)

    audit = AuditLogModel(
        id=f"aud-fol-{patient_id}-{int(datetime.now(timezone.utc).timestamp())}",
        actor_id=body.worker_id or "w2",
        actor_name=body.worker_name or "Lakshmi P.",
        role="Worker",
        action="follow_up_created",
        target_type="patient",
        target_id=patient_id,
        details={"due_date": body.due_date, "reason": body.reason},
        result="success"
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "followup_id": followup.id}
