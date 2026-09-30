// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import HealthMapPage from './pages/admin/HealthMapPage';
import OutbreaksPage from './pages/admin/OutbreaksPage';
import TrendsPage from './pages/admin/TrendsPage';
import ResourcesPage from './pages/admin/ResourcesPage';
import WorkersPage from './pages/admin/WorkersPage';
import UsersList from './pages/admin/UsersList';
import UserDetails from './pages/admin/UserDetails';
import CareCoordinationAgentPage from './pages/admin/CareCoordinationAgentPage';
import ConflictResolutionPage from './pages/admin/ConflictResolutionPage';

// Health Worker Pages
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerScanner from './pages/worker/WorkerScanner';
import WorkerNewPatient from './pages/worker/WorkerNewPatient';
import WorkerVitalsEntry from './pages/worker/WorkerVitalsEntry';
import WorkerZeroSignalHandoff from './pages/worker/WorkerZeroSignalHandoff';
import WorkerDirectory from './pages/worker/WorkerDirectory';
import WorkerPINLock from './pages/worker/WorkerPINLock';

// Patient Pages
import PatientLayout from './pages/patient/PatientLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAdherenceDiary from './pages/patient/PatientAdherenceDiary';
import PatientJanAushadhiReport from './pages/patient/PatientJanAushadhiReport';
import PatientZeroSignalExport from './pages/patient/PatientZeroSignalExport';
import PatientConsentManager from './pages/patient/PatientConsentManager';
import PatientSOS from './pages/patient/PatientSOS';

// About Page
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <Routes>
      {/* Root redirect to Doctor / Super Admin Dashboard */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Doctor & District Super Admin Portal */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="map" element={<HealthMapPage />} />
        <Route path="outbreaks" element={<OutbreaksPage />} />
        <Route path="trends" element={<TrendsPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="users" element={<UsersList />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="agent" element={<CareCoordinationAgentPage />} />
        <Route path="conflicts" element={<ConflictResolutionPage />} />
      </Route>

      {/* Backward-compatible Admin Routes */}
      <Route path="/map" element={<Navigate to="/admin/map" replace />} />
      <Route path="/outbreaks" element={<Navigate to="/admin/outbreaks" replace />} />
      <Route path="/trends" element={<Navigate to="/admin/trends" replace />} />
      <Route path="/resources" element={<Navigate to="/admin/resources" replace />} />
      <Route path="/workers" element={<Navigate to="/admin/workers" replace />} />
      <Route path="/users" element={<Navigate to="/admin/users" replace />} />
      <Route path="/users/:id" element={<Navigate to="/admin/users/:id" replace />} />

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

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
