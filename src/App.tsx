import { lazy, Suspense } from 'react';
import './index.css';

const Explorer = lazy(() => import('./pages/Explorer'));
const GestureLab = lazy(() => import('./pages/GestureLab'));
const WatchCircleLab = lazy(() => import('./pages/WatchCircleLab'));

function App() {
  // Path routing for standalone routes
  const isGestureLab = window.location.pathname === '/gesture-lab';
  const isWatchCircle = window.location.pathname === '/watch-circle';

  if (isGestureLab) {
    return (
      <Suspense fallback={<div style={{ background: '#000', width: '100vw', height: '100vh' }} />}>
        <GestureLab />
      </Suspense>
    );
  }

  if (isWatchCircle) {
    return (
      <Suspense fallback={<div style={{ background: '#020617', width: '100vw', height: '100vh' }} />}>
        <WatchCircleLab onExit={() => { window.location.pathname = '/'; }} />
      </Suspense>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Suspense fallback={<div style={{ background: '#000', width: '100%', height: '100%' }} />}>
        <Explorer />
      </Suspense>
    </div>
  );
}

export default App;
