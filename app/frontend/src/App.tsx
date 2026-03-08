import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useFarm } from './user/store/FarmContext';
import AdminDashboard from './admin/AdminDashboard';
import Setup from './user/pages/Setup';

const Landing     = lazy(() => import('./user/pages/Landing'));
const Suggestions = lazy(() => import('./user/pages/Suggestions'));
const Dashboard   = lazy(() => import('./user/pages/Dashboard'));
const Update      = lazy(() => import('./user/pages/Update'));
const Wallet      = lazy(() => import('./user/pages/Wallet'));
const Profile     = lazy(() => import('./user/pages/Profile'));

function ProtectedRoute() {
  const { joined } = useFarm();
  if (!joined) return <Navigate to="/" replace />;
  return <Outlet />;
}

function SetupRoute() {
  const { joined } = useFarm();
  const navigate = useNavigate();
  if (joined) return <Navigate to="/dashboard" replace />;
  return <Setup onComplete={() => navigate('/dashboard')} />;
}


export default function App() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/setup"       element={<SetupRoute />} />
        <Route path="/suggestions" element={<Suggestions />} />
        <Route path="/myfarm"      element={<Navigate to="/dashboard" replace />} />
        <Route path="/myfood"      element={<Navigate to="/dashboard?tab=food" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/update"      element={<Update />} />
          <Route path="/wallet"      element={<Wallet />} />
          <Route path="/profile"     element={<Profile />} />
        </Route>

        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}
