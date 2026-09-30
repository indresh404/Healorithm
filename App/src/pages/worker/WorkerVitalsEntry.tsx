// src/pages/worker/WorkerVitalsEntry.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../lib/storage';
import BodyZonePicker2D, { BodyZone2D as BodyZone } from '../../components/body/BodyZonePicker2D';
import { calculateClinicalRisk, checkDeterministicEmergency } from '@shared/clinicalRiskEngine';
import { findJanAushadhiMatch, GOVERNMENT_SCHEMES } from '@shared/janAushadhiCatalog';
import { playVoicePrompt } from '@shared/translations';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Pill, 
  Save, 
  CheckCircle2, 
  Volume2, 
  Heart, 
  Plus, 
  FileText,
  Building 
} from 'lucide-react';

export default function WorkerVitalsEntry() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());

  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const tLang = snapshot.selectedLanguage;

  // Form State
  const [systolic, setSystolic] = useState<number | ''>(168);
  const [diastolic, setDiastolic] = useState<number | ''>(102);
  const [spo2, setSpo2] = useState<number | ''>(93);
  const [temp, setTemp] = useState<number | ''>(98.6);
  const [heartRate, setHeartRate] = useState<number | ''>(88);
  const [glucose, setGlucose] = useState<number | ''>(195);
  const [selectedZone, setSelectedZone] = useState<string | null>('chest');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Headache', 'Dizziness', 'Mild Chest Discomfort']);
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('Elevated BP with exertional discomfort. Refer to CHC.');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  // Compute real-time deterministic risk
  const riskResult = calculateClinicalRisk({
    age: activeUser.age,
    gender: activeUser.gender,
    vitals: {
      systolic_bp: systolic ? Number(systolic) : undefined,
      diastolic_bp: diastolic ? Number(diastolic) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      temperature: temp ? Number(temp) : undefined,
      heart_rate: heartRate ? Number(heartRate) : undefined,
      blood_glucose: glucose ? Number(glucose) : undefined,
    },
    symptoms: selectedSymptoms,
    chronic_conditions: ['Hypertension', 'Diabetes'],
    adherence_rate: 80,
    missed_followups: 1
  });

  const handleZoneSelect = (zone: BodyZone) => {
    setSelectedZone(zone.id);
    // Add zone symptoms if not already in list
    const updated = Array.from(new Set([...selectedSymptoms, ...zone.symptoms]));
    setSelectedSymptoms(updated);
  };

  const handleRemoveSymptom = (sym: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== sym));
  };

  const handleVoiceReadRisk = () => {
    const text = tLang === 'hi'
      ? `मरीज़ ${activeUser.name} का जोखिम स्कोर ${riskResult.score} है। श्रेणी: ${riskResult.level}। मुख्य कारण: ${riskResult.factors.slice(0, 2).join(' और ')}`
      : tLang === 'mr'
      ? `रुग्ण ${activeUser.name} यांचा धोका गुण ${riskResult.score} आहे। श्रेणी: ${riskResult.level}।`
      : `Patient ${activeUser.name} clinical risk is ${riskResult.score} out of 100. Category is ${riskResult.level}.`;
    playVoicePrompt(text, tLang);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    store.addVitalsAndRecord({
      userId: activeUser.id,
      symptoms: selectedSymptoms,
      bodyZones: selectedZone ? [selectedZone] : [],
      vitals: {
        systolic_bp: systolic ? Number(systolic) : undefined,
        diastolic_bp: diastolic ? Number(diastolic) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
        temperature: temp ? Number(temp) : undefined,
        heart_rate: heartRate ? Number(heartRate) : undefined,
        blood_glucose: glucose ? Number(glucose) : undefined,
      },
      provisional_diagnosis: provisionalDiagnosis,
      workerId: snapshot.workerSession.workerId
    });

    setSavedSuccess(true);
    setTimeout(() => {
      navigate('/worker');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Patient</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
              HH: {activeUser.household_id || 'HH-042'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">{activeUser.name}</h2>
          <p className="text-xs text-slate-500">
            {activeUser.age} yrs • {activeUser.gender} • Village: {activeUser.village || 'Adoni'} • Phone: {activeUser.phone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Patient Switcher Dropdown */}
          <select
            value={activeUser.id}
            onChange={(e) => store.setActivePatient(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            {snapshot.users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.village})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Deterministic Emergency Alert Banner */}
      {riskResult.is_emergency && (
        <div className="p-5 bg-red-600 text-white rounded-3xl shadow-lg border border-red-700 flex items-start gap-3 animate-pulse">
          <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold uppercase tracking-wider">CRITICAL DETERMINISTIC EMERGENCY TRIGGERED</h4>
              <span className="bg-white text-red-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">IMMEDIATE 108</span>
            </div>
            <p className="text-xs text-red-100 font-medium">
              {riskResult.emergency_reason}
            </p>
            <p className="text-[11px] text-red-200">
              Fixed clinical safety rules override model probabilities. Prepare immediate transport to nearest CHC.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Vitals Entry + 3D Body + Explainable Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Vitals Form & 3D Body Model */}
        <div className="lg:col-span-7 space-y-6">
          <BodyZonePicker2D
            selectedZoneId={selectedZone}
            onZoneSelect={handleZoneSelect}
            activeSymptoms={selectedSymptoms}
          />

          {/* Vitals Form Input Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Enter Clinical Vitals</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Oxygen SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Glucose (mg/dL)</label>
                <input
                  type="number"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Selected Symptoms Chips */}
            <div>
              <label className="block text-slate-600 text-xs mb-1.5 font-bold">Selected Symptoms</label>
              <div className="flex flex-wrap gap-1.5">
                {selectedSymptoms.map(sym => (
                  <span
                    key={sym}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>{sym}</span>
                    <button type="button" onClick={() => handleRemoveSymptom(sym)} className="text-emerald-600 hover:text-emerald-900 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-xs mb-1 font-bold">Provisional Field Note (Labelled as Provisional)</label>
              <textarea
                value={provisionalDiagnosis}
                onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Explainable Risk Calculator + Jan Aushadhi & Schemes Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Explainable 0 to 100 Risk Breakdown Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Explainable Risk Score</span>
                <button
                  type="button"
                  onClick={handleVoiceReadRisk}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  title="Voice guide"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                riskResult.level === 'Critical' ? 'bg-red-100 text-red-700' :
                riskResult.level === 'High' ? 'bg-orange-100 text-orange-700' :
                riskResult.level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {riskResult.level} Risk
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">{riskResult.score}</span>
              <span className="text-slate-400 text-sm font-bold">/ 100</span>
            </div>

            {/* Top Contributing Factors List */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Top Contributing Clinical Factors</p>
              {riskResult.factors.map((fac, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded-xl text-xs text-slate-800 font-medium border border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>

            {/* Referral Priority & Response Target */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs space-y-1">
              <p className="text-emerald-900 font-bold">
                Suggested Referral: {riskResult.priority} ({riskResult.recommended_specialty})
              </p>
              <p className="text-emerald-700 text-[11px]">
                Target Window: {riskResult.target_response_time}
              </p>
            </div>
          </div>

          {/* Jan Aushadhi Generic Medicine Preview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Jan Aushadhi Savings Preview</h3>
            </div>
            <p className="text-xs text-slate-500">
              Offline generic equivalence lookup for current prescribed medicines
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Telma 40 (Telmisartan)</span>
                <span className="text-emerald-700">Save ₹161 (87%)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Generic Price: <strong>₹24</strong> (vs Branded ₹185) at PMBJP Kendra
              </p>
            </div>
          </div>

          {/* Government Scheme Eligibility Preview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Eligible Government Schemes</h3>
            </div>
            
            <div className="space-y-2 text-xs">
              {GOVERNMENT_SCHEMES.slice(0, 2).map((sch) => (
                <div key={sch.id} className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-900">{sch.name}</h4>
                  <p className="text-[11px] text-blue-800 mt-0.5">{sch.coverage_amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={savedSuccess}
            className={`w-full py-4 rounded-3xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
              savedSuccess
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Saved & Encrypted to Local DB!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Vitals & Queue for Sync</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
