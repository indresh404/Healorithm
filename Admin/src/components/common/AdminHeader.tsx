// Admin/src/components/common/AdminHeader.tsx
import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  Stethoscope, 
  ShieldCheck, 
  Radio, 
  Wifi, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAdminAuth } from '../../auth/authStore';
import { store } from '../../lib/storage';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user, logout } = useAdminAuth();
  const [snapshot] = useState(store.getSnapshot());

  const emergencyCount = snapshot.referrals.filter(r => r.priority === 'Emergency').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Left: Mobile Menu Toggle & District Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
            District Hub: Kurnool North
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Connected to 5 Rural Sub-Centres
          </span>
        </div>
      </div>

      {/* Right: Live Sync Badge, Emergency Alerts & Doctor Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time Server Sync Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-Time Sync Active</span>
        </div>

        {/* Emergency Referrals Badge */}
        {emergencyCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-extrabold animate-pulse">
            <Bell className="w-3.5 h-3.5" />
            <span>{emergencyCount} Emergency Alert{emergencyCount > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Doctor User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || 'Dr. Arjun Verma'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Chief Medical Officer</p>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
