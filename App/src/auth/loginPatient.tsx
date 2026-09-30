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
  KeyRound
} from 'lucide-react';
import { authStore } from './authStore';

export default function LoginPatient() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const patientId = mobile.endsWith('23') ? 'u-102' : 'u-101';
      const name = mobile.endsWith('23') ? 'Sunita Devi' : 'Ramesh Kumar';
      await authStore.loginPatient(mobile, pin, name, patientId);
      navigate('/patient');
    } catch (err) {
      setError('Invalid phone number or passcode.');
    } finally {
      setIsLoading(false);
    }
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
            Enter your registered mobile number and 4-digit passcode to access your offline health records
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
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Open Health Card'}</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
            <span>New patient in village?</span>
            <Link to="/patient/register" className="font-bold text-blue-400 hover:underline">
              Register Health Card
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Patient data stored locally on your device with authenticated encryption</span>
        </div>
      </div>
    </div>
  );
}
