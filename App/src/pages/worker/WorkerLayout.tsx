// App/src/pages/worker/WorkerLayout.tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import WorkerHeader from '../../components/common/WorkerHeader';
import PwaInstallPrompt from '../../components/common/PwaInstallPrompt';
import { 
  Users, 
  QrCode, 
  UserPlus, 
  Activity, 
  Radio, 
  PhoneCall,
  RefreshCw
} from 'lucide-react';

export default function WorkerLayout() {
  const navItems = [
    { to: '/worker', label: 'Visit Queue', icon: Users, end: true },
    { to: '/worker/vitals', label: 'Record Vitals', icon: Activity },
    { to: '/worker/scan', label: 'Scan QR', icon: QrCode },
    { to: '/worker/new', label: 'New Patient', icon: UserPlus },
    { to: '/worker/zero-signal', label: 'Zero-Signal', icon: Radio },
    { to: '/worker/directory', label: 'Directory', icon: PhoneCall },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 sm:pb-8">
      {/* Top Header */}
      <WorkerHeader />

      {/* Desktop Horizontal Navigation Bar */}
      <div className="hidden sm:block bg-white border-b border-slate-200 sticky top-[73px] z-[80] shadow-xs">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 font-medium hover:text-slate-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* PWA Install Prompt */}
      <PwaInstallPrompt />
    </div>
  );
}
