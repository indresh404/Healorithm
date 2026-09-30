// App/src/pages/patient/PatientLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import PatientHeader from '../../components/common/PatientHeader';
import PwaInstallPrompt from '../../components/common/PwaInstallPrompt';
import LocalVaultLock from '../../components/lockbox/LocalVaultLock';
import { lockManager } from '../../crypto/lockManager';
import { store } from '../../lib/storage';

export default function PatientLayout() {
  const [snapshot] = useState(store.getSnapshot());
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    // Listen to lockManager events (auto-lock after inactivity)
    const unsub = lockManager.onLock(() => {
      setIsLocked(true);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-500 selection:text-white pb-8">
      {/* Top Swasthya-Style Header with Hamburger Slide-in Drawer */}
      <PatientHeader onLockVault={() => setIsLocked(true)} />

      {/* Main Content Area (Full screen width without bottom bar) */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* PIN & Biometric Local Vault Unlock Overlay (when locked) */}
      {isLocked && (
        <LocalVaultLock 
          onUnlocked={() => setIsLocked(false)}
          patientName={activeUser.name}
          patientId={activeUser.id === 'u-101' ? 'HLM-482731' : 'HLM-719302'}
        />
      )}

      {/* PWA Install Prompt Banner */}
      <PwaInstallPrompt />
    </div>
  );
}
