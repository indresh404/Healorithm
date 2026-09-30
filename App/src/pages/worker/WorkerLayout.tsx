// App/src/pages/worker/WorkerLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkerHeader from '../../components/common/WorkerHeader';
import PwaInstallPrompt from '../../components/common/PwaInstallPrompt';

export default function WorkerLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 pb-8">
      {/* Top Swasthya-Style Header with Hamburger Slide-in Drawer */}
      <WorkerHeader />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* PWA Install Prompt */}
      <PwaInstallPrompt />
    </div>
  );
}
