import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Map as MapIcon, AlertTriangle, TrendingUp, Package, UserCheck, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MapIcon, label: 'Health Map', path: '/map' },
  { icon: AlertTriangle, label: 'Outbreaks', path: '/outbreaks' },
  { icon: TrendingUp, label: 'Trends', path: '/trends' },
  { icon: Package, label: 'Resources', path: '/resources' },
  { icon: UserCheck, label: 'Workers', path: '/workers' },
  { icon: Users, label: 'Patients', path: '/users' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-[110] w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Healorithm</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">District Admin</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
              isActive 
                ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              "group-hover:text-blue-600"
            )} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">District</p>
          <p className="text-sm font-bold text-slate-900">Kurnool North</p>
        </div>
      </div>
    </aside>
  );
}
