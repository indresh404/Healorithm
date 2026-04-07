export interface VitalParams {
  id: string;
  date: string;
  bp: string;
  spo2: number;
  temp: number;
  hr: number;
  isHighRisk?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
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
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'patient001',
    name: 'Ramesh Kumar',
    age: 67,
    gender: 'Male',
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
      { id: 'v1', date: '2026-04-05T10:00:00Z', bp: '185/122', spo2: 95, temp: 37.0, hr: 80, isHighRisk: true },
      { id: 'v2', date: '2026-04-03T10:00:00Z', bp: '170/110', spo2: 96, temp: 36.8, hr: 78 },
      { id: 'v3', date: '2026-04-01T10:00:00Z', bp: '160/100', spo2: 97, temp: 36.9, hr: 76 },
    ],
    prescriptions: ['Metformin 500mg', 'Amlodipine 5mg'],
    notes: 'Patient reported dizziness.',
  },
  {
    id: 'patient002',
    name: 'Sunita Devi',
    age: 45,
    gender: 'Female',
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
      { id: 'v4', date: '2026-04-06T14:30:00Z', bp: '120/80', spo2: 98, temp: 36.6, hr: 72 },
    ],
    prescriptions: ['Salbutamol Inhaler'],
    notes: 'Breathing is normal.',
  },
  {
    id: 'patient003',
    name: 'Mohan Lal',
    age: 55,
    gender: 'Male',
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
      { id: 'v5', date: '2026-04-07T09:15:00Z', bp: '140/90', spo2: 97, temp: 36.7, hr: 75 },
    ],
    prescriptions: ['Losartan 50mg'],
    notes: 'Doing well, bp slightly elevated.',
  },
  {
    id: 'patient004',
    name: 'Geeta Bai',
    age: 72,
    gender: 'Female',
    village: 'Village C',
    conditions: ['Diabetes'],
    riskLevel: 'HIGH',
    riskScore: 80,
    emergencyFlag: false,
    lastVisited: '2026-03-30T11:00:00Z',
    overdue: true,
    adherencePercentage: 50,
    adherenceLog: ['no', 'yes', 'no', 'yes', 'no', 'yes', 'yes'],
    vitalsHistory: [
      { id: 'v6', date: '2026-03-30T11:00:00Z', bp: '130/85', spo2: 96, temp: 37.1, hr: 82 },
    ],
    prescriptions: ['Insulin'],
    notes: 'Needs follow up.',
  },
  {
    id: 'patient005',
    name: 'Arjun Singh',
    age: 38,
    gender: 'Male',
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
      { id: 'v7', date: '2026-04-06T16:45:00Z', bp: '118/78', spo2: 99, temp: 36.5, hr: 68 },
    ],
    prescriptions: [],
    notes: 'Routine checkup.',
  },
];
