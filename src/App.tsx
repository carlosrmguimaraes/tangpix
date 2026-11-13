import React, { useState, useEffect } from 'react';
import { PublicTipPage } from './pages/PublicTipPage';
import { OverlayWidget } from './pages/OverlayWidget';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Rota do OBS Browser Source: /overlay/:token
  if (currentPath.startsWith('/overlay/')) {
    const token = currentPath.replace('/overlay/', '').trim();
    return <OverlayWidget token={token} />;
  }

  // Rota do Dashboard do Streamer: /dashboard
  if (currentPath.startsWith('/dashboard')) {
    return <DashboardPage />;
  }

  // Rota Pública de Doação: /:username (ou padrão 'carlos')
  const username = currentPath.replace('/', '').trim() || 'carlos';
  return <PublicTipPage username={username} />;
};

export default App;
