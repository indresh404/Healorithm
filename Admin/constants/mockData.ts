export interface VitalParams {
  id: string;
  date: string;
  bp: string;
  spo2: number;
  temp: number;
  hr: number;
  notes?: string;
  isCritical?: boolean;
  isHighRisk?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  village: string;
  conditions: string[];
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  emergencyFlag: boolean;
  lastVisited: string;
  overdue: boolean;
  adherencePercentage: number;
  adherenceLog: ('yes' | 'no' | 'none')[]; // Mon to Sun
  vitalsHistory: VitalParams[];
  prescriptions: string[];
  notes: string;
  aiSummary?: string;
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'patient001',
    name: 'Ramesh Kumar',
    age: 67,
    gender: 'Male',
    phone: '9876543210',
    village: 'Village A',
    conditions: ['Diabetes', 'Hypertension'],
    riskLevel: 'HIGH',
    riskScore: 85,
    emergencyFlag: true,
    lastVisited: '2026-04-05T10:00:00Z',
    overdue: true,
    adherencePercentage: 71,
    adherenceLog: ['yes', 'yes', 'no', 'yes', 'yes', 'no', 'yes'],
    vitalsHistory: [
      { id: 'v1', date: '2026-04-05T10:00:00Z', bp: '185/122', spo2: 95, temp: 37.0, hr: 80, isHighRisk: true, isCritical: true, notes: 'Patient experiencing dizziness and headache. Alert issued.' },
      { id: 'v2', date: '2026-04-03T10:00:00Z', bp: '170/110', spo2: 96, temp: 36.8, hr: 78, notes: 'BP elevated, continue monitoring' },
      { id: 'v3', date: '2026-04-01T10:00:00Z', bp: '160/100', spo2: 97, temp: 36.9, hr: 76, notes: 'Consistent monitoring, stable' },
    ],
    prescriptions: ['Metformin 500mg twice daily', 'Amlodipine 5mg once daily', 'Lisinopril 10mg daily'],
    notes: 'Patient reported dizziness. Needs urgent BP management.',
    aiSummary: 'High-risk patient with uncontrolled hypertension and diabetes. Recent vitals show critically elevated BP (185/122). Immediate intervention recommended. Patient compliance moderate (71%). Recommend daily BP monitoring, medication adjustment, and follow-up within 48 hours.',
  },
  {
    id: 'patient002',
    name: 'Sunita Devi',
    age: 45,
    gender: 'Female',
    phone: '9876543211',
    village: 'Village A',
    conditions: ['Asthma'],
    riskLevel: 'LOW',
    riskScore: 20,
    emergencyFlag: false,
    lastVisited: '2026-04-06T14:30:00Z',
    overdue: false,
    adherencePercentage: 100,
    adherenceLog: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
    vitalsHistory: [
      { id: 'v4', date: '2026-04-06T14:30:00Z', bp: '120/80', spo2: 98, temp: 36.6, hr: 72, notes: 'Excellent vitals, no symptoms observed' },
      { id: 'v4b', date: '2026-04-04T10:00:00Z', bp: '118/78', spo2: 98, temp: 36.5, hr: 70, notes: 'Routine check-up, breathing normal' },
    ],
    prescriptions: ['Salbutamol Inhaler as needed'],
    notes: 'Breathing is normal. Good compliance.',
    aiSummary: 'Low-risk patient with well-controlled asthma. All vitals normal and within optimal range. Perfect medication adherence. Continue current treatment. Routine follow-up in 3 months recommended. No immediate action needed.',
  },
  {
    id: 'patient003',
    name: 'Mohan Lal',
    age: 55,
    gender: 'Male',
    phone: '9876543212',
    village: 'Village B',
    conditions: ['Hypertension'],
    riskLevel: 'MEDIUM',
    riskScore: 50,
    emergencyFlag: false,
    lastVisited: '2026-04-07T09:15:00Z',
    overdue: false,
    adherencePercentage: 85,
    adherenceLog: ['yes', 'yes', 'yes', 'no', 'yes', 'yes', 'yes'],
    vitalsHistory: [
      { id: 'v5', date: '2026-04-07T09:15:00Z', bp: '140/90', spo2: 97, temp: 36.7, hr: 75, notes: 'BP slightly elevated, medication effective' },
      { id: 'v5b', date: '2026-04-05T11:00:00Z', bp: '138/88', spo2: 97, temp: 36.6, hr: 73, notes: 'BP trending down, patient compliant' },
    ],
    prescriptions: ['Losartan 50mg once daily', 'Hydrochlorothiazide 12.5mg daily'],
    notes: 'Doing well, bp slightly elevated. Good compliance.',
    aiSummary: 'Medium-risk hypertension patient. BP control adequate but slightly elevated. Current medication regimen effective with 85% compliance. Weight and stress management beneficial. Follow-up in 2 weeks. Consider lifestyle modifications including salt reduction and regular exercise.',
  },
  {
    id: 'patient004',
    name: 'Geeta Bai',
    age: 72,
    gender: 'Female',
    phone: '9876543213',
    village: 'Village C',
    conditions: ['Diabetes', 'Arthritis'],
    riskLevel: 'HIGH',
    riskScore: 80,
    emergencyFlag: false,
    lastVisited: '2026-03-30T11:00:00Z',
    overdue: true,
    adherencePercentage: 50,
    adherenceLog: ['no', 'yes', 'no', 'yes', 'no', 'yes', 'yes'],
    vitalsHistory: [
      { id: 'v6', date: '2026-03-30T11:00:00Z', bp: '130/85', spo2: 96, temp: 37.1, hr: 82, isCritical: false, notes: 'Elderly patient, irregular insulin compliance' },
      { id: 'v6b', date: '2026-03-28T14:00:00Z', bp: '128/84', spo2: 95, temp: 37.0, hr: 81, notes: 'Slight fever detected, monitoring required' },
    ],
    prescriptions: ['Insulin 10 units twice daily', 'Metformin 500mg thrice daily', 'Paracetamol 500mg as needed'],
    notes: 'Elderly diabetic patient. Overdue for follow-up. Needs caregiver support for medication compliance.',
    aiSummary: 'High-risk geriatric patient with poorly controlled diabetes. Low medication adherence (50%) is primary concern. Recent vitals show mild fever and elevated BP. Risk of diabetic complications increasing. Urgent follow-up needed. Family counseling on medication management strongly recommended.',
  },
  {
    id: 'patient005',
    name: 'Arjun Singh',
    age: 38,
    gender: 'Male',
    phone: '9876543214',
    village: 'Village B',
    conditions: ['Healthy'],
    riskLevel: 'LOW',
    riskScore: 10,
    emergencyFlag: false,
    lastVisited: '2026-04-06T16:45:00Z',
    overdue: false,
    adherencePercentage: 100,
    adherenceLog: ['none', 'none', 'none', 'none', 'none', 'none', 'none'],
    vitalsHistory: [
      { id: 'v7', date: '2026-04-06T16:45:00Z', bp: '118/78', spo2: 99, temp: 36.5, hr: 68, notes: 'Excellent overall health, all parameters optimal' },
      { id: 'v7b', date: '2026-04-04T09:30:00Z', bp: '116/76', spo2: 99, temp: 36.4, hr: 66, notes: 'Routine screening, no concerns' },
    ],
    prescriptions: [],
    notes: 'Routine checkup. Healthy subject.',
    aiSummary: 'Low-risk healthy individual. All vital signs optimal and within healthy range. No medical conditions detected. Fitness level excellent. Continue current lifestyle and routine preventive care. Annual check-up recommended.',
  },
];
