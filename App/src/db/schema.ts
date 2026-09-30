// App/src/db/schema.ts
import Dexie, { Table } from 'dexie';

export interface EncryptedPatientRecord {
  id: string;
  qr_id: string;
  village: string;
  household_id?: string;
  encrypted_data: string; // AES-GCM ciphertext
  plain_name: string; // for instant local queue search
  risk_score: number;
  risk_level: string;
  is_emergency: boolean;
  updated_at: string;
}

export interface EncryptedVisitRecord {
  id: string;
  patient_id: string;
  visit_date: string;
  worker_id: string;
  sync_status: 'synced' | 'pending' | 'conflict';
  encrypted_data: string;
  created_at: string;
}

export interface EncryptedOutboxRecord {
  id: string; // UUID
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'append';
  payload_cipher: string;
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  priority: 'emergency' | 'high' | 'normal';
  timestamp: string;
  attempts: number;
  last_error?: string;
}

export interface DiaryRecord {
  id?: number;
  patient_id: string;
  date: string; // YYYY-MM-DD
  morning_taken: boolean;
  afternoon_taken: boolean;
  night_taken: boolean;
  symptoms: string[];
  sos_triggered: boolean;
  synced: boolean;
}

export interface JanAushadhiReportRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  delivery_status: 'confirmed' | 'delivered_to_patient' | 'seen_by_patient';
  encrypted_report: string;
  version: number;
  date_issued: string;
}

export class HealorithmDatabase extends Dexie {
  patients!: Table<EncryptedPatientRecord, string>;
  visits!: Table<EncryptedVisitRecord, string>;
  outbox!: Table<EncryptedOutboxRecord, string>;
  diary!: Table<DiaryRecord, number>;
  reports!: Table<JanAushadhiReportRecord, string>;

  constructor() {
    super('HealorithmEncryptedDB');
    this.version(1).stores({
      patients: 'id, qr_id, village, household_id, risk_score, is_emergency, updated_at',
      visits: 'id, patient_id, visit_date, worker_id, sync_status, created_at',
      outbox: 'id, table_name, record_id, status, priority, timestamp',
      diary: '++id, [patient_id+date], patient_id, date, synced',
      reports: 'id, patient_id, doctor_id, delivery_status, version, date_issued'
    });
  }
}

export const db = new HealorithmDatabase();
