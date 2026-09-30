import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { store } from '../lib/storage';
import { User, MedicalRecord, HealthAnalytics, Prescription } from '@shared/types';
import { findJanAushadhiMatch, calculateTotalPrescriptionSavings } from '@shared/janAushadhiCatalog';
import { playVoicePrompt } from '@shared/translations';
import { AILoader } from '../components/ui/ai-loader';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Pill, 
  Plus, 
  CheckCircle2, 
  X, 
  Bot, 
  FileText, 
  Printer,
  Sparkles,
  Heart,
  Clock,
  Send,
  Volume2,
  VolumeX,
  Play,
  Square
} from 'lucide-react';

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showAIAgentModal, setShowAIAgentModal] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [selectedBodyZone, setSelectedBodyZone] = useState<string | null>('chest');

  // Form state for adding record
  const [reportType, setReportType] = useState('Doctor Clinical Review');
  const [details, setDetails] = useState('');
  const [systolicBp, setSystolicBp] = useState<number | ''>('');
  const [diastolicBp, setDiastolicBp] = useState<number | ''>('');
  const [spo2, setSpo2] = useState<number | ''>('');
  const [glucose, setGlucose] = useState<number | ''>('');
  const [newRxName, setNewRxName] = useState('');
  const [newRxDosage, setNewRxDosage] = useState('1 Tab Daily');

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const patientId = id || snapshot.activePatientId;
  const user = snapshot.users.find(u => u.id === patientId) || snapshot.users[0];
  const analytics = snapshot.analytics.find(a => a.user_id === user.id);
  const records = snapshot.records.filter(r => r.user_id === user.id);
  const prescriptions = snapshot.prescriptions.filter(p => p.user_id === user.id);
  const careTasks = snapshot.careTasks.filter(t => t.user_id === user.id);

  const savings = calculateTotalPrescriptionSavings(prescriptions);

  const handleApproveGeneric = (rxId: string) => {
    store.updatePrescriptionGenericStatus(rxId, 'approved');
  };

  const handleKeepBrand = (rxId: string) => {
    const reason = prompt('Enter clinical justification for keeping brand name:', 'Specific bioavailability requirement');
    if (reason) {
      store.updatePrescriptionGenericStatus(rxId, 'kept_brand', reason);
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    store.addVitalsAndRecord({
      userId: user.id,
      symptoms: selectedBodyZone ? [selectedBodyZone] : [],
      bodyZones: selectedBodyZone ? [selectedBodyZone] : [],
      vitals: {
        systolic_bp: systolicBp ? Number(systolicBp) : undefined,
        diastolic_bp: diastolicBp ? Number(diastolicBp) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
        blood_glucose: glucose ? Number(glucose) : undefined,
      },
      provisional_diagnosis: details,
      workerId: 'doctor-web-admin'
    });

    if (newRxName) {
      const match = findJanAushadhiMatch(newRxName);
      store.addPrescription({
        user_id: user.id,
        medical_record_id: `rec-${Date.now()}`,
        medicine_name: newRxName,
        generic_name: match?.generic_name || newRxName,
        dosage: newRxDosage,
        timing: 'Morning',
        duration: '30 Days',
        generic_status: 'approved',
        brand_price: match?.brand_price || 120,
        generic_price: match?.generic_price || 20,
        savings: (match?.brand_price || 120) - (match?.generic_price || 20)
      });
    }

    setShowAddRecordModal(false);
    setDetails('');
    setNewRxName('');
  };

  // AI Agent Voice Synthesis Explanation
  const agentCaseSummaryText = `Patient ${user.name}, age ${user.age}, from ${user.village || 'Adoni'}. 
Current clinical risk score is ${analytics?.risk_score || 20} out of 100, placed in the ${analytics?.risk_level || 'Low'} risk band. 
Key contributing factors: ${analytics?.risks?.join(', ') || 'Vitals stable'}. 
Blood pressure recorded at ${analytics?.systolic_bp || 120} over ${analytics?.diastolic_bp || 80} mmHg, with oxygen saturation at ${analytics?.spo2 || 98} percent. 
Recommended care coordination action: ${careTasks[0]?.recommended_action || 'Continue standard rural telemedicine protocol and verify Jan Aushadhi generic compliance.'}`;

  const startAIAgentExplanation = () => {
    setShowAIAgentModal(true);
    setIsAISpeaking(true);
    playVoicePrompt(agentCaseSummaryText, 'en');
  };

  const stopAIAgentExplanation = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                analytics?.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                analytics?.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                analytics?.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {analytics?.risk_level || 'Low'} Risk ({analytics?.risk_score || 20}/100)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.age} yrs • {user.gender} • Blood Group: {user.blood_group || 'B+'} • Village: {user.village || 'Adoni'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Agent Voice Case Explanation Trigger */}
          <button
            onClick={startAIAgentExplanation}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
            title="Listen to AI Agent Voice Summary with Animated Orb"
          >
            <Bot className="w-4 h-4 text-blue-400" />
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI Voice Case Brief</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Summary</span>
          </button>
          
          <button
            onClick={() => setShowAddRecordModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clinical Entry</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: 3D Body Model & Clinical History */}
        <div className="lg:col-span-7 space-y-8">
          {/* 2D Anatomical Triage & Symptom Mapping */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Anatomical System & Symptoms</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                analytics?.risk_level === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {analytics?.risk_level || 'Normal'} Priority
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'head', name: 'Head / CNS', color: 'border-red-200 bg-red-50 text-red-700' },
                { id: 'chest', name: 'Cardiovascular / Heart', color: 'border-rose-200 bg-rose-50 text-rose-700' },
                { id: 'lungs', name: 'Respiratory / Lungs', color: 'border-amber-200 bg-amber-50 text-amber-700' },
                { id: 'abdomen', name: 'Gastrointestinal', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                { id: 'joints', name: 'Musculoskeletal', color: 'border-amber-200 bg-amber-50 text-amber-700' },
                { id: 'extremities', name: 'Peripheral Circulation', color: 'border-red-200 bg-red-50 text-red-700' },
              ].map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedBodyZone(zone.id)}
                  className={`p-3 rounded-xl border text-left font-bold transition-all ${
                    selectedBodyZone === zone.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20' 
                      : `${zone.color} hover:opacity-80`
                  }`}
                >
                  {zone.name}
                </button>
              ))}
            </div>

            {records[0]?.symptoms && records[0].symptoms.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">Active Tagged Symptoms</span>
                <div className="flex flex-wrap gap-1.5">
                  {records[0].symptoms.map((symptom, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      • {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vitals Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Blood Pressure</span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {analytics?.systolic_bp ? `${analytics.systolic_bp}/${analytics.diastolic_bp || 80}` : '120/80'} <span className="text-xs text-slate-400 font-normal">mmHg</span>
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">SpO2 Oxygen</span>
              <p className={`text-lg font-bold mt-1 ${analytics?.spo2 && analytics.spo2 < 90 ? 'text-red-600' : 'text-slate-900'}`}>
                {analytics?.spo2 || 98}%
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Heart Rate</span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {analytics?.heart_rate || 78} <span className="text-xs text-slate-400 font-normal">bpm</span>
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Blood Glucose</span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {analytics?.blood_glucose || 110} <span className="text-xs text-slate-400 font-normal">mg/dL</span>
              </p>
            </div>
          </div>

          {/* Clinical Records & Visit Timeline */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900">Encounter & Field Visit History</h3>
              <span className="text-xs font-bold text-slate-400">{records.length} Recorded Entries</span>
            </div>

            <div className="space-y-4">
              {records.map((rec) => (
                <div key={rec.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                        {rec.report_type}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{rec.date}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{rec.hospital}</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{rec.details}</p>
                  {rec.vitals && (
                    <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-600 font-mono">
                      {rec.vitals.systolic_bp && <span className="bg-white px-2 py-0.5 rounded border border-slate-200">BP: {rec.vitals.systolic_bp}/{rec.vitals.diastolic_bp}</span>}
                      {rec.vitals.spo2 && <span className="bg-white px-2 py-0.5 rounded border border-slate-200">SpO2: {rec.vitals.spo2}%</span>}
                      {rec.vitals.blood_glucose && <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Sugar: {rec.vitals.blood_glucose} mg/dL</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 5 Columns: Care Coordination Agent & Jan Aushadhi Doctor Report Engine */}
        <div className="lg:col-span-5 space-y-8">
          {/* Care Coordination Agent Insights */}
          <section className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Care Coordination Agent</h3>
                  <p className="text-xs text-slate-400">Automated Triage & Case Summary</p>
                </div>
              </div>

              <button
                onClick={startAIAgentExplanation}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl transition-colors"
                title="Play Voice Briefing"
              >
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              </button>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2 mb-4 text-xs">
              <p className="text-slate-300">
                <strong>Weekly Insight:</strong> {analytics?.weekly_summary || 'Patient monitored by assigned ASHA worker.'}
              </p>
              <p className="text-amber-400 font-medium">
                <strong>Contributing Risk Factors:</strong> {analytics?.risks?.join('; ') || 'Routine parameters'}
              </p>
            </div>

            {careTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Active Agent Field Tasks</p>
                {careTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs space-y-1">
                    <p className="font-bold text-amber-300">{t.reason}</p>
                    <p className="text-slate-400">{t.recommended_action}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Jan Aushadhi Doctor Confirmation Engine */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Jan Aushadhi Prescription Engine</h3>
                  <p className="text-xs text-slate-500">Doctor line-by-line confirmation & report sync</p>
                </div>
              </div>
            </div>

            {/* Prescriptions List with Doctor Actions */}
            <div className="space-y-3">
              {prescriptions.map((rx) => {
                const match = findJanAushadhiMatch(rx.medicine_name);
                const isApproved = rx.generic_status === 'approved';

                return (
                  <div key={rx.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{rx.medicine_name}</h4>
                        <p className="text-xs text-slate-500">Dosage: {rx.dosage} • Timing: {rx.timing}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {rx.generic_status || 'Pending Review'}
                      </span>
                    </div>

                    {/* Jan Aushadhi Generic Comparison */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Generic Equivalent</span>
                        <p className="font-bold text-slate-800">{rx.generic_name || match?.generic_name || rx.medicine_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 line-through">₹{rx.brand_price || match?.brand_price || 120}</span>
                        <p className="font-bold text-emerald-700">₹{rx.generic_price || match?.generic_price || 20}</p>
                      </div>
                    </div>

                    {/* Doctor Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApproveGeneric(rx.id)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isApproved ? 'bg-emerald-600 text-white' : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        ✓ Generic Approved
                      </button>
                      <button
                        onClick={() => handleKeepBrand(rx.id)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-bold transition-all"
                      >
                        Keep Brand
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Savings & Delivery Status */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Confirmed Patient Savings</span>
                <p className="text-xl font-bold text-emerald-800">₹{savings.totalSavings} ({savings.percentage}% Saved)</p>
              </div>
              <div className="text-right text-[11px] font-bold text-emerald-700">
                <span className="bg-emerald-200 px-2 py-0.5 rounded-md">Synced to Patient App</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* AI AGENT VOICE ORB BRIEFING MODAL */}
      {showAIAgentModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl relative text-center">
            <button
              onClick={() => {
                stopAIAgentExplanation();
                setShowAIAgentModal(false);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing AI Loader Orb Animation */}
            <div className="flex justify-center pt-2">
              <AILoader 
                size={160} 
                text={isAISpeaking ? "AI AGENT" : "PAUSED"} 
                fullscreen={false} 
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Care Coordination Agent Case Briefing</h3>
              <p className="text-xs text-blue-400 font-mono">
                {isAISpeaking ? "Synthesizing voice audio & streaming clinical brief..." : "Audio briefing stopped"}
              </p>
            </div>

            {/* Text Box for Doctor */}
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 text-left text-xs leading-relaxed text-slate-300 max-h-48 overflow-y-auto font-sans">
              <p className="font-bold text-amber-300 mb-1">Live Case Summary:</p>
              <p>{agentCaseSummaryText}</p>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {isAISpeaking ? (
                <button
                  onClick={stopAIAgentExplanation}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Pause Audio Brief</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsAISpeaking(true);
                    playVoicePrompt(agentCaseSummaryText, 'en');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Replay Audio Brief</span>
                </button>
              )}

              <button
                onClick={() => {
                  stopAIAgentExplanation();
                  setShowAIAgentModal(false);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Clinical Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Clinical Examination</h3>
              <button onClick={() => setShowAddRecordModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Encounter Type</label>
                <input
                  type="text"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 140"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 90"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 96"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 130"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Clinical Notes & Diagnosis</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Enter diagnosis, symptoms, and examination notes..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase">Attach Prescription (Optional)</span>
                <input
                  type="text"
                  placeholder="Medicine Name (e.g. Telma 40 or Calpol 650)"
                  value={newRxName}
                  onChange={(e) => setNewRxName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
