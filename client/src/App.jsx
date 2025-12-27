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
import Requests from './pages/Requests';
import Users from './pages/Users';
import RequireAuth from './components/RequireAuth.jsx';
import RequireRole from './components/RequireRole.jsx';

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
          <Route
            path="dashboard"
            element={
              <RequireRole allowedRoles={["admin", "technician"]}>
                <Dashboard />
              </RequireRole>
            }
          />
          <Route
            path="equipment"
            element={
              <RequireRole allowedRoles={["admin", "technician", "employee"]}>
                <EquipmentList />
              </RequireRole>
            }
          />
          <Route
            path="teams"
            element={
              <RequireRole allowedRoles={["admin", "technician"]}>
                <Teams />
              </RequireRole>
            }
          />
          <Route
            path="users"
            element={
              <RequireRole allowedRoles={["admin"]}>
                <Users />
              </RequireRole>
            }
          />
          <Route
            path="calendar"
            element={
              <RequireRole allowedRoles={["admin", "technician"]}>
                <Calendar />
              </RequireRole>
            }
          />
          <Route
            path="requests"
            element={
              <RequireRole allowedRoles={["admin", "technician", "employee"]}>
                <Requests />
              </RequireRole>
            }
          />
          <Route
            path="maintenance/new"
            element={
              <RequireRole allowedRoles={["admin", "employee"]}>
                <MaintenanceRequest />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
