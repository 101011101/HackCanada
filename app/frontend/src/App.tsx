import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarm } from './user/store/FarmContext';
import AdminDashboard from './admin/AdminDashboard';
import Setup from './user/pages/Setup';
import JoinPage from './JoinPage';

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

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"            element={<PageWrapper><Landing /></PageWrapper>} />
          <Route path="/setup"       element={<PageWrapper><SetupRoute /></PageWrapper>} />
          <Route path="/suggestions" element={<PageWrapper><Suggestions /></PageWrapper>} />
          <Route path="/myfarm"      element={<Navigate to="/dashboard" replace />} />
          <Route path="/myfood"      element={<Navigate to="/dashboard?tab=food" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"   element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/update"      element={<PageWrapper><Update /></PageWrapper>} />
            <Route path="/wallet"      element={<PageWrapper><Wallet /></PageWrapper>} />
            <Route path="/profile"     element={<PageWrapper><Profile /></PageWrapper>} />
          </Route>

          <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
          <Route path="/join"  element={<JoinPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
