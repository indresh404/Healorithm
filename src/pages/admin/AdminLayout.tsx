// src/pages/admin/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Header from '../../components/common/Header';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Mobile subheader with menu button */}
          <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-xs font-bold"
            >
              <Menu className="w-5 h-5" />
              <span>Admin Menu</span>
            </button>
            <span className="text-xs font-bold text-slate-700">District Admin Portal</span>
          </div>

          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
