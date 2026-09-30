// src/lib/janAushadhiCatalog.ts
import { JanAushadhiItem, GovernmentScheme } from '../types';

export const JAN_AUSHADHI_CATALOG: JanAushadhiItem[] = [
  {
    id: 'ja-1',
    brand_name: 'Telma 40 (Telmisartan)',
    generic_name: 'Telmisartan 40mg',
    category: 'Cardiovascular / Hypertension',
    dosage: '1 Tab Daily',
    brand_price: 185,
    generic_price: 24,
    savings_percentage: 87,
    indications: ['Hypertension', 'Cardiovascular Risk Reduction']
  },
  {
    id: 'ja-2',
    brand_name: 'Glycomet 500 (Metformin)',
    generic_name: 'Metformin Hydrochloride 500mg',
    category: 'Diabetes Care',
    dosage: '1 Tab Twice Daily after meals',
    brand_price: 95,
    generic_price: 14,
    savings_percentage: 85,
    indications: ['Type 2 Diabetes Mellitus']
  },
  {
    id: 'ja-3',
    brand_name: 'Atorva 10 (Atorvastatin)',
    generic_name: 'Atorvastatin Calcium 10mg',
    category: 'Cardiovascular / Lipid Lowering',
    dosage: '1 Tab at Bedtime',
    brand_price: 170,
    generic_price: 22,
    savings_percentage: 87,
    indications: ['Hypercholesterolemia', 'Coronary Artery Disease']
  },
  {
    id: 'ja-4',
    brand_name: 'Pan 40 (Pantoprazole)',
    generic_name: 'Pantoprazole Gastro-resistant 40mg',
    category: 'Gastrointestinal',
    dosage: '1 Tab Morning before food',
    brand_price: 155,
    generic_price: 19,
    savings_percentage: 88,
    indications: ['GERD', 'Gastritis', 'Peptic Ulcer']
  },
  {
    id: 'ja-5',
    brand_name: 'Augmentin 625 (Amoxicillin + Clavulanate)',
    generic_name: 'Amoxicillin and Potassium Clavulanate 625mg',
    category: 'Antibiotic',
    dosage: '1 Tab Twice Daily for 5 days',
    brand_price: 240,
    generic_price: 52,
    savings_percentage: 78,
    indications: ['Bacterial Infections', 'Respiratory Tract Infection']
  },
  {
    id: 'ja-6',
    brand_name: 'Calpol 650 (Paracetamol)',
    generic_name: 'Paracetamol 650mg',
    category: 'Analgesic / Antipyretic',
    dosage: '1 Tab as needed for fever',
    brand_price: 35,
    generic_price: 6,
    savings_percentage: 83,
    indications: ['Fever', 'Mild to Moderate Body Pain']
  },
  {
    id: 'ja-7',
    brand_name: 'Montair LC (Montelukast + Levocetirizine)',
    generic_name: 'Montelukast 10mg + Levocetirizine 5mg',
    category: 'Respiratory / Allergy',
    dosage: '1 Tab Night',
    brand_price: 210,
    generic_price: 28,
    savings_percentage: 86,
    indications: ['Allergic Rhinitis', 'Chronic Cough', 'Asthma']
  },
  {
    id: 'ja-8',
    brand_name: 'Amlong 5 (Amlodipine)',
    generic_name: 'Amlodipine Besylate 5mg',
    category: 'Cardiovascular',
    dosage: '1 Tab Morning',
    brand_price: 65,
    generic_price: 9,
    savings_percentage: 86,
    indications: ['High Blood Pressure', 'Angina']
  }
];

export const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'sch-pmjay',
    name: 'Ayushman Bharat - PM-JAY',
    short_code: 'PM-JAY',
    description: 'Cashless hospitalisation coverage up to ₹5 Lakh per family per year for secondary and tertiary healthcare.',
    coverage_amount: '₹5,00,000 / year',
    eligibility_criteria: ['SECC 2011 rural deprivation criteria', 'BPL / Low-income households', 'Senior citizens without prior insurance'],
    portal_url: 'https://mera.pmjay.gov.in'
  },
  {
    id: 'sch-pmsma',
    name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
    short_code: 'PMSMA',
    description: 'Free, comprehensive and quality antenatal care provided to pregnant women on the 9th of every month.',
    coverage_amount: '100% Free Antenatal & Diagnostic Care',
    eligibility_criteria: ['All pregnant women in 2nd and 3rd trimester', 'Registered at local ASHA/Anganwadi'],
    portal_url: 'https://pmsma.mohfw.gov.in'
  },
  {
    id: 'sch-ncd',
    name: 'National Programme for Prevention & Control of NCDs',
    short_code: 'NP-NCD',
    description: 'Free screening, diagnosis, and continuous essential medication for Hypertension, Diabetes, and common Cancers.',
    coverage_amount: 'Free Continuous Generic Medicines at Sub-Centers',
    eligibility_criteria: ['Age 30+ population screened by ASHA', 'Diagnosed Hypertension/Diabetes'],
    portal_url: 'https://main.mohfw.gov.in'
  },
  {
    id: 'sch-pmbjp',
    name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    short_code: 'PMBJP Kendras',
    description: 'Access to quality generic medicines at 50% to 90% lesser cost compared to branded equivalents.',
    coverage_amount: 'Up to 90% Out-of-pocket savings on medicines',
    eligibility_criteria: ['Open to all Indian citizens across 10,000+ Kendras'],
    portal_url: 'https://janaushadhi.gov.in'
  }
];

export function findJanAushadhiMatch(medicineName: string): JanAushadhiItem | undefined {
  const norm = medicineName.toLowerCase();
  return JAN_AUSHADHI_CATALOG.find(item => 
    norm.includes(item.brand_name.toLowerCase().split(' ')[0]) || 
    norm.includes(item.generic_name.toLowerCase().split(' ')[0])
  );
}

export function calculateTotalPrescriptionSavings(medicines: { medicine_name: string }[]) {
  let totalBrand = 0;
  let totalGeneric = 0;

  medicines.forEach(m => {
    const match = findJanAushadhiMatch(m.medicine_name);
    if (match) {
      totalBrand += match.brand_price;
      totalGeneric += match.generic_price;
    } else {
      totalBrand += 120; // estimate
      totalGeneric += 25;
    }
  });

  const totalSavings = totalBrand - totalGeneric;
  const percentage = totalBrand > 0 ? Math.round((totalSavings / totalBrand) * 100) : 0;

  return {
    totalBrand,
    totalGeneric,
    totalSavings,
    percentage
  };
}
