// App/src/db/repo.ts
import { db, EncryptedPatientRecord, EncryptedVisitRecord, EncryptedOutboxRecord, DiaryRecord } from './schema';
import { Patient, Visit, Vitals } from '@shared/types';
import { encryptAESGCM, decryptAESGCM } from '../crypto/aesGcm';

/**
 * Saves a new patient registration and outbox entry in ONE atomic transaction.
 */
export async function savePatientAtomic(
  patient: Patient,
  cryptoKey: CryptoKey
): Promise<void> {
  const cipher = await encryptAESGCM(patient, cryptoKey);
  const outboxItem: EncryptedOutboxRecord = {
    id: `outbox-${patient.id}-${Date.now()}`,
    table_name: 'patients',
    record_id: patient.id,
    action: 'insert',
    payload_cipher: cipher,
    status: 'pending',
    priority: 'normal',
    timestamp: new Date().toISOString(),
    attempts: 0
  };

  const patientRecord: EncryptedPatientRecord = {
    id: patient.id,
    qr_id: patient.qr_id || patient.id,
    village: patient.village,
    household_id: patient.household_id,
    encrypted_data: cipher,
    plain_name: patient.name,
    risk_score: 20,
    risk_level: 'Low',
    is_emergency: false,
    updated_at: new Date().toISOString()
  };

  await db.transaction('rw', [db.patients, db.outbox], async () => {
    await db.patients.put(patientRecord);
    await db.outbox.put(outboxItem);
  });
}

/**
 * Saves a clinical visit/vitals and outbox entry in ONE atomic transaction.
 */
export async function saveVisitAtomic(
  visit: Visit,
  riskScore: number,
  riskLevel: string,
  isEmergency: boolean,
  cryptoKey: CryptoKey
): Promise<void> {
  const cipher = await encryptAESGCM(visit, cryptoKey);
  const priority = isEmergency ? 'emergency' : riskScore >= 70 ? 'high' : 'normal';

  const outboxItem: EncryptedOutboxRecord = {
    id: `outbox-visit-${visit.id}-${Date.now()}`,
    table_name: 'visits',
    record_id: visit.id,
    action: 'insert',
    payload_cipher: cipher,
    status: 'pending',
    priority,
    timestamp: new Date().toISOString(),
    attempts: 0
  };

  const visitRecord: EncryptedVisitRecord = {
    id: visit.id,
    patient_id: visit.patient_id,
    visit_date: visit.visit_date,
    worker_id: visit.worker_id,
    sync_status: 'pending',
    encrypted_data: cipher,
    created_at: new Date().toISOString()
  };

  await db.transaction('rw', [db.visits, db.patients, db.outbox], async () => {
    await db.visits.put(visitRecord);
    await db.outbox.put(outboxItem);
    
    // Update cached risk on patient
    const p = await db.patients.get(visit.patient_id);
    if (p) {
      p.risk_score = riskScore;
      p.risk_level = riskLevel;
      p.is_emergency = isEmergency;
      p.updated_at = new Date().toISOString();
      await db.patients.put(p);
    }
  });
}

/**
 * Retrieves all patients for visit queue.
 */
export async function getPatientsForQueue(): Promise<EncryptedPatientRecord[]> {
  return db.patients.orderBy('risk_score').reverse().toArray();
}

/**
 * Decrypts a patient record.
 */
export async function decryptPatient(record: EncryptedPatientRecord, key: CryptoKey): Promise<Patient> {
  return decryptAESGCM<Patient>(record.encrypted_data, key);
}
