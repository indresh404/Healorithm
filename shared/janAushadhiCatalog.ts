// shared/janAushadhiCatalog.ts
import { JanAushadhiItem, GovernmentScheme } from './types';

export const JAN_AUSHADHI_CATALOG: JanAushadhiItem[] = [
  // 1. Cardiovascular & Hypertension
  {
    id: 'ja-101',
    brand_name: 'Telma 40 (Telmisartan)',
    generic_name: 'Telmisartan Tablets IP 40mg',
    category: 'Cardiovascular / Hypertension',
    dosage: '1 Tab Daily (Morning)',
    brand_price: 185,
    generic_price: 24,
    savings_percentage: 87,
    indications: ['Essential Hypertension', 'Cardiovascular Risk Reduction in Type 2 Diabetes']
  },
  {
    id: 'ja-102',
    brand_name: 'Amlong 5 (Amlodipine)',
    generic_name: 'Amlodipine Besylate Tablets IP 5mg',
    category: 'Cardiovascular / Hypertension',
    dosage: '1 Tab Daily (Morning)',
    brand_price: 65,
    generic_price: 9,
    savings_percentage: 86,
    indications: ['Hypertension', 'Chronic Stable Angina']
  },
  {
    id: 'ja-103',
    brand_name: 'Atorva 10 (Atorvastatin)',
    generic_name: 'Atorvastatin Calcium Tablets IP 10mg',
    category: 'Cardiovascular / Lipid Lowering',
    dosage: '1 Tab at Bedtime',
    brand_price: 170,
    generic_price: 22,
    savings_percentage: 87,
    indications: ['Hypercholesterolemia', 'Dyslipidemia', 'Coronary Artery Disease']
  },
  {
    id: 'ja-104',
    brand_name: 'Ecosprin 75 (Aspirin)',
    generic_name: 'Aspirin Gastro-Resistant Tablets IP 75mg',
    category: 'Cardiovascular / Antiplatelet',
    dosage: '1 Tab Daily after meal',
    brand_price: 32,
    generic_price: 6,
    savings_percentage: 81,
    indications: ['Prevention of Myocardial Infarction', 'Ischemic Stroke Prophylaxis']
  },
  {
    id: 'ja-105',
    brand_name: 'Cardivas 3.125 (Carvedilol)',
    generic_name: 'Carvedilol Tablets IP 3.125mg',
    category: 'Cardiovascular / Heart Failure',
    dosage: '1 Tab Twice Daily with food',
    brand_price: 110,
    generic_price: 18,
    savings_percentage: 84,
    indications: ['Congestive Heart Failure', 'Hypertension']
  },

  // 2. Diabetes & Metabolic Care
  {
    id: 'ja-201',
    brand_name: 'Glycomet 500 (Metformin)',
    generic_name: 'Metformin Hydrochloride Prolonged-Release Tablets IP 500mg',
    category: 'Diabetes Care',
    dosage: '1 Tab Twice Daily after meals',
    brand_price: 95,
    generic_price: 14,
    savings_percentage: 85,
    indications: ['Type 2 Diabetes Mellitus', 'Insulin Resistance']
  },
  {
    id: 'ja-202',
    brand_name: 'Amaryl 1mg (Glimepiride)',
    generic_name: 'Glimepiride Tablets IP 1mg',
    category: 'Diabetes Care',
    dosage: '1 Tab with first main meal of the day',
    brand_price: 88,
    generic_price: 12,
    savings_percentage: 86,
    indications: ['Type 2 Diabetes Mellitus adjunctive therapy']
  },
  {
    id: 'ja-203',
    brand_name: 'Galvus 50 (Vildagliptin)',
    generic_name: 'Vildagliptin Tablets 50mg',
    category: 'Diabetes Care',
    dosage: '1 Tab Twice Daily',
    brand_price: 290,
    generic_price: 45,
    savings_percentage: 84,
    indications: ['Type 2 Diabetes Mellitus (DPP-4 Inhibitor)']
  },

  // 3. Antibiotics & Anti-Infectives
  {
    id: 'ja-301',
    brand_name: 'Augmentin 625 Duo (Amoxicillin + Clavulanate)',
    generic_name: 'Amoxicillin and Potassium Clavulanate Tablets IP 625mg',
    category: 'Antibiotic',
    dosage: '1 Tab Twice Daily after meals for 5-7 days',
    brand_price: 240,
    generic_price: 52,
    savings_percentage: 78,
    indications: ['Bacterial Sinusitis', 'Pneumonia', 'Skin & Soft Tissue Infections', 'UTI']
  },
  {
    id: 'ja-302',
    brand_name: 'Azithral 500 (Azithromycin)',
    generic_name: 'Azithromycin Tablets IP 500mg',
    category: 'Antibiotic',
    dosage: '1 Tab Once Daily 1 hour before or 2 hours after food for 3 days',
    brand_price: 135,
    generic_price: 38,
    savings_percentage: 72,
    indications: ['Upper & Lower Respiratory Tract Infections', 'Pharyngitis', 'Tonsillitis']
  },
  {
    id: 'ja-303',
    brand_name: 'Cifran 500 (Ciprofloxacin)',
    generic_name: 'Ciprofloxacin Hydrochloride Tablets IP 500mg',
    category: 'Antibiotic',
    dosage: '1 Tab Twice Daily for 5 days',
    brand_price: 85,
    generic_price: 19,
    savings_percentage: 78,
    indications: ['Complicated UTI', 'Infectious Diarrhea', 'Typhoid Fever']
  },
  {
    id: 'ja-304',
    brand_name: 'Flagyl 400 (Metronidazole)',
    generic_name: 'Metronidazole Tablets IP 400mg',
    category: 'Anti-infective / Anti-protozoal',
    dosage: '1 Tab 3 Times Daily with food for 5 days',
    brand_price: 45,
    generic_price: 8,
    savings_percentage: 82,
    indications: ['Amebiasis', 'Giardiasis', 'Anaerobic Bacterial Infections', 'Dental Abscess']
  },

  // 4. Analgesics, Antipyretics & Anti-Inflammatory
  {
    id: 'ja-401',
    brand_name: 'Calpol 650 / Dolo 650 (Paracetamol)',
    generic_name: 'Paracetamol Tablets IP 650mg',
    category: 'Analgesic / Antipyretic',
    dosage: '1 Tab every 6-8 hours as needed (Max 4g/day)',
    brand_price: 35,
    generic_price: 6,
    savings_percentage: 83,
    indications: ['Fever', 'Headache', 'Mild to Moderate Arthralgia & Body Aches']
  },
  {
    id: 'ja-402',
    brand_name: 'Combiflam (Ibuprofen + Paracetamol)',
    generic_name: 'Ibuprofen 400mg and Paracetamol 325mg Tablets IP',
    category: 'Analgesic / NSAID',
    dosage: '1 Tab Twice Daily after meals',
    brand_price: 48,
    generic_price: 11,
    savings_percentage: 77,
    indications: ['Acute Musculoskeletal Pain', 'Toothache', 'Dysmenorrhea']
  },
  {
    id: 'ja-403',
    brand_name: 'Voveran 50 (Diclofenac)',
    generic_name: 'Diclofenac Sodium Enteric Coated Tablets IP 50mg',
    category: 'NSAID / Anti-inflammatory',
    dosage: '1 Tab Twice Daily with food',
    brand_price: 62,
    generic_price: 10,
    savings_percentage: 84,
    indications: ['Rheumatoid Arthritis', 'Osteoarthritis', 'Acute Gouty Arthritis']
  },

  // 5. Gastrointestinal & Acid-Peptic
  {
    id: 'ja-501',
    brand_name: 'Pan 40 (Pantoprazole)',
    generic_name: 'Pantoprazole Gastro-resistant Tablets IP 40mg',
    category: 'Gastrointestinal',
    dosage: '1 Tab Morning 30 mins before breakfast',
    brand_price: 155,
    generic_price: 19,
    savings_percentage: 88,
    indications: ['GERD', 'Gastritis', 'Peptic Ulcer Disease', 'NSAID-induced Dyspepsia Prophylaxis']
  },
  {
    id: 'ja-502',
    brand_name: 'Omez 20 (Omeprazole)',
    generic_name: 'Omeprazole Capsules IP 20mg',
    category: 'Gastrointestinal',
    dosage: '1 Cap in morning before meals',
    brand_price: 70,
    generic_price: 12,
    savings_percentage: 83,
    indications: ['Heartburn', 'Acid Reflux', 'Erosive Esophagitis']
  },
  {
    id: 'ja-503',
    brand_name: 'Eldoper 2mg (Loperamide)',
    generic_name: 'Loperamide Hydrochloride Capsules IP 2mg',
    category: 'Gastrointestinal / Anti-diarrheal',
    dosage: '2 Caps initially, then 1 cap after each unformed stool',
    brand_price: 36,
    generic_price: 7,
    savings_percentage: 81,
    indications: ['Acute Non-specific Diarrhea', 'Gastroenteritis (Symptomatic Relief)']
  },
  {
    id: 'ja-504',
    brand_name: 'ORS Sachet (Oral Rehydration Salts)',
    generic_name: 'Oral Rehydration Salts IP (WHO Formulation)',
    category: 'Electrolytes & Fluid Replacement',
    dosage: 'Dissolve 1 sachet in 1 Litre of clean drinking water and sip frequently',
    brand_price: 24,
    generic_price: 5,
    savings_percentage: 79,
    indications: ['Dehydration due to Diarrhea / Vomiting / Heat Exhaustion']
  },

  // 6. Respiratory & Allergy
  {
    id: 'ja-601',
    brand_name: 'Montair LC (Montelukast + Levocetirizine)',
    generic_name: 'Montelukast Sodium 10mg + Levocetirizine Dihydrochloride 5mg Tablets',
    category: 'Respiratory / Anti-allergic',
    dosage: '1 Tab Night at bedtime',
    brand_price: 210,
    generic_price: 28,
    savings_percentage: 86,
    indications: ['Allergic Rhinitis', 'Chronic Urticaria', 'Allergic Bronchial Asthma']
  },
  {
    id: 'ja-602',
    brand_name: 'Cetcip 10 (Cetirizine)',
    generic_name: 'Cetirizine Hydrochloride Tablets IP 10mg',
    category: 'Anti-histamine',
    dosage: '1 Tab Daily at bedtime',
    brand_price: 38,
    generic_price: 6,
    savings_percentage: 84,
    indications: ['Seasonal Allergies', 'Skin Itching', 'Runny Nose', 'Conjunctivitis']
  },
  {
    id: 'ja-603',
    brand_name: 'Asthalin 100mcg Inhaler (Salbutamol)',
    generic_name: 'Salbutamol Inhalation Aerosol IP 100mcg/puff (200 MDI Doses)',
    category: 'Respiratory / Bronchodilator',
    dosage: '1-2 Puffs as needed during acute breathlessness/wheezing',
    brand_price: 165,
    generic_price: 49,
    savings_percentage: 70,
    indications: ['Bronchial Asthma', 'COPD Wheezing Emergency Relief']
  },

  // 7. Maternal, Child & Nutritional Supplements
  {
    id: 'ja-701',
    brand_name: 'Autrin / Fefol (Iron + Folic Acid)',
    generic_name: 'Ferrous Ascorbate 100mg equivalent to elemental iron + Folic Acid 1.5mg Tablets',
    category: 'Nutritional / Hematinic',
    dosage: '1 Tab Daily after meal with vitamin C/citrus water',
    brand_price: 145,
    generic_price: 22,
    savings_percentage: 85,
    indications: ['Iron Deficiency Anemia', 'Antenatal Nutritional Support in Pregnancy']
  },
  {
    id: 'ja-702',
    brand_name: 'Shelcal 500 (Calcium + Vitamin D3)',
    generic_name: 'Calcium Carbonate 500mg + Vitamin D3 250 IU Tablets IP',
    category: 'Bone & Joint Health',
    dosage: '1 Tab Daily with milk/meal',
    brand_price: 130,
    generic_price: 18,
    savings_percentage: 86,
    indications: ['Osteoporosis Prophylaxis', 'Calcium Deficiency', 'Pregnancy & Lactation']
  },
  {
    id: 'ja-703',
    brand_name: 'Becosules (Vitamin B-Complex + Zinc)',
    generic_name: 'Vitamin B-Complex with Vitamin C and Zinc Capsules',
    category: 'Multivitamins',
    dosage: '1 Cap Daily after lunch',
    brand_price: 65,
    generic_price: 12,
    savings_percentage: 82,
    indications: ['Mouth Ulcers', 'General Weakness & Fatigue', 'Post-illness Recovery']
  }
];

