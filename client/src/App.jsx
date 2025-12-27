import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import MaintenanceRequest from './pages/MaintenanceRequest';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Calendar from './pages/Calendar';
import Teams from './pages/Teams';
import RequireAuth from './components/RequireAuth.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="equipment" element={<EquipmentList />} />
          <Route path="teams" element={<Teams />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="maintenance/new" element={<MaintenanceRequest />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
