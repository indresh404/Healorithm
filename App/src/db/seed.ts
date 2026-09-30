// App/src/db/seed.ts
import { db } from './schema';
import { deriveKeyFromPIN } from '../crypto/keyDerivation';
import { savePatientAtomic } from './repo';
import { Patient } from '@shared/types';

export async function seedInitialDexieData() {
  const count = await db.patients.count();
  if (count > 0) return;

  const key = await deriveKeyFromPIN('1234');

  const initialPatients: Patient[] = [
    {
      id: 'u-101',
      qr_id: 'u-101',
      name: 'Indresh',
      age: 58,
      gender: 'Male',
      preferred_language: 'Hindi',
      phone: '+91 98234 11021',
      village: 'Adoni',
      household_id: 'HH-AD-042',
      address: 'Near Old Water Tank, Ward 4, Adoni',
      blood_group: 'B+',
      created_at: '2026-08-10T10:00:00Z',
      consent_status: 'granted'
    },
    {
      id: 'u-102',
      qr_id: 'u-102',
      name: 'Sunita Devi',
      age: 49,
      gender: 'Female',
      preferred_language: 'Hindi',
      phone: '+91 98234 11023',
      village: 'Alur',
      household_id: 'HH-AL-019',
      address: 'Main Bazaar Lane, Alur',
      blood_group: 'O+',
      created_at: '2026-08-15T11:20:00Z',
      consent_status: 'granted'
    },
    {
      id: 'u-103',
      qr_id: 'u-103',
      name: 'Venkatesh Rao',
      age: 67,
      gender: 'Male',
      preferred_language: 'Marathi',
      phone: '+91 98234 11025',
      village: 'Adoni',
      household_id: 'HH-AD-088',
      address: 'Kalyan Nagar, Adoni',
      blood_group: 'A+',
      created_at: '2026-07-20T09:15:00Z',
      consent_status: 'granted'
    }
  ];

  for (const p of initialPatients) {
    await savePatientAtomic(p, key);
  }
}