export const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'sch-pmjay',
    name: 'Ayushman Bharat - PM-JAY (Pradhan Mantri Jan Arogya Yojana)',
    short_code: 'PM-JAY',
    description: 'Cashless hospitalisation coverage up to ₹5 Lakh per family per year for secondary and tertiary care across 27,000+ empanelled hospitals.',
    coverage_amount: '₹5,00,000 / family / year',
    eligibility_criteria: [
      'SECC 2011 rural deprivation D1-D7 criteria (kutcha houses, landless labor, SC/ST)',
      'BPL / Ration card low-income rural households',
      'Senior citizens (70+ universal scheme coverage)'
    ],
    portal_url: 'https://mera.pmjay.gov.in'
  },
  {
    id: 'sch-pmsma',
    name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
    short_code: 'PMSMA',
    description: 'Free, guaranteed and comprehensive antenatal care package including USG, blood grouping, Hb test, and specialist doctor consultation on 9th of every month.',
    coverage_amount: '100% Free Antenatal, Diagnostic & Obstetric Care',
    eligibility_criteria: [
      'All pregnant women in 2nd and 3rd trimester',
      'Registered with local ASHA worker / Village Health Sanitation & Nutrition Committee'
    ],
    portal_url: 'https://pmsma.mohfw.gov.in'
  },
  {
    id: 'sch-ncd',
    name: 'National Programme for Prevention & Control of NCDs (NP-NCD)',
    short_code: 'NP-NCD',
    description: 'Continuous village-level screening, early diagnosis, and free lifetime generic medication for Hypertension, Type 2 Diabetes, Oral, Breast, and Cervical Cancers.',
    coverage_amount: 'Free Continuous Generic Medicines at Sub-Centres & PHCs',
    eligibility_criteria: [
      'Population aged 30+ screened via CBAC form by ASHA',
      'Diagnosed cases of chronic Hypertension or Diabetes'
    ],
    portal_url: 'https://main.mohfw.gov.in'
  },
  {
    id: 'sch-pmbjp',
    name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
    short_code: 'PMBJP Kendras',
    description: 'Access to 1,800+ WHO-GMP certified high-quality generic medicines and 285 surgicals at 50% to 90% lesser cost compared to market branded prices.',
    coverage_amount: 'Up to 90% Direct Out-Of-Pocket Savings on All Prescriptions',
    eligibility_criteria: [
      'Open to 100% Indian citizens across 10,000+ PMBJP Kendras in all districts'
    ],
    portal_url: 'https://janaushadhi.gov.in'
  },
  {
    id: 'sch-jsy',
    name: 'Janani Suraksha Yojana (JSY)',
    short_code: 'JSY',
    description: 'Direct Cash Transfer of ₹1,400 (rural) for promoting institutional deliveries among poor pregnant women, reducing maternal and neo-natal mortality.',
    coverage_amount: 'Direct cash benefit ₹1,400 + Free transport via 108/102',
    eligibility_criteria: [
      'BPL pregnant women delivering in public health facility / accredited private clinic'
    ],
    portal_url: 'https://nhm.gov.in'
  }
];

export function findJanAushadhiMatch(medicineName: string): JanAushadhiItem | undefined {
  if (!medicineName) return undefined;
  const norm = medicineName.toLowerCase().trim();
  
  return JAN_AUSHADHI_CATALOG.find(item => {
    const brandTokens = item.brand_name.toLowerCase().split(/[\s(),/+-]+/);
    const genericTokens = item.generic_name.toLowerCase().split(/[\s(),/+-]+/);
    return brandTokens.some(t => t.length > 2 && norm.includes(t)) ||
           genericTokens.some(t => t.length > 2 && norm.includes(t));
  });
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
      totalBrand += 120;
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
