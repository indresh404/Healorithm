// App/src/components/common/PwaUpdatePrompt.tsx
import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, X, ShieldCheck, DownloadCloud } from 'lucide-react';

export default function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodically check for service worker updates every 60 minutes when connected
        setInterval(() => {
          if (navigator.onLine) {
            r.update().catch(err => console.debug('SW periodic check error:', err));
          }
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // Automatically dismiss offlineReady notification after 5 seconds
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => setOfflineReady(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans">
      {needRefresh ? (
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-slate-700/80 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  New Healorithm Version Available
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update now to apply the latest clinical guidelines and features.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNeedRefresh(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Dismiss for now"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Encrypted offline patient records & IndexedDB are safely preserved.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Now</span>
            </button>
          </div>
        </div>
      ) : offlineReady ? (
        <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl shadow-xl border border-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <DownloadCloud className="w-4 h-4 text-emerald-400" />
            <span>Healorithm is ready to work offline!</span>
          </div>
          <button
            onClick={() => setOfflineReady(false)}
            className="text-emerald-400 hover:text-emerald-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
