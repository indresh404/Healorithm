// App/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Health Worker Pages (Green Theme)
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerScanner from './pages/worker/WorkerScanner';
import WorkerNewPatient from './pages/worker/WorkerNewPatient';
import WorkerVitalsEntry from './pages/worker/WorkerVitalsEntry';
import WorkerZeroSignalHandoff from './pages/worker/WorkerZeroSignalHandoff';
import WorkerDirectory from './pages/worker/WorkerDirectory';
import WorkerPINLock from './pages/worker/WorkerPINLock';

// Patient Pages (Blue Theme)
import PatientLayout from './pages/patient/PatientLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAdherenceDiary from './pages/patient/PatientAdherenceDiary';
import PatientJanAushadhiReport from './pages/patient/PatientJanAushadhiReport';
import PatientZeroSignalExport from './pages/patient/PatientZeroSignalExport';
import PatientConsentManager from './pages/patient/PatientConsentManager';
import PatientSOS from './pages/patient/PatientSOS';

// About Page
import AboutPage from './pages/AboutPage';

export default function AppPWA() {
  return (
    <Routes>
      {/* Default redirect to Worker */}
      <Route path="/" element={<Navigate to="/worker" replace />} />

      {/* Health Worker Portal (Solid Green Theme) */}
      <Route path="/worker" element={<WorkerLayout />}>
        <Route index element={<WorkerDashboard />} />
        <Route path="scan" element={<WorkerScanner />} />
        <Route path="new" element={<WorkerNewPatient />} />
        <Route path="vitals" element={<WorkerVitalsEntry />} />
        <Route path="zero-signal" element={<WorkerZeroSignalHandoff />} />
        <Route path="directory" element={<WorkerDirectory />} />
        <Route path="pin" element={<WorkerPINLock />} />
      </Route>

      {/* Patient Portal (Solid Blue Theme) */}
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<PatientDashboard />} />
        <Route path="diary" element={<PatientAdherenceDiary />} />
        <Route path="savings" element={<PatientJanAushadhiReport />} />
        <Route path="zero-signal" element={<PatientZeroSignalExport />} />
        <Route path="consent" element={<PatientConsentManager />} />
        <Route path="sos" element={<PatientSOS />} />
      </Route>

      {/* About Page */}
      <Route path="/about" element={<AboutPage />} />

      <Route path="*" element={<Navigate to="/worker" replace />} />
    </Routes>
  );
}
