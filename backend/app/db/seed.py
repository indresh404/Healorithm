# backend/app/db/seed.py
from sqlalchemy.orm import Session
from .session import Base, engine, SessionLocal
from .models import (
    UserModel, PatientModel, VisitModel, ReferralModel,
    PrescriptionModel, CareTaskModel, FollowUpModel, AuditLogModel
)
from ..core.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Check if users already exist
        if db.query(UserModel).count() == 0:
            users = [
                UserModel(
                    id="usr-doc-01",
                    username="doctor@phc.in",
                    password_hash=get_password_hash("1234"),
                    name="Dr. Arjun Verma",
                    role="Doctor",
                    phone="+91 98450 12345",
                    village="Adoni"
                ),
                UserModel(
                    id="usr-admin-01",
                    username="admin@healorithm.in",
                    password_hash=get_password_hash("admin123"),
                    name="District Health Officer",
                    role="Admin",
                    phone="+91 8518 220044",
                    village="District HQ"
                ),
                UserModel(
                    id="usr-worker-02",
                    username="w2",
                    password_hash=get_password_hash("1234"),
                    name="Lakshmi P.",
                    role="Worker",
                    phone="+91 98765 43211",
                    village="Adoni"
                ),
                UserModel(
                    id="usr-worker-01",
                    username="worker@healorithm.in",
                    password_hash=get_password_hash("1234"),
                    name="Lakshmi P.",
                    role="Worker",
                    phone="+91 98765 43211",
                    village="Adoni"
                ),
                UserModel(
                    id="usr-patient-101",
                    username="u-101",
                    password_hash=get_password_hash("1234"),
                    name="Ramesh Kumar",
                    role="Patient",
                    phone="+91 98234 11021",
                    village="Adoni"
                )
            ]
            for u in users:
                db.add(u)
            db.commit()

        # Check if patients already exist
        if db.query(PatientModel).count() == 0:
            patients = [
                PatientModel(
                    id="u-101",
                    qr_id="u-101",
                    name="Ramesh Kumar",
                    age=58,
                    gender="Male",
                    preferred_language="Hindi",
                    phone="+91 98234 11021",
                    village="Adoni",
                    household_id="HH-AD-042",
                    address="Near Old Water Tank, Ward 4, Adoni",
                    blood_group="B+",
                    emergency_contact="+91 98234 11022 (Son: Ajay)",
                    lat=15.346,
                    lng=77.346,
                    risk_score=78,
                    risk_level="High",
                    emergency_flag=True,
                    emergency_reason="Systolic BP elevated to 168 mmHg, Chest tightness",
                    systolic_bp=168,
                    diastolic_bp=102,
                    spo2=94,
                    heart_rate=98,
                    blood_glucose=210,
                    temperature=98.6,
                    adherence_rate=72,
                    missed_followups=2,
                    created_at="2026-08-10T10:00:00Z",
                    updated_at="2026-09-30T07:30:00Z"
                ),
                PatientModel(
                    id="u-102",
                    qr_id="u-102",
                    name="Sunita Devi",
                    age=49,
                    gender="Female",
                    preferred_language="Hindi",
                    phone="+91 98234 11023",
                    village="Alur",
                    household_id="HH-AL-019",
                    address="Main Bazaar Lane, Alur",
                    blood_group="O+",
                    emergency_contact="+91 98234 11024 (Husband: Mohan)",
                    lat=15.124,
                    lng=77.124,
                    risk_score=35,
                    risk_level="Moderate",
                    emergency_flag=False,
                    systolic_bp=135,
                    diastolic_bp=88,
                    spo2=97,
                    heart_rate=76,
                    blood_glucose=140,
                    temperature=98.4,
                    adherence_rate=90,
                    missed_followups=0,
                    created_at="2026-08-15T11:20:00Z",
                    updated_at="2026-09-29T18:00:00Z"
                ),
                PatientModel(
                    id="u-103",
                    qr_id="u-103",
                    name="Venkatesh Rao",
                    age=67,
                    gender="Male",
                    preferred_language="Marathi",
                    phone="+91 98234 11025",
                    village="Adoni",
                    household_id="HH-AD-088",
                    address="Kalyan Nagar, Adoni",
                    blood_group="A+",
                    emergency_contact="+91 98234 11026 (Daughter: Kavita)",
                    lat=15.349,
                    lng=77.349,
                    risk_score=92,
                    risk_level="Critical",
                    emergency_flag=True,
                    emergency_reason="Severe Hypoxia (SpO2 88%), Shortness of breath",
                    systolic_bp=175,
                    diastolic_bp=105,
                    spo2=88,
                    heart_rate=112,
                    blood_glucose=260,
                    temperature=100.2,
                    adherence_rate=45,
                    missed_followups=4,
                    created_at="2026-07-20T09:15:00Z",
                    updated_at="2026-09-30T06:15:00Z"
                ),
                PatientModel(
                    id="u-104",
                    qr_id="u-104",
                    name="Fatima Begum",
                    age=38,
                    gender="Female",
                    preferred_language="Hindi",
                    phone="+91 98234 11027",
                    village="Dhone",
                    household_id="HH-DH-102",
                    address="Behind Community Hall, Dhone",
                    blood_group="AB+",
                    emergency_contact="+91 98234 11028 (Brother: Imran)",
                    lat=15.457,
                    lng=77.457,
                    risk_score=22,
                    risk_level="Low",
                    emergency_flag=False,
                    systolic_bp=118,
                    diastolic_bp=78,
                    spo2=99,
                    heart_rate=72,
                    blood_glucose=105,
                    temperature=98.2,
                    adherence_rate=95,
                    missed_followups=0,
                    created_at="2026-09-01T14:40:00Z",
                    updated_at="2026-09-28T10:00:00Z"
                ),
                PatientModel(
                    id="u-105",
                    qr_id="u-105",
                    name="Anand Shinde",
                    age=52,
                    gender="Male",
                    preferred_language="Marathi",
                    phone="+91 98234 11029",
                    village="Pattikonda",
                    household_id="HH-PK-007",
                    address="Station Road, Pattikonda",
                    blood_group="O-",
                    emergency_contact="+91 98234 11030 (Wife: Shobha)",
                    lat=15.568,
                    lng=77.568,
                    risk_score=48,
                    risk_level="Moderate",
                    emergency_flag=False,
                    systolic_bp=142,
                    diastolic_bp=90,
                    spo2=96,
                    heart_rate=80,
                    blood_glucose=165,
                    temperature=98.4,
                    adherence_rate=82,
                    missed_followups=1,
                    created_at="2026-09-10T16:00:00Z",
                    updated_at="2026-09-27T12:00:00Z"
                )
            ]
            for p in patients:
                db.add(p)
            db.commit()

            # Seed visits
            visits = [
                VisitModel(
                    id="rec-101-1",
                    patient_id="u-101",
                    patient_name="Ramesh Kumar",
                    visit_date="2026-09-30",
                    worker_id="w2",
                    worker_name="Lakshmi P.",
                    village="Adoni",
                    report_type="Field Vitals & Symptom Evaluation",
                    symptoms=["Chest tightness", "Headache", "Dizziness"],
                    affected_body_zones=["chest", "head"],
                    vitals={"systolic_bp": 168, "diastolic_bp": 102, "spo2": 94, "heart_rate": 98, "blood_glucose": 210},
                    provisional_diagnosis="Hypertensive urgency with early coronary signs",
                    status="Emergency Triggered",
                    created_at="2026-09-30T07:15:00Z"
                ),
                VisitModel(
                    id="rec-103-1",
                    patient_id="u-103",
                    patient_name="Venkatesh Rao",
                    visit_date="2026-09-30",
                    worker_id="w2",
                    worker_name="Lakshmi P.",
                    village="Adoni",
                    report_type="Field Vitals & Symptom Evaluation",
                    symptoms=["Severe shortness of breath", "Cough", "Chest Pain"],
                    affected_body_zones=["chest", "lungs"],
                    vitals={"systolic_bp": 175, "diastolic_bp": 105, "spo2": 88, "heart_rate": 112, "blood_glucose": 260},
                    provisional_diagnosis="Acute respiratory distress & COPD exacerbation",
                    status="Emergency Triggered",
                    created_at="2026-09-30T06:10:00Z"
                )
            ]
            for v in visits:
                db.add(v)

            # Seed referrals
            referrals = [
                ReferralModel(
                    id="ref-101-1",
                    patient_id="u-101",
                    patient_name="Ramesh Kumar",
                    village="Adoni",
                    worker_id="w2",
                    worker_name="Lakshmi P.",
                    target_facility="Adoni CHC",
                    priority="Emergency",
                    specialty="Cardiology / Emergency",
                    reason="Severe acute chest pressure with elevated BP 168/102",
                    status="Created",
                    risk_score=78,
                    top_factors=["Elevated Systolic BP (168)", "Chest tightness reported", "History of Hypertension"],
                    target_response_time="Immediate (Within 2 Hours)",
                    created_at="2026-09-30T07:15:00Z"
                ),
                ReferralModel(
                    id="ref-103-1",
                    patient_id="u-103",
                    patient_name="Venkatesh Rao",
                    village="Adoni",
                    worker_id="w2",
                    worker_name="Lakshmi P.",
                    target_facility="Kurnool District Govt Hospital",
                    priority="Emergency",
                    specialty="Pulmonology / ICU",
                    reason="Critically low SpO2 (88%) with severe dyspnea and tachycardia",
                    status="Created",
                    risk_score=92,
                    top_factors=["Severe Hypoxia (SpO2 88%)", "Hypertension Stage 2", "Uncontrolled Diabetes"],
                    target_response_time="Immediate (Within 1 Hour)",
                    created_at="2026-09-30T06:10:00Z"
                )
            ]
            for r in referrals:
                db.add(r)

            # Seed prescriptions
            prescriptions = [
                PrescriptionModel(
                    id="rx-101-1",
                    patient_id="u-101",
                    patient_name="Ramesh Kumar",
                    medical_record_id="rec-101-1",
                    medicine_name="Telmisartan 40mg",
                    generic_name="Telmisartan 40mg Tab",
                    dosage="1 Tab Morning",
                    duration_days=30,
                    instructions="After breakfast",
                    brand_price_inr=220.0,
                    generic_price_inr=32.0,
                    estimated_savings_inr=188.0,
                    generic_status="approved",
                    prescribed_by="Dr. Arjun Verma",
                    created_at="2026-09-30T07:30:00Z"
                ),
                PrescriptionModel(
                    id="rx-101-2",
                    patient_id="u-101",
                    patient_name="Ramesh Kumar",
                    medical_record_id="rec-101-1",
                    medicine_name="Metformin 500mg",
                    generic_name="Metformin HCl 500mg Tab",
                    dosage="1 Tab Twice Daily",
                    duration_days=30,
                    instructions="With meals",
                    brand_price_inr=180.0,
                    generic_price_inr=24.0,
                    estimated_savings_inr=156.0,
                    generic_status="approved",
                    prescribed_by="Dr. Arjun Verma",
                    created_at="2026-09-30T07:30:00Z"
                )
            ]
            for p in prescriptions:
                db.add(p)

            # Seed care tasks
            care_tasks = [
                CareTaskModel(
                    id="task-101",
                    patient_id="u-101",
                    patient_name="Ramesh Kumar",
                    village="Adoni",
                    priority="High",
                    missing_data_fields=["Post-Prandial Blood Sugar"],
                    reason="Risk score elevated (78/100) with key factors: High BP; Low Adherence",
                    recommended_action="Fast-track patient to Cardiology clinic and test PPBS on next ASHA visit.",
                    assigned_worker="Lakshmi P.",
                    status="pending",
                    created_at="2026-09-30T07:20:00Z"
                ),
                CareTaskModel(
                    id="task-103",
                    patient_id="u-103",
                    patient_name="Venkatesh Rao",
                    village="Adoni",
                    priority="High",
                    missing_data_fields=["Peak Flow / Spirometry"],
                    reason="EMERGENCY: SpO2 critically low (88%)",
                    recommended_action="Immediate ambulance dispatch and oxygen therapy at CHC.",
                    assigned_worker="Lakshmi P.",
                    status="pending",
                    created_at="2026-09-30T06:15:00Z"
                )
            ]
            for t in care_tasks:
                db.add(t)

            db.commit()
    finally:
        db.close()
