import { Navigate, useNavigate } from 'react-router-dom';
import { useFarm } from '../store/FarmContext';

export default function Landing() {
  const { joined } = useFarm();
  const navigate = useNavigate();
  if (joined) return <Navigate to="/dashboard" replace />;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 20 }}>
      <div style={{ fontFamily: 'var(--fd)', fontSize: 28, fontWeight: 700 }}>MyCelium<span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginLeft: 6, verticalAlign: 'middle' }}></span></div>
      <p style={{ color: 'var(--ink-2)', textAlign: 'center', fontSize: 15 }}>Grow more. Earn more.<br/>Join your local farming network.</p>
      <button className="btn btn--accent btn--full" style={{ maxWidth: 320 }} onClick={() => navigate('/setup')}>Get started</button>
      <button className="btn btn--ghost" onClick={() => navigate('/setup')}>See what to grow first</button>
    </div>
  );
}
