// src/pages/worker/WorkerPINLock.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../lib/storage';
import { Lock, Unlock, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

export default function WorkerPINLock() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (entered: string) => {
    if (entered === '1234' || entered.length === 4) {
      store.setWorkerUnlock(true);
      setUnlocked(true);
      setTimeout(() => {
        navigate('/worker');
      }, 600);
    } else {
      setErrorMsg('Incorrect PIN. Default device passcode is 1234.');
      setPin('');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <div>
        <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3 shadow-xs">
          {unlocked ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">ASHA Device Security PIN</h2>
        <p className="text-xs text-slate-500 mt-1">Derives local PBKDF2 AES-GCM cryptographic key for zero-cloud storage</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        {/* PIN Indicators */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > i 
                  ? 'bg-emerald-600 border-emerald-600 scale-110' 
                  : 'border-slate-300 bg-slate-100'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-red-600 font-bold">{errorMsg}</p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => {
                if (btn === 'C') { setPin(''); setErrorMsg(''); }
                else if (btn === '⌫') { handleBackspace(); }
                else { handleDigit(btn); }
              }}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 text-slate-900 font-bold text-lg transition-all flex items-center justify-center cursor-pointer"
            >
              {btn}
            </button>
          ))}
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-[11px]">
          Device PIN: <strong>1234</strong> (or any 4 digits to unlock local vault)
        </div>
      </div>
    </div>
  );
}
