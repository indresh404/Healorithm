// Admin/src/pages/AdminSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Map as MapIcon, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  UserCheck, 
  Bot, 
  GitMerge, 
  PhoneCall, 
  Pill, 
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', end: true },
  { icon: MapIcon, label: 'Health Map', path: '/map' },
  { icon: AlertTriangle, label: 'Outbreak Clusters', path: '/outbreaks' },
  { icon: TrendingUp, label: 'Syndromic Trends', path: '/trends' },
  { icon: PhoneCall, label: 'Referral Queue', path: '/referrals' },
  { icon: Pill, label: 'Jan Aushadhi Review', path: '/prescriptions' },
  { icon: Package, label: 'Pharmacy & Stock', path: '/resources' },
  { icon: UserCheck, label: 'ASHA Workforce', path: '/workers' },
  { icon: Users, label: 'Patient Registry', path: '/users' },
  { icon: Bot, label: 'Care Agent Console', path: '/agent' },
  { icon: GitMerge, label: 'Conflict Resolution', path: '/conflicts' },
];

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Fixed Sidebar Aside (Permanently fixed on the left on desktop, animated slide-over on mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header & Navigation Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
                  Healorithm
                </h1>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Doctor & District Admin
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links with custom scrollbar */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-thin">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}
                `}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer District Summary Card */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">District</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="font-bold text-white mt-0.5">Kurnool North</p>
            <p className="text-[11px] text-slate-400 mt-0.5">5 Villages • 4 Active ASHAs</p>
          </div>
        </div>
      </aside>
    </>
  );
}
