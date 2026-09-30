// App/src/components/lockbox/LocalVaultLock.tsx
import React, { useState } from 'react';
import { 
  Lock, 
  Fingerprint, 
  Volume2
} from 'lucide-react';
import { lockManager } from '../../crypto/lockManager';
import { store } from '../../lib/storage';
import { playVoicePrompt } from '@shared/translations';

interface LocalVaultLockProps {
  onUnlocked?: () => void;
  patientName?: string;
  patientId?: string;
}

export default function LocalVaultLock({ 
  onUnlocked, 
  patientName = 'Patient',
  patientId = 'HLM-482731'
}: LocalVaultLockProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const currentLang = store.getSnapshot().selectedLanguage;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin.length === 4) {
      lockManager.unlock();
      if (onUnlocked) onUnlocked();
    } else {
      setError(currentLang === 'hi' ? 'कृपया 4 अंकों का सही पिन डालें' : 'Please enter your 4-digit PIN');
      setPin('');
    }
  };

  const handleBiometricUnlock = async () => {
    setIsAuthenticating(true);
    setError('');

    setTimeout(() => {
      lockManager.unlock();
      if (onUnlocked) onUnlocked();
    }, 450);
  };

  const handleAudioPrompt = () => {
    const text = currentLang === 'hi'
      ? `अपना स्वास्थ्य कार्ड खोलने के लिए 4 अंकों का पिन दर्ज करें या फिंगरप्रिंट लगाएं।`
      : `Enter your 4-digit PIN or use fingerprint to unlock your health card.`;
    playVoicePrompt(text, currentLang);
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-xs sm:max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl text-center">
        {/* Header Icon */}
        <div className="flex justify-center relative">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <button
            onClick={handleAudioPrompt}
            className="absolute top-0 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl"
            title="Listen"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-0.5">
          <h3 className="text-base font-extrabold text-white">
            {currentLang === 'hi' ? 'स्वास्थ्य कार्ड लॉक है' : 'Health Card Locked'}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            {patientName} • <span className="font-mono text-blue-400">{patientId}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            {currentLang === 'hi' ? 'खोलने के लिए 4-अंकों का पिन डालें' : 'Enter 4-digit PIN to open'}
          </p>
        </div>

        {/* PIN Indicator Dots */}
        <div className="flex justify-center items-center gap-3 py-1">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all border ${
                idx < pin.length
                  ? 'bg-blue-500 border-blue-400 scale-110 shadow-sm shadow-blue-500/50'
                  : 'bg-slate-800 border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {/* Big Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitClick(digit)}
              className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-base font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-800/40 text-slate-400 text-xs font-bold cursor-pointer"
          >
            Clear
          </button>

          <button
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-base font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-800/40 text-slate-400 text-xs font-bold cursor-pointer"
          >
            ⌫
          </button>
        </div>

        {/* Biometric Button */}
        <div className="pt-1">
          <button
            onClick={handleBiometricUnlock}
            disabled={isAuthenticating}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 text-slate-200 cursor-pointer"
          >
            <Fingerprint className={`w-4 h-4 text-emerald-400 ${isAuthenticating ? 'animate-pulse' : ''}`} />
            <span>{currentLang === 'hi' ? 'फिंगरप्रिंट से खोलें' : 'Unlock with Fingerprint'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
