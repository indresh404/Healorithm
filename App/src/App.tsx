// App/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Portal Selector Landing
import WelcomePage from './pages/WelcomePage';

// Auth Components
import LoginWorker from './auth/loginWorker';
import RegisterWorker from './auth/registerWorker';
import LoginPatient from './auth/loginPatient';
import RegisterPatient from './auth/registerPatient';
import RoleGuard from './auth/roleGuard';

// Health Worker Pages
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerScanner from './pages/worker/WorkerScanner';
import WorkerNewPatient from './pages/worker/WorkerNewPatient';
import WorkerVitalsEntry from './pages/worker/WorkerVitalsEntry';
import WorkerZeroSignalHandoff from './pages/worker/WorkerZeroSignalHandoff';
import WorkerDirectory from './pages/worker/WorkerDirectory';
import WorkerPINLock from './pages/worker/WorkerPINLock';
import WorkerSyncCenter from './pages/worker/WorkerSyncCenter';
import WorkerPatientProfile from './pages/worker/WorkerPatientProfile';

// Patient Pages
import PatientLayout from './pages/patient/PatientLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAdherenceDiary from './pages/patient/PatientAdherenceDiary';
import PatientDailyCheckin from './pages/patient/PatientDailyCheckin';
import PatientLockboxPage from './pages/patient/PatientLockboxPage';
import PatientJanAushadhiReport from './pages/patient/PatientJanAushadhiReport';
import PatientZeroSignalExport from './pages/patient/PatientZeroSignalExport';
import PatientConsentManager from './pages/patient/PatientConsentManager';
import PatientSOS from './pages/patient/PatientSOS';

// About Page
import AboutPage from './pages/AboutPage';

// PWA Update Prompt
import PwaUpdatePrompt from './components/common/PwaUpdatePrompt';

export default function AppPWA() {
  return (
    <>
      <PwaUpdatePrompt />
      <Routes>
      {/* Landing Portal Selector */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<WelcomePage />} />

      {/* Worker Auth */}
      <Route path="/worker/login" element={<LoginWorker />} />
      <Route path="/worker/register" element={<RegisterWorker />} />

      {/* Patient Auth */}
      <Route path="/patient/login" element={<LoginPatient />} />
      <Route path="/patient/register" element={<RegisterPatient />} />

      {/* Health Worker Portal (Protected) */}
      <Route 
        path="/worker" 
        element={
          <RoleGuard allowedRole="worker">
            <WorkerLayout />
          </RoleGuard>
        }
      >
        <Route index element={<WorkerDashboard />} />
        <Route path="scan" element={<WorkerScanner />} />
        <Route path="new" element={<WorkerNewPatient />} />
        <Route path="vitals" element={<WorkerVitalsEntry />} />
        <Route path="zero-signal" element={<WorkerZeroSignalHandoff />} />
        <Route path="directory" element={<WorkerDirectory />} />
        <Route path="pin" element={<WorkerPINLock />} />
        <Route path="sync" element={<WorkerSyncCenter />} />
        <Route path="patient/:id" element={<WorkerPatientProfile />} />
      </Route>

      {/* Patient Portal (Protected) */}
      <Route 
        path="/patient" 
        element={
          <RoleGuard allowedRole="patient">
            <PatientLayout />
          </RoleGuard>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="diary" element={<PatientAdherenceDiary />} />
        <Route path="checkin" element={<PatientDailyCheckin />} />
        <Route path="lockbox" element={<PatientLockboxPage />} />
        <Route path="savings" element={<PatientJanAushadhiReport />} />
        <Route path="zero-signal" element={<PatientZeroSignalExport />} />
        <Route path="consent" element={<PatientConsentManager />} />
        <Route path="sos" element={<PatientSOS />} />
      </Route>

      {/* About Page */}
      <Route path="/about" element={<AboutPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
