// App/src/auth/loginPatient.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  QrCode, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { authStore } from './authStore';

export default function LoginPatient() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('9823411021');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const name = mobile.includes('21') ? 'Ramesh Kumar' : 'Sunita Devi';
      const patientId = mobile.includes('21') ? 'u-101' : 'u-102';
      await authStore.loginPatient(mobile, pin || '1234', name, patientId);
      navigate('/patient');
    } catch (err) {
      setError('Failed to authenticate patient card.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (id: string, name: string, phoneNum: string) => {
    setMobile(phoneNum);
    setPin('1234');
    setIsLoading(true);
    await authStore.loginPatient(phoneNum, '1234', name, id);
    navigate('/patient');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portals</span>
        </Link>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shadow-lg border border-blue-500/30">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Patient Health Card Login
          </h2>
          <p className="text-xs text-slate-400">
            Access your encrypted digital QR card, daily prescriptions and generic savings
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Registered Mobile Number / ABHA ID
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9823411021"
                  className="w-full pl-3.5 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                4-Digit Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-3.5 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>{isLoading ? 'Accessing Card...' : 'View Health Card'}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-700/60 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Demo Patient Profiles:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('u-101', 'Ramesh Kumar', '9823411021')}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700 hover:border-blue-500/50 rounded-xl text-xs font-bold text-left transition-colors"
              >
                <div className="text-white">Ramesh Kumar</div>
                <div className="text-[10px] text-slate-400 font-normal">Adoni Village</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('u-102', 'Sunita Devi', '9823411023')}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700 hover:border-blue-500/50 rounded-xl text-xs font-bold text-left transition-colors"
              >
                <div className="text-white">Sunita Devi</div>
                <div className="text-[10px] text-slate-400 font-normal">Alur Village</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>New patient in village?</span>
            <Link to="/patient/register" className="font-bold text-blue-400 hover:underline">
              Register Health Card
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Patient data stored locally on your device with DPDP consent safeguards</span>
        </div>
      </div>
    </div>
  );
}
