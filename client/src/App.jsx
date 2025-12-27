import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import MaintenanceRequest from './pages/MaintenanceRequest';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="equipment" element={<EquipmentList />} />
          <Route path="maintenance/new" element={<MaintenanceRequest />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
