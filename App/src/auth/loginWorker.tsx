// App/src/auth/loginWorker.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { authStore } from './authStore';

export default function LoginWorker() {
  const navigate = useNavigate();
  const [workerId, setWorkerId] = useState('w1');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter a valid 4-digit security PIN.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const name = workerId === 'w1' ? 'Anitha K.' : workerId === 'w2' ? 'Lakshmi P.' : 'Field Worker';
      const village = workerId === 'w1' ? 'Alur' : workerId === 'w2' ? 'Adoni' : 'Rural Cluster';
      await authStore.loginWorker(workerId, pin, name, village);
      navigate('/worker');
    } catch (err) {
      setError('Failed to unlock encrypted vault. Please verify your PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (id: string, name: string, village: string) => {
    setWorkerId(id);
    setPin('1234');
    setIsLoading(true);
    await authStore.loginWorker(id, '1234', name, village);
    navigate('/worker');
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
          <div className="mx-auto w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-500/30">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Health Worker Authentication
          </h2>
          <p className="text-xs text-slate-400">
            Enter your ASHA Worker ID and PIN to unlock on-device encrypted database
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
                Worker ID / Registered Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  placeholder="e.g. w1 or 9876543210"
                  className="w-full pl-3.5 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                4-Digit Security PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-3.5 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Unlocking Vault...' : 'Unlock & Sign In'}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-700/60 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Demo Field Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('w1', 'Anitha K.', 'Alur')}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-left transition-colors"
              >
                <div className="text-white">Anitha K.</div>
                <div className="text-[10px] text-slate-400 font-normal">Alur Village</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('w2', 'Lakshmi P.', 'Adoni')}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-left transition-colors"
              >
                <div className="text-white">Lakshmi P.</div>
                <div className="text-[10px] text-slate-400 font-normal">Adoni Village</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>New health worker?</span>
            <Link to="/worker/register" className="font-bold text-emerald-400 hover:underline">
              Register Worker ID
            </Link>
          </div>
        </div>

        {/* Encryption badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>PIN derives PBKDF2 + AES-GCM 256-bit encryption key on-device</span>
        </div>
      </div>
    </div>
  );
}
