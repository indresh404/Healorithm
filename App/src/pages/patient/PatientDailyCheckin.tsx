// App/src/pages/patient/PatientDailyCheckin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Volume2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  PhoneCall, 
  Wind,
  Thermometer,
  Gauge,
  Sparkles
} from 'lucide-react';
import { store } from '../../lib/storage';
import { playVoicePrompt } from '@shared/translations';

export default function PatientDailyCheckin() {
  const navigate = useNavigate();
  const [snapshot] = useState(store.getSnapshot());
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const currentLang = snapshot.selectedLanguage;

  const [step, setStep] = useState<number>(1);
  const [generalFeeling, setGeneralFeeling] = useState<'great' | 'fine' | 'unwell' | 'critical'>('fine');
  
  // Vitals
  const [temp, setTemp] = useState<number | ''>(98.6);
  const [spo2, setSpo2] = useState<number | ''>(97);
  const [systolicBp, setSystolicBp] = useState<number | ''>(120);
  const [diastolicBp, setDiastolicBp] = useState<number | ''>(80);
  
  // Symptoms
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState<number>(1);

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const isEmergency = 
    (spo2 !== '' && Number(spo2) < 90) || 
    (systolicBp !== '' && Number(systolicBp) >= 180) || 
    selectedSymptoms.includes('Severe Chest Pain') || 
    selectedSymptoms.includes('Severe Breathlessness');

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleVoiceQuestion = (questionText: string) => {
    playVoicePrompt(questionText, currentLang);
  };

  const handleSubmitCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    
    store.addVitalsAndRecord({
      userId: activeUser.id,
      symptoms: selectedSymptoms,
      bodyZones: selectedSymptoms.length > 0 ? ['chest', 'head'] : [],
      vitals: {
        systolic_bp: systolicBp ? Number(systolicBp) : undefined,
        diastolic_bp: diastolicBp ? Number(diastolicBp) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
      },
      provisional_diagnosis: `Patient Self Check-in: Feeling ${generalFeeling}. Pain: ${painLevel}/10.`,
      workerId: 'patient-self-report'
    });

    setIsSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
              {currentLang === 'hi' ? 'दैनिक स्वास्थ्य जाँच' : 'Daily Health Check-in'}
            </h1>
            <p className="text-xs text-slate-500">
              {activeUser.name} • {currentLang === 'hi' ? `कदम ${step} / 2` : `Step ${step} of 2`}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleVoiceQuestion(
            currentLang === 'hi' 
              ? 'कृपया बताएं कि आज आप कैसा महसूस कर रहे हैं।' 
              : 'Please select how you are feeling and any symptoms today.'
          )}
          className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center gap-1.5 transition-colors border border-indigo-200"
          title="Audio Guidance"
        >
          <Volume2 className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold">{currentLang === 'hi' ? 'सुनो' : 'Listen'}</span>
        </button>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmitCheckin} className="space-y-6">
          {/* STEP 1: Big Emotion Cards & Pain Level */}
          {step === 1 && (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {currentLang === 'hi' ? '1. आज आप कैसा महसूस कर रहे हैं?' : '1. How are you feeling today?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentLang === 'hi' ? 'नीचे दिए गए विकल्पों में से एक चुनें' : 'Choose one option below'}
                </p>
              </div>

              {/* 4 Big Expressive Touch Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { 
                    id: 'great', 
                    label: currentLang === 'hi' ? 'सब ठीक है' : 'All Good / Healthy', 
                    emoji: '😊', 
                    sub: currentLang === 'hi' ? 'कोई तकलीफ नहीं' : 'No pain or discomfort' 
                  },
                  { 
                    id: 'fine', 
                    label: currentLang === 'hi' ? 'सामान्य / ठीक' : 'Normal / Fine', 
                    emoji: '😐', 
                    sub: currentLang === 'hi' ? 'रोज़ जैसा हाल' : 'Routine manageable day' 
                  },
                  { 
                    id: 'unwell', 
                    label: currentLang === 'hi' ? 'थोड़े बीमार' : 'Unwell / Mild Sick', 
                    emoji: '🤒', 
                    sub: currentLang === 'hi' ? 'हल्का बुखार या दर्द' : 'Fever, cough or body ache' 
                  },
                  { 
                    id: 'critical', 
                    label: currentLang === 'hi' ? 'ज्यादा तकलीफ' : 'Severe Discomfort', 
                    emoji: '🚨', 
                    sub: currentLang === 'hi' ? 'सांस फूलना या सीने में दर्द' : 'Severe pain / breathlessness' 
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGeneralFeeling(item.id as any)}
                    className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
                      generalFeeling === item.id
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-3xl block mb-2">{item.emoji}</span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{item.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>

              {/* Simple Pain Slider */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {currentLang === 'hi' ? `दर्द का स्तर: ${painLevel} / 10` : `Pain Level: ${painLevel} / 10`}
                  </span>
                  <span className="text-slate-500 font-medium">
                    {painLevel === 0 ? 'No Pain' : painLevel < 4 ? 'Mild Pain' : painLevel < 7 ? 'Moderate' : 'Severe Pain'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  <span>{currentLang === 'hi' ? 'अगला: लक्षण और जाँच' : 'Next: Check Symptoms'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Symptoms & Quick Vitals */}
          {step === 2 && (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {currentLang === 'hi' ? '2. क्या आपको इनमें से कोई तकलीफ है?' : '2. Are you experiencing any symptoms?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentLang === 'hi' ? 'जो भी तकलीफ है, उस पर उंगली से टैप करें' : 'Tap any symptom that applies'}
                </p>
              </div>

              {/* Symptom Touch Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-bold">
                {[
                  { id: 'बुखार / Fever', label: currentLang === 'hi' ? 'बुखार / सर्दी' : 'Fever / Chills' },
                  { id: 'खांसी / Cough', label: currentLang === 'hi' ? 'खांसी' : 'Dry Cough' },
                  { id: 'Severe Breathlessness', label: currentLang === 'hi' ? 'सांस लेने में तकलीफ' : 'Breathlessness', critical: true },
                  { id: 'Severe Chest Pain', label: currentLang === 'hi' ? 'सीने में दर्द' : 'Chest Pain', critical: true },
                  { id: 'सिरदर्द / Headache', label: currentLang === 'hi' ? 'सिरदर्द / चक्कर' : 'Headache / Dizziness' },
                  { id: 'उल्टी / Vomiting', label: currentLang === 'hi' ? 'उल्टी / दस्त' : 'Vomiting / Diarrhea' },
                  { id: 'जोड़ों का दर्द / Joint Pain', label: currentLang === 'hi' ? 'जोड़ों या बदन में दर्द' : 'Joint / Body Pain' },
                  { id: 'कमजोरी / Weakness', label: currentLang === 'hi' ? 'बहुत कमजोरी' : 'Weakness / Fatigue' },
                ].map((symptom) => {
                  const isSelected = selectedSymptoms.includes(symptom.id);

                  return (
                    <button
                      key={symptom.id}
                      type="button"
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all font-bold ${
                        isSelected
                          ? symptom.critical
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {symptom.label}
                    </button>
                  );
                })}
              </div>

              {/* Home Vitals (Optional) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  {currentLang === 'hi' ? 'घर पर नापा गया ऑक्सीजन या बीपी (यदि नापा हो):' : 'Home Vitals (If measured):'}
                </span>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <label className="text-slate-600">SpO2 Oxygen (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-base text-slate-900"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <label className="text-slate-600">Blood Pressure (BP)</label>
                    <input
                      type="number"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-base text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Banner */}
              {isEmergency && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-red-700">
                    <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
                    <span>{currentLang === 'hi' ? 'सावधानी: आपातकालीन लक्षण' : 'EMERGENCY DANGER SIGN DETECTED'}</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    {currentLang === 'hi'
                      ? 'कम ऑक्सीजन या सीने में दर्द की स्थिति में तुरंत 108 एम्बुलेंस बुलाएं या अपनी आशा दीदी से संपर्क करें।'
                      : 'Low SpO2 or severe chest pain requires immediate medical care. Please call 108 Emergency Ambulance or alert your ASHA worker.'}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{currentLang === 'hi' ? 'पीछे' : 'Back'}</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Save className="w-4 h-4" />
                  <span>{currentLang === 'hi' ? 'जाँच सुरक्षित करें' : 'Save Check-in'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      ) : (
        /* Confirmation Card */
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">
              {currentLang === 'hi' ? 'स्वास्थ्य जाँच दर्ज हो गई!' : 'Daily Check-in Recorded!'}
            </h2>
            <p className="text-xs text-slate-500">
              {currentLang === 'hi'
                ? 'आपकी स्वास्थ्य रिपोर्ट सुरक्षित दर्ज हो गई है और आशा दीदी से अपने आप सिंक हो जाएगी।'
                : 'Your check-in has been saved securely and will automatically sync with your ASHA worker.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/patient/diary')}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold transition-all"
            >
              {currentLang === 'hi' ? 'दवाइयाँ देखें' : 'View Medicines'}
            </button>
            <button
              onClick={() => navigate('/patient')}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
            >
              {currentLang === 'hi' ? 'कार्ड पर लौटें' : 'Return to Card'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
