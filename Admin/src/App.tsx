// Admin/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/Dashboard';
import HealthMapPage from './pages/HealthMapPage';
import OutbreaksPage from './pages/OutbreaksPage';
import TrendsPage from './pages/TrendsPage';
import ResourcesPage from './pages/ResourcesPage';
import WorkersPage from './pages/WorkersPage';
import UsersList from './pages/UsersList';
import UserDetails from './pages/UserDetails';
import CareCoordinationAgentPage from './pages/CareCoordinationAgentPage';
import ConflictResolutionPage from './pages/ConflictResolutionPage';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
