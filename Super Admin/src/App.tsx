import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/UsersList';
import Scanner from './pages/Scanner';
import UserDetails from './pages/UserDetails';
import HealthMapPage from './pages/HealthMapPage';
import OutbreaksPage from './pages/OutbreaksPage';
import TrendsPage from './pages/TrendsPage';
import ResourcesPage from './pages/ResourcesPage';
import WorkersPage from './pages/WorkersPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<HealthMapPage />} />
          <Route path="outbreaks" element={<OutbreaksPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="users" element={<UsersList />} />
          <Route path="scan" element={<Scanner />} />
          <Route path="user/:id" element={<UserDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
