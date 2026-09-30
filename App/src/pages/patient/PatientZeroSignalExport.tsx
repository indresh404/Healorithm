// App/src/pages/patient/PatientZeroSignalExport.tsx
import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { store } from '../../lib/storage';
import { 
  PatientExportPackage, 
  encodeSingleQR, 
  encodeToQRSequence, 
  QRChunkPacket 
} from '@shared/qrProtocol';
import { 
  Radio, 
  QrCode, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Layers, 
  Volume2
} from 'lucide-react';
import { playVoicePrompt } from '@shared/translations';

export default function PatientZeroSignalExport() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const analytics = snapshot.analytics.find(a => a.user_id === activeUser?.id);
  const userDiary = activeUser ? (snapshot.patientAdherenceLogs[activeUser.id] || []) : [];
  const prescriptions = activeUser ? snapshot.prescriptions.filter(p => p.user_id === activeUser.id) : [];
  const currentLang = snapshot.selectedLanguage;

  const [mode, setMode] = useState<'single' | 'sequence'>('single');
  const [singleQrDataUrl, setSingleQrDataUrl] = useState<string>('');
  const [packets, setPackets] = useState<QRChunkPacket[]>([]);
  const [packetQrUrls, setPacketQrUrls] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState<number>(300);
  const [copied, setCopied] = useState(false);

  // Construct patientPackage in useMemo with primitive dependencies
  const patientPackage = useMemo<PatientExportPackage>(() => {
    return {
      protocolVersion: '2.0.0',
      patientId: activeUser?.id === 'u-101' ? 'HLM-482731' : (activeUser?.id || 'HLM-719302'),
      fullName: activeUser?.name || 'Patient',
      age: activeUser?.age || 35,
      gender: activeUser?.gender || 'Other',
      village: activeUser?.village || 'Adoni Village',
      bloodGroup: activeUser?.blood_group || 'B+',
      phoneNumber: activeUser?.phone || '9823411021',
      vitals: {
        systolic_bp: analytics?.systolic_bp || 125,
        diastolic_bp: analytics?.diastolic_bp || 82,
        spo2: analytics?.spo2 || 97,
        heart_rate: analytics?.heart_rate || 78,
        blood_glucose: analytics?.blood_glucose || 110,
        temperature: 98.6
      },
      symptoms: analytics?.risks || ['Hypertension monitoring'],
      prescriptions: prescriptions.map(p => ({
        medicine_name: p.medicine_name,
        generic_name: p.generic_name || p.medicine_name,
        dosage: p.dosage,
        timing: p.timing
      })),
      adherenceLogs: userDiary.slice(0, 7).map(d => ({
        date: d.date,
        morning_taken: d.morning_taken,
        afternoon_taken: d.afternoon_taken,
        night_taken: d.night_taken
      })),
      consentTimestamp: new Date().toISOString(),
      digitalSignature: `SIG_${activeUser?.id || 'anon'}`
    };
  }, [
    activeUser?.id, 
    activeUser?.name, 
    activeUser?.age, 
    activeUser?.gender, 
    activeUser?.village, 
    activeUser?.blood_group, 
    activeUser?.phone, 
    analytics?.systolic_bp, 
    analytics?.diastolic_bp, 
    analytics?.spo2, 
    analytics?.heart_rate, 
    analytics?.blood_glucose, 
    prescriptions.length, 
    userDiary.length
  ]);

  // Generate Single QR and Sequential QR frames safely without infinite loops
  useEffect(() => {
    let isCancelled = false;

    // 1. Single QR Code Data URL
    const singlePayload = encodeSingleQR(patientPackage);
    QRCode.toDataURL(singlePayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 260,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => {
      if (!isCancelled) {
        setSingleQrDataUrl(url);
      }
    }).catch(err => {
      console.error('Single QR generation error:', err);
    });

    // 2. Generate Multi-Frame Sequential Packets & QR Images
    const seqPackets = encodeToQRSequence(patientPackage, 140);
    if (!isCancelled) {
      setPackets(seqPackets);
      setCurrentIdx(0);
    }

    Promise.all(
      seqPackets.map(p => 
        QRCode.toDataURL(JSON.stringify(p), {
          errorCorrectionLevel: 'L',
          margin: 2,
          width: 260,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        })
      )
    ).then(urls => {
      if (!isCancelled) {
        setPacketQrUrls(urls);
      }
    }).catch(err => {
      console.error('Sequence QR generation error:', err);
    });

    return () => {
      isCancelled = true;
    };
  }, [patientPackage]);

  // Frame Animation Loop for Sequence Mode
  useEffect(() => {
    if (!isPlaying || packetQrUrls.length === 0 || mode !== 'sequence') return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % packetQrUrls.length);
    }, speedMs);
    return () => clearInterval(interval);
  }, [isPlaying, packetQrUrls.length, mode, speedMs]);

  const handleCopyPayload = () => {
    const text = encodeSingleQR(patientPackage);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioPrompt = () => {
    const text = currentLang === 'hi'
      ? `यह स्क्रीन आशा दीदी के फोन या कैमरे के सामने रखें। बिना इंटरनेट आपका पूरा स्वास्थ्य रिकॉर्ड उनके पास ट्रांसफर हो जाएगा।`
      : `Hold this screen in front of the health worker's camera. Your complete health records will transfer securely without internet.`;
    playVoicePrompt(text, currentLang);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans text-center">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-extrabold uppercase">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{currentLang === 'hi' ? 'जीरो-सिग्नल ट्रांसफर' : 'Zero-Signal QR Transfer'}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          {currentLang === 'hi' ? 'आशा दीदी को स्वास्थ्य डेटा भेजें' : 'Share Health Records with ASHA'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {currentLang === 'hi'
            ? 'बिना इंटरनेट अपने फोन से स्वास्थ्य कार्यकर्ता के टैबलेट पर रिकॉर्ड ट्रांसफर करें'
            : 'Transfers encrypted patient diary, vitals & prescriptions directly camera-to-camera'}
        </p>
      </div>

      {/* Mode Selector (Single Full QR vs Animated Sequence) */}
      <div className="flex bg-slate-200 p-1 rounded-2xl max-w-xs mx-auto text-xs font-bold">
        <button
          onClick={() => setMode('single')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>{currentLang === 'hi' ? 'पूर्ण क्यूआर कार्ड' : 'Single QR Card'}</span>
        </button>

        <button
          onClick={() => setMode('sequence')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mode === 'sequence' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{currentLang === 'hi' ? 'एनिमेटेड सीक्वेंस' : 'Multi-Frame Loop'}</span>
        </button>
      </div>

      {/* QR Transmitter Card */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5 flex flex-col items-center">
        {/* Frame / Status Indicator */}
        <div className="flex items-center justify-between w-full max-w-xs text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-slate-200">
              {mode === 'single' ? 'Ready to Scan' : `Frame ${packets.length > 0 ? currentIdx + 1 : 0} of ${packets.length}`}
            </span>
          </div>

          <button
            onClick={handleAudioPrompt}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg cursor-pointer"
            title="Audio Guide"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Real Rendered QR Code Canvas Image (Compact & High-Contrast) */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl inline-block shadow-lg border border-slate-100">
          {mode === 'single' ? (
            singleQrDataUrl ? (
              <img 
                src={singleQrDataUrl} 
                alt="Patient Complete Health Card QR" 
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
              />
            ) : (
              <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
            )
          ) : (
            packetQrUrls.length > 0 ? (
              <img 
                src={packetQrUrls[currentIdx % packetQrUrls.length]} 
                alt={`QR Frame ${currentIdx + 1}`} 
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl transition-all"
              />
            ) : (
              <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
            )
          )}
        </div>

        {/* Sequence Controls */}
        {mode === 'sequence' && (
          <div className="w-full max-w-xs space-y-3">
            {/* Progress Bar */}
            <div className="bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-blue-500 h-full transition-all duration-150"
                style={{ width: `${packets.length > 0 ? Math.round(((currentIdx + 1) / packets.length) * 100) : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => {
                  const speeds = [200, 300, 450, 600];
                  const nextIdx = (speeds.indexOf(speedMs) + 1) % speeds.length;
                  setSpeedMs(speeds[nextIdx]);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono border border-slate-700 cursor-pointer flex items-center gap-1"
                title="Click to toggle burst transfer speed"
              >
                <span>⚡ {speedMs}ms</span>
                <span className="text-[10px] text-blue-400 font-bold">
                  {speedMs === 200 ? '(Turbo)' : speedMs === 300 ? '(Fast)' : speedMs === 450 ? '(Normal)' : '(Steady)'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Patient Summary Footer */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 w-full max-w-xs text-left text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>{activeUser?.name || 'Patient'}</span>
            <span className="text-emerald-400 font-mono">
              {activeUser?.id === 'u-101' ? 'HLM-482731' : (activeUser?.id || 'HLM-719302')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Includes: Vitals (SpO2 {analytics?.spo2 || 97}%, BP {analytics?.systolic_bp || 125}/{analytics?.diastolic_bp || 82}) • {prescriptions.length} Prescriptions • 7-Day Adherence Log
          </p>
        </div>

        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          {currentLang === 'hi' 
            ? 'इस स्क्रीन को स्वास्थ्य कार्यकर्ता के फोन कैमरे के सामने 3-5 सेकंड स्थिर रखें।' 
            : 'Hold screen toward the health worker\'s tablet until scan completes.'}
        </p>
      </div>

      {/* Manual Payload Copy Option */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleCopyPayload}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors shadow-xs cursor-pointer"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw Card Payload'}</span>
        </button>
      </div>
    </div>
  );
}
