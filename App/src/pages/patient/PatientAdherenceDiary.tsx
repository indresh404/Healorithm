// App/src/pages/patient/PatientAdherenceDiary.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../lib/storage';
import { 
  Pill, 
  Flame, 
  Sun, 
  CloudSun, 
  Moon, 
  Volume2, 
  ClipboardCheck, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { findJanAushadhiMatch } from '@shared/janAushadhiCatalog';
import { playVoicePrompt } from '@shared/translations';

export default function PatientAdherenceDiary() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const currentLang = snapshot.selectedLanguage;
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const diary = snapshot.patientAdherenceLogs[activeUser.id] || [];
  const prescriptions = snapshot.prescriptions.filter(p => p.user_id === activeUser.id);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = diary.find(e => e.date === todayStr);

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const handleToggleDose = (dose: 'morning' | 'afternoon' | 'night') => {
    store.toggleAdherenceDose(activeUser.id, todayStr, dose);
  };

  const handleAudioMedicines = () => {
    const text = currentLang === 'hi'
      ? `दवाई की खुराक: सुबह की गोली ${todayEntry?.morning_taken ? 'ली जा चुकी है' : 'बाकी है'}। दोपहर की गोली ${todayEntry?.afternoon_taken ? 'ली जा चुकी है' : 'बाकी है'}। रात की गोली ${todayEntry?.night_taken ? 'ली जा चुकी है' : 'बाकी है'}।`
      : `Medicine doses: Morning dose is ${todayEntry?.morning_taken ? 'taken' : 'pending'}. Afternoon dose is ${todayEntry?.afternoon_taken ? 'taken' : 'pending'}. Night dose is ${todayEntry?.night_taken ? 'taken' : 'pending'}.`;
    playVoicePrompt(text, currentLang);
  };

  const streakDays = diary.filter(d => d.morning_taken && d.afternoon_taken && d.night_taken).length || 5;

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {currentLang === 'hi' ? 'दैनिक दवाई ट्रैकर' : 'Daily Medicine Tracker'}
            </h1>
            <p className="text-xs text-slate-500">
              {currentLang === 'hi' ? 'दवाई लेने के बाद बटन दबाएं' : 'Tap each button after taking your medicine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-2 rounded-2xl border border-amber-200 shrink-0">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />
            <div>
              <span className="text-xs font-extrabold text-amber-900 block leading-tight">
                {streakDays} {currentLang === 'hi' ? 'दिन से नियम से ली!' : 'Days Perfect Streak!'}
              </span>
            </div>
          </div>

          <button
            onClick={handleAudioMedicines}
            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl border border-blue-200 transition-colors"
            title="Audio Guide"
          >
            <Volume2 className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* TODAY'S 3 DOSE CARDS */}
      <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          {currentLang === 'hi' ? 'आज की खुराक (3 समय)' : 'Today\'s 3 Scheduled Doses'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Morning Dose */}
          <button
            onClick={() => handleToggleDose('morning')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[140px] ${
              todayEntry?.morning_taken 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Sun className="w-5 h-5" />
                </span>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                  todayEntry?.morning_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {todayEntry?.morning_taken ? '✓' : ''}
                </span>
              </div>
              <h3 className="text-sm font-extrabold">
                {currentLang === 'hi' ? 'सुबह की गोली' : 'Morning Dose'}
              </h3>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Telma 40 + Pan 40</p>
              <p className="text-[11px] text-slate-500">{currentLang === 'hi' ? 'नाश्ते के बाद' : 'After Breakfast'}</p>
            </div>

            <div className={`text-xs font-extrabold mt-3 ${todayEntry?.morning_taken ? 'text-emerald-700' : 'text-blue-600'}`}>
              {todayEntry?.morning_taken ? (currentLang === 'hi' ? '✓ ली जा चुकी है' : '✓ Completed') : (currentLang === 'hi' ? '👉 लेने के लिए दबाएं' : '👉 Tap to mark taken')}
            </div>
          </button>

          {/* Afternoon Dose */}
          <button
            onClick={() => handleToggleDose('afternoon')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[140px] ${
              todayEntry?.afternoon_taken 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <CloudSun className="w-5 h-5" />
                </span>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                  todayEntry?.afternoon_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {todayEntry?.afternoon_taken ? '✓' : ''}
                </span>
              </div>
              <h3 className="text-sm font-extrabold">
                {currentLang === 'hi' ? 'दोपहर की गोली' : 'Noon Dose'}
              </h3>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Glycomet 500</p>
              <p className="text-[11px] text-slate-500">{currentLang === 'hi' ? 'दोपहर के भोजन के साथ' : 'With Lunch'}</p>
            </div>

            <div className={`text-xs font-extrabold mt-3 ${todayEntry?.afternoon_taken ? 'text-emerald-700' : 'text-blue-600'}`}>
              {todayEntry?.afternoon_taken ? (currentLang === 'hi' ? '✓ ली जा चुकी है' : '✓ Completed') : (currentLang === 'hi' ? '👉 लेने के लिए दबाएं' : '👉 Tap to mark taken')}
            </div>
          </button>

          {/* Night Dose */}
          <button
            onClick={() => handleToggleDose('night')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[140px] ${
              todayEntry?.night_taken 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                  <Moon className="w-5 h-5" />
                </span>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                  todayEntry?.night_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {todayEntry?.night_taken ? '✓' : ''}
                </span>
              </div>
              <h3 className="text-sm font-extrabold">
                {currentLang === 'hi' ? 'रात की गोली' : 'Night Dose'}
              </h3>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Atorva 10</p>
              <p className="text-[11px] text-slate-500">{currentLang === 'hi' ? 'सोने से पहले' : 'Before Sleep'}</p>
            </div>

            <div className={`text-xs font-extrabold mt-3 ${todayEntry?.night_taken ? 'text-emerald-700' : 'text-amber-600'}`}>
              {todayEntry?.night_taken ? (currentLang === 'hi' ? '✓ ली जा चुकी है' : '✓ Completed') : (currentLang === 'hi' ? '⏰ आज रात लेनी है' : '⏰ Due tonight')}
            </div>
          </button>
        </div>
      </section>

      {/* Doctor Prescriptions with Jan Aushadhi Savings */}
      <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900">
            {currentLang === 'hi' ? 'आपकी दवाइयाँ और जन औषधि विकल्प' : 'Your Prescriptions & Jan Aushadhi Equivalent'}
          </h2>
          <Link to="/patient/savings" className="text-xs font-bold text-emerald-700 hover:underline">
            {currentLang === 'hi' ? 'बचत देखें →' : 'Savings Report →'}
          </Link>
        </div>

        <div className="space-y-3">
          {prescriptions.map((rx) => {
            const match = findJanAushadhiMatch(rx.medicine_name);
            return (
              <div key={rx.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{rx.medicine_name}</h3>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      {currentLang === 'hi' ? 'जन औषधि नाम' : 'Generic'}: {rx.generic_name || match?.generic_name || rx.medicine_name}
                    </p>
                    <p className="text-[10px] text-slate-500">खुराक: {rx.dosage}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 line-through block">
                    ₹{rx.brand_price || match?.brand_price || 120}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    ₹{rx.generic_price || match?.generic_price || 20}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Link to Health Check-in */}
      <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-extrabold">
            {currentLang === 'hi' ? 'आज की स्वास्थ्य जाँच भी पूरी करें' : 'Complete Today\'s Health Check-in'}
          </h3>
          <p className="text-xs text-blue-100">
            {currentLang === 'hi' ? 'तापमान, बीपी या कोई तकलीफ दर्ज करें' : 'Record your vitals, pain level or symptoms'}
          </p>
        </div>

        <Link
          to="/patient/checkin"
          className="px-4 py-2.5 bg-white text-blue-700 rounded-xl text-xs font-extrabold transition-all shadow-xs shrink-0"
        >
          {currentLang === 'hi' ? 'जाँच करें' : 'Check-in Now'}
        </Link>
      </div>
    </div>
  );
}
