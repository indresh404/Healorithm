import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { store } from '../../lib/storage';
import { 
  QrCode, 
  Pill, 
  Volume2, 
  Printer, 
  PhoneCall, 
  ShieldCheck, 
  ClipboardCheck, 
  Sparkles,
  Sun,
  CloudSun,
  Moon,
  ChevronRight,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { playVoicePrompt, TRANSLATIONS } from '@shared/translations';
import { calculateTotalPrescriptionSavings } from '@shared/janAushadhiCatalog';
import { encodeSingleQR } from '@shared/qrProtocol';

export default function PatientDashboard() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [profileQrUrl, setProfileQrUrl] = useState<string>('');

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const currentLang = snapshot.selectedLanguage;
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const prescriptions = snapshot.prescriptions.filter(p => p.user_id === activeUser.id);
  const savings = calculateTotalPrescriptionSavings(prescriptions);

  useEffect(() => {
    let isCancelled = false;
    const cardPayload = encodeSingleQR({
      protocolVersion: '2.0.0',
      patientId: activeUser.id === 'u-101' ? 'HLM-482731' : activeUser.id,
      fullName: activeUser.name,
      age: activeUser.age,
      gender: activeUser.gender,
      village: activeUser.village || 'Adoni Village',
      bloodGroup: activeUser.blood_group || 'B+',
      phoneNumber: activeUser.phone,
      vitals: {
        systolic_bp: 125,
        diastolic_bp: 82,
        spo2: 97,
        heart_rate: 78,
        blood_glucose: 110,
        temperature: 98.6
      },
      symptoms: ['Hypertension monitoring'],
      prescriptions: prescriptions.map(p => ({
        medicine_name: p.medicine_name,
        generic_name: p.generic_name || p.medicine_name,
        dosage: p.dosage,
        timing: p.timing
      })),
      adherenceLogs: [],
      consentTimestamp: new Date().toISOString(),
      digitalSignature: `SIG_${activeUser.id}`
    });

    QRCode.toDataURL(cardPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 380,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => {
      if (!isCancelled) setProfileQrUrl(url);
    }).catch(err => console.error('Dashboard QR error:', err));

    return () => {
      isCancelled = true;
    };
  }, [activeUser.id, activeUser.name, prescriptions.length]);

  const todayStr = new Date().toISOString().split('T')[0];
  const userDiary = snapshot.patientAdherenceLogs[activeUser.id] || [];
  const todayEntry = userDiary.find(e => e.date === todayStr);

  const handleToggleDose = (dose: 'morning' | 'afternoon' | 'night') => {
    store.toggleAdherenceDose(activeUser.id, todayStr, dose);
  };

  const handleAudioQR = () => {
    const text = currentLang === 'hi'
      ? `नमस्ते ${activeUser.name} जी। यह आपका डिजिटल स्वास्थ्य कार्ड है। डॉक्टर या आशा दीदी को यह क्यूआर कोड दिखाएं।`
      : currentLang === 'mr'
      ? `नमस्कार ${activeUser.name} जी. हे आपले डिजिटल आरोग्य कार्ड आहे. डॉक्टर किंवा आशा सेविकेला हा क्यूआर दाखवा.`
      : `Hello ${activeUser.name}. This is your digital health card. Show this QR code to your doctor or ASHA worker.`;
    playVoicePrompt(text, currentLang);
  };

  const handleAudioMedicines = () => {
    const text = currentLang === 'hi'
      ? `आज की दवाइयाँ: सुबह की गोली ${todayEntry?.morning_taken ? 'ली जा चुकी है' : 'बाकी है'}। दोपहर की गोली ${todayEntry?.afternoon_taken ? 'ली जा चुकी है' : 'बाकी है'}। रात की गोली ${todayEntry?.night_taken ? 'ली जा चुकी है' : 'बाकी है'}।`
      : `Today's medicines: Morning dose is ${todayEntry?.morning_taken ? 'taken' : 'pending'}. Afternoon dose is ${todayEntry?.afternoon_taken ? 'taken' : 'pending'}. Night dose is ${todayEntry?.night_taken ? 'taken' : 'pending'}.`;
    playVoicePrompt(text, currentLang);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-6">
      {/* 1. HERO DIGITAL HEALTH QR CARD (Crisp, High-Contrast & Clear) */}
      <section className="bg-white rounded-3xl border-2 border-blue-600/30 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Patient Details */}
          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-extrabold uppercase">
              <span>{currentLang === 'hi' ? 'डिजिटल स्वास्थ्य कार्ड' : 'Digital Health Card'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeUser.name}
            </h1>

            <p className="text-sm font-bold text-slate-700">
              {activeUser.age} {currentLang === 'hi' ? 'वर्ष' : 'Years'} • {activeUser.gender} • {currentLang === 'hi' ? 'ब्लड ग्रुप' : 'Blood'}: {activeUser.blood_group || 'B+'}
            </p>

            <p className="text-xs text-slate-500 font-mono">
              {currentLang === 'hi' ? 'गाँव' : 'Village'}: {activeUser.village || 'Adoni Village'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                onClick={handleAudioQR}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>{currentLang === 'hi' ? 'कार्ड की जानकारी सुनें' : 'Listen in Audio'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>{currentLang === 'hi' ? 'प्रिंट करें' : 'Print Card'}</span>
              </button>
            </div>
          </div>

          {/* Scannable Health QR Code */}
          <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl text-center shadow-md shrink-0 border border-slate-800">
            <div className="bg-white p-2.5 rounded-xl inline-block shadow-inner">
              {profileQrUrl ? (
                <img 
                  src={profileQrUrl} 
                  alt="Patient Health ID QR" 
                  className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg"
                />
              ) : (
                <div className="w-36 h-36 sm:w-44 sm:h-44 bg-white flex items-center justify-center">
                  <QrCode className="w-28 h-28 text-slate-950" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-300 font-bold mt-1.5">
              {currentLang === 'hi' ? 'आशा दीदी / डॉक्टर को दिखाएं' : 'Show to Doctor / ASHA'}
            </p>
          </div>
        </div>
      </section>

      {/* 2. TODAY'S MEDICINE DOSE TRACKER (Large, Simple Visual Touch Buttons) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {currentLang === 'hi' ? 'आज की दवाइयाँ (खुराक)' : 'Today\'s Medicine Tracker'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentLang === 'hi' ? 'दवाई लेने के बाद बटन दबाएं' : 'Tap button after taking your medicine'}
              </p>
            </div>
          </div>

          <button
            onClick={handleAudioMedicines}
            className="p-2 text-slate-500 hover:text-blue-600 rounded-xl"
            title="Listen"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Dose Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Morning Dose */}
          <button
            onClick={() => handleToggleDose('morning')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              todayEntry?.morning_taken
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Sun className="w-4 h-4" />
                </span>
                <span className="text-xs font-extrabold">
                  {currentLang === 'hi' ? 'सुबह की खुराक' : 'Morning Dose'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700">Telma 40 + Pan 40</p>
              <p className="text-[11px] text-slate-500">
                {currentLang === 'hi' ? 'नाश्ते के बाद' : 'After Breakfast'}
              </p>
            </div>

            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
              todayEntry?.morning_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {todayEntry?.morning_taken ? '✓' : ''}
            </div>
          </button>

          {/* Afternoon Dose */}
          <button
            onClick={() => handleToggleDose('afternoon')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              todayEntry?.afternoon_taken
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <CloudSun className="w-4 h-4" />
                </span>
                <span className="text-xs font-extrabold">
                  {currentLang === 'hi' ? 'दोपहर की खुराक' : 'Afternoon Dose'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700">Glycomet 500</p>
              <p className="text-[11px] text-slate-500">
                {currentLang === 'hi' ? 'खाने के साथ' : 'With Lunch'}
              </p>
            </div>

            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
              todayEntry?.afternoon_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {todayEntry?.afternoon_taken ? '✓' : ''}
            </div>
          </button>

          {/* Night Dose */}
          <button
            onClick={() => handleToggleDose('night')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              todayEntry?.night_taken
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Moon className="w-4 h-4" />
                </span>
                <span className="text-xs font-extrabold">
                  {currentLang === 'hi' ? 'रात की खुराक' : 'Night Dose'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700">Atorva 10</p>
              <p className="text-[11px] text-slate-500">
                {currentLang === 'hi' ? 'सोने से पहले' : 'Before Sleep'}
              </p>
            </div>

            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
              todayEntry?.night_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {todayEntry?.night_taken ? '✓' : ''}
            </div>
          </button>
        </div>
      </section>

      {/* 3. DAILY HEALTH CHECK-IN BANNER (CommCare Style) */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 sm:p-7 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-extrabold uppercase">
            <span>{currentLang === 'hi' ? 'दैनिक स्वास्थ्य जाँच' : 'Daily Health Check'}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold">
            {currentLang === 'hi' ? 'आज आप कैसा महसूस कर रहे हैं?' : 'How are you feeling today?'}
          </h2>
          <p className="text-xs text-blue-100 leading-relaxed max-w-lg">
            {currentLang === 'hi'
              ? 'अपना तापमान, ऑक्सीजन या कोई तकलीफ यहाँ दर्ज करें। कोई खतरा होने पर आशा दीदी को तुरंत सूचना जाएगी।'
              : 'Record your vitals, temperature, or any pain. Your ASHA worker will be alerted if danger signs appear.'}
          </p>
        </div>

        <Link
          to="/patient/checkin"
          className="px-6 py-3.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-transform active:scale-95 shrink-0"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>{currentLang === 'hi' ? 'जाँच शुरू करें' : 'Start Check-in'}</span>
        </Link>
      </section>

      {/* 4. JAN AUSHADHI GENERIC SAVINGS CARD */}
      <section className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-800 font-extrabold text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{currentLang === 'hi' ? 'जन औषधि दवाई बचत' : 'Jan Aushadhi Generic Savings'}</span>
          </div>
          <h3 className="text-xl font-extrabold text-emerald-950">
            {currentLang === 'hi' 
              ? `आपकी हर महीने ₹${savings.totalSavings} की बचत हो रही है!` 
              : `You save ₹${savings.totalSavings} every month on medicines!`}
          </h3>
          <p className="text-xs text-emerald-800">
            {currentLang === 'hi'
              ? 'डॉक्टर द्वारा स्वीकृत जन औषधि केंद्र से सस्ती और अच्छी दवाई।'
              : 'Doctor-approved high-quality generic medicines at nearest PMBJP Kendra.'}
          </p>
        </div>

        <Link
          to="/patient/savings"
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold transition-all shadow-xs shrink-0"
        >
          {currentLang === 'hi' ? 'बचत रसीद देखें' : 'View Savings Report'}
        </Link>
      </section>

      {/* 5. 2-COLUMN BIG BUTTONS: SYNC TO ASHA & EMERGENCY SOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/patient/zero-signal"
          className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl text-left flex items-center gap-4 shadow-xs transition-all"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">
              {currentLang === 'hi' ? 'आशा दीदी को डेटा भेजें' : 'Share Data with ASHA'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentLang === 'hi' ? 'बिना इंटरनेट क्यूआर द्वारा ट्रांसफर' : 'Zero-Internet Animated QR'}
            </p>
          </div>
        </Link>

        <Link
          to="/patient/sos"
          className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-3xl text-left flex items-center gap-4 shadow-md shadow-red-600/20 transition-all"
        >
          <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">
              {currentLang === 'hi' ? 'आपातकालीन 108 एम्बुलेंस' : 'Emergency 108 Ambulance'}
            </h4>
            <p className="text-xs text-red-100 mt-0.5">
              {currentLang === 'hi' ? 'तुरंत मदद और आशा को अलर्ट' : 'Immediate Help & ASHA Alert'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
