# backend/app/db/models.py
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .session import Base

def utcnow_str():
    return datetime.now(timezone.utc).isoformat()

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    name = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False, default="Doctor") # Doctor, Admin, Worker, Patient
    village = Column(String(128), nullable=True)
    phone = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(String(64), default=utcnow_str)

class PatientModel(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True, index=True)
    qr_id = Column(String(64), index=True, nullable=False)
    name = Column(String(128), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(32), nullable=False)
    preferred_language = Column(String(32), default="en")
    phone = Column(String(32), nullable=False, index=True)
    village = Column(String(128), nullable=False, index=True)
    household_id = Column(String(64), nullable=True)
    address = Column(Text, nullable=True)
    blood_group = Column(String(16), nullable=True)
    emergency_contact = Column(String(128), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    consent_status = Column(String(32), default="granted")
    
    # Clinical risk cache
    risk_score = Column(Integer, default=20)
    risk_level = Column(String(32), default="Low")
    emergency_flag = Column(Boolean, default=False)
    emergency_reason = Column(Text, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    blood_glucose = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    adherence_rate = Column(Integer, default=85)
    missed_followups = Column(Integer, default=0)
    
    created_at = Column(String(64), default=utcnow_str)
    updated_at = Column(String(64), default=utcnow_str)

    visits = relationship("VisitModel", back_populates="patient", cascade="all, delete-orphan")
    referrals = relationship("ReferralModel", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("PrescriptionModel", back_populates="patient", cascade="all, delete-orphan")
    reviews = relationship("DoctorReviewModel", back_populates="patient", cascade="all, delete-orphan")

class VisitModel(Base):
    __tablename__ = "visits"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    visit_date = Column(String(32), nullable=False)
    worker_id = Column(String(64), nullable=False)
    worker_name = Column(String(128), nullable=False, default="Lakshmi P.")
    village = Column(String(128), nullable=False)
    report_type = Column(String(128), default="Field Vitals & Symptom Evaluation")
    symptoms = Column(JSON, default=list)
    affected_body_zones = Column(JSON, default=list)
    vitals = Column(JSON, default=dict)
    provisional_diagnosis = Column(Text, nullable=True)
    doctor = Column(String(128), default="Assigned CHC Physician")
    hospital = Column(String(128), default="CHC Adoni")
    status = Column(String(64), default="Field Recorded")
    sync_status = Column(String(32), default="synced")
    created_at = Column(String(64), default=utcnow_str)

    patient = relationship("PatientModel", back_populates="visits")

class ReferralModel(Base):
    __tablename__ = "referrals"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    village = Column(String(128), nullable=False)
    worker_id = Column(String(64), nullable=False, default="w2")
    worker_name = Column(String(128), nullable=False, default="Lakshmi P.")
    target_facility = Column(String(128), nullable=False, default="Adoni CHC")
    priority = Column(String(32), nullable=False, default="Moderate") # Emergency, High, Moderate, Low
    specialty = Column(String(128), nullable=False, default="General Medicine")
    reason = Column(Text, nullable=False)
    status = Column(String(32), default="Created") # Created, Synced, In-Review, Completed, Escalated
    risk_score = Column(Integer, default=50)
    top_factors = Column(JSON, default=list)
    target_response_time = Column(String(64), default="Within 24 Hours")
    created_at = Column(String(64), default=utcnow_str)
    updated_at = Column(String(64), default=utcnow_str)

    patient = relationship("PatientModel", back_populates="referrals")

class FollowUpModel(Base):
    __tablename__ = "follow_ups"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    worker_id = Column(String(64), nullable=False, default="w2")
    worker_name = Column(String(128), nullable=False, default="Lakshmi P.")
    due_date = Column(String(32), nullable=False)
    reason = Column(Text, nullable=False)
    priority = Column(String(32), default="Moderate")
    status = Column(String(32), default="Pending") # Pending, Completed, Overdue, Cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(String(64), default=utcnow_str)
    updated_at = Column(String(64), default=utcnow_str)

class DoctorReviewModel(Base):
    __tablename__ = "doctor_reviews"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(String(64), nullable=False)
    doctor_name = Column(String(128), nullable=False)
    decision = Column(String(64), nullable=False) # Approved, Modified, Escalated, Prescribed, Closed
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="Completed")
    created_at = Column(String(64), default=utcnow_str)

    patient = relationship("PatientModel", back_populates="reviews")

class PrescriptionModel(Base):
    __tablename__ = "prescriptions"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    medical_record_id = Column(String(64), nullable=True)
    medicine_name = Column(String(128), nullable=False)
    generic_name = Column(String(128), nullable=False)
    dosage = Column(String(64), default="1 Tab Daily")
    duration_days = Column(Integer, default=14)
    instructions = Column(String(256), default="After meals")
    brand_price_inr = Column(Float, default=250.0)
    generic_price_inr = Column(Float, default=45.0)
    estimated_savings_inr = Column(Float, default=205.0)
    generic_status = Column(String(32), default="suggested") # suggested, approved, kept_brand, not_available
    brand_reason = Column(Text, nullable=True)
    prescribed_by = Column(String(128), default="Dr. Arjun Verma")
    created_at = Column(String(64), default=utcnow_str)

    patient = relationship("PatientModel", back_populates="prescriptions")

class CareTaskModel(Base):
    __tablename__ = "care_tasks"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), nullable=False, index=True)
    patient_name = Column(String(128), nullable=False)
    village = Column(String(128), nullable=False)
    priority = Column(String(32), default="Moderate")
    missing_data_fields = Column(JSON, default=list)
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    assigned_worker = Column(String(128), default="Lakshmi P.")
    status = Column(String(32), default="pending") # pending, in_progress, resolved
    created_at = Column(String(64), default=utcnow_str)

class ConflictModel(Base):
    __tablename__ = "conflicts"

    id = Column(String(64), primary_key=True, index=True)
    table_name = Column(String(64), nullable=False)
    record_id = Column(String(64), nullable=False)
    field_name = Column(String(64), nullable=False)
    local_value = Column(Text, nullable=True)
    remote_value = Column(Text, nullable=True)
    status = Column(String(32), default="unresolved") # unresolved, resolved
    resolved_by = Column(String(64), nullable=True)
    created_at = Column(String(64), default=utcnow_str)
    resolved_at = Column(String(64), nullable=True)

class SyncRecordModel(Base):
    """Idempotency and sync audit log"""
    __tablename__ = "sync_records"

    id = Column(String(128), primary_key=True, index=True) # Outbox ID (Idempotency key)
    client_id = Column(String(64), nullable=True)
    table_name = Column(String(64), nullable=False)
    record_id = Column(String(64), nullable=False)
    action = Column(String(32), nullable=False)
    priority = Column(String(32), default="normal")
    payload = Column(Text, nullable=True)
    client_timestamp = Column(String(64), nullable=True)
    synced_at = Column(String(64), default=utcnow_str)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    actor_id = Column(String(64), nullable=False)
    actor_name = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False) # login, patient_viewed, visit_created, doctor_decision, referral_updated, sync_received
    target_type = Column(String(64), nullable=False) # patient, visit, referral, review, auth
    target_id = Column(String(64), nullable=True)
    details = Column(JSON, default=dict)
    result = Column(String(32), default="success")
    timestamp = Column(String(64), default=utcnow_str)
