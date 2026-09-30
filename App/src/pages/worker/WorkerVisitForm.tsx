// App/src/pages/worker/WorkerVisitForm.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../../lib/storage';
import {
  FileText, Save, CheckCircle2, User, AlertTriangle,
  Activity, Thermometer, Heart, Droplets, ArrowLeft,
  ChevronDown, ChevronUp, MapPin, Phone
} from 'lucide-react';

const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Cold / Runny Nose', 'Breathlessness', 'Chest Pain',
  'Headache', 'Dizziness / Giddiness', 'Body Aches', 'Abdominal Pain',
  'Nausea / Vomiting', 'Diarrhea', 'Swelling in Legs', 'Skin Rash',
  'Loss of Consciousness', 'Convulsions', 'Weakness / Fatigue',
  'Reduced Urination', 'Vision Changes', 'Excessive Thirst', 'No Symptoms'
];

export default function WorkerVisitForm() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [saved, setSaved] = useState(false);

  // Vitals fields
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [triggerReferral, setTriggerReferral] = useState(false);

  useEffect(() => {
    return store.subscribe(() => setSnapshot({ ...store.getSnapshot() }));
  }, []);

  const patient = snapshot.users.find((u) => u.id === snapshot.activePatientId) || snapshot.users[0];
  const analytics = snapshot.analytics.find((a) => a.user_id === patient?.id);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    store.addVitalsAndRecord({
      userId: patient.id,
      symptoms: selectedSymptoms,
      bodyZones: [],
      vitals: {
        systolic_bp: systolicBp ? Number(systolicBp) : undefined,
        diastolic_bp: diastolicBp ? Number(diastolicBp) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
        heart_rate: heartRate ? Number(heartRate) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        blood_glucose: bloodGlucose ? Number(bloodGlucose) : undefined,
      },
      provisional_diagnosis: notes || undefined,
      workerId: snapshot.workerSession.workerId,
    });

    setSaved(true);
    setTimeout(() => navigate('/worker'), 2000);
  };

  // Emergency warning detection
  const spo2Warn = spo2 && Number(spo2) < 90;
  const bpWarn = systolicBp && Number(systolicBp) >= 180;
  const isEmergency = spo2Warn || bpWarn;

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-emerald-700">Visit Recorded</h2>
        <p className="text-sm text-slate-500">
          Patient data saved locally{snapshot.networkStatus === 'online' ? ' and queued for sync.' : ' in offline outbox.'}
        </p>
        <p className="text-xs text-slate-400">Redirecting to dashboard…</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20 text-slate-400">
        <User className="w-12 h-12 mx-auto mb-3" />
        <p className="font-bold">No patient selected</p>
        <Link to="/worker" className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">
          Select from Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Encounter Visit Recording</h2>
          <p className="text-xs text-slate-500 mt-0.5">Field visit notes, vitals, and observations for referral triggers</p>
        </div>
      </div>

      {/* Selected Patient Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-slate-900">{patient.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                analytics?.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                analytics?.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                analytics?.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {analytics?.risk_level || 'Low'} Risk
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {patient.age} yrs • {patient.gender} • {patient.village || 'Adoni'}
            </p>
            {patient.phone && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {patient.phone}
              </p>
            )}
          </div>
          <Link
            to="/worker/scan"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Change Patient
          </Link>
        </div>
      </div>

      {/* Emergency Banner */}
      {isEmergency && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-400 rounded-2xl animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-red-700">EMERGENCY ALERT</p>
            <p className="text-xs text-red-600 mt-0.5">
              {spo2Warn && `SpO2 critically low (${spo2}%). `}
              {bpWarn && `Blood pressure dangerously high (${systolicBp} mmHg). `}
              Prepare for immediate escalation. Notify the nearest CHC.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Vitals */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Vitals Measurement
          </h3>

          {/* BP Row */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Blood Pressure (mmHg)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Systolic (e.g. 120)"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  className={`w-full p-3 bg-slate-50 border rounded-2xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    bpWarn ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                <span className="text-[10px] text-slate-400 ml-1">Systolic</span>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Diastolic (e.g. 80)"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <span className="text-[10px] text-slate-400 ml-1">Diastolic</span>
              </div>
            </div>
          </div>

          {/* Other vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'SpO2 (%)', placeholder: 'e.g. 97', value: spo2, set: setSpo2, icon: Droplets, warn: !!spo2Warn },
              { label: 'Heart Rate (bpm)', placeholder: 'e.g. 78', value: heartRate, set: setHeartRate, icon: Heart, warn: false },
              { label: 'Temperature (°F)', placeholder: 'e.g. 98.6', value: temperature, set: setTemperature, icon: Thermometer, warn: false },
              { label: 'Blood Glucose (mg/dL)', placeholder: 'e.g. 110', value: bloodGlucose, set: setBloodGlucose, icon: Activity, warn: false },
            ].map(({ label, placeholder, value, set, icon: Icon, warn }) => (
              <div key={label}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${warn ? 'text-red-500' : 'text-slate-400'}`} />
                  <input
                    type="number"
                    step="any"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={`w-full pl-8 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      warn ? 'border-red-400 bg-red-50' : 'border-slate-200'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Symptom Checklist */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSymptoms(!showSymptoms)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-bold text-slate-900">Symptoms Reported</span>
              {selectedSymptoms.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  {selectedSymptoms.length} selected
                </span>
              )}
            </div>
            {showSymptoms ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showSymptoms && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {SYMPTOM_OPTIONS.map((symptom) => {
                  const checked = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                        checked
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {checked && '✓ '}{symptom}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Notes */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Worker Observations &amp; Notes
          </label>
          <textarea
            rows={3}
            placeholder="Enter field observations, patient complaints, and clinical notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />
        </div>

        {/* Referral Trigger */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="triggerReferral"
              checked={triggerReferral}
              onChange={(e) => setTriggerReferral(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded"
            />
            <label htmlFor="triggerReferral" className="text-sm font-bold text-slate-900 cursor-pointer">
              Flag for Immediate Referral / Escalation
            </label>
          </div>
          {triggerReferral && (
            <textarea
              rows={2}
              placeholder="Reason for referral / escalation to CHC or DHH…"
              value={referralReason}
              onChange={(e) => setReferralReason(e.target.value)}
              className="w-full p-3 bg-red-50 border border-red-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
          )}
        </div>

        {/* Network Status Badge */}
        <div className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-semibold ${
          snapshot.networkStatus === 'online'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <span>{snapshot.networkStatus === 'online' ? '🟢 Online' : '🔴 Offline'}</span>
          <span>—</span>
          <span>
            {snapshot.networkStatus === 'online'
              ? 'Record will sync immediately to server.'
              : 'Record saved to local encrypted outbox. Will auto-sync when connectivity returns.'}
          </span>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            Save Encounter
          </button>
        </div>
      </form>
    </div>
  );
}
