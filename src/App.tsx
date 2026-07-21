import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { AdventurePage } from './pages/AdventurePage';
import { ElementalMergePage } from './pages/ElementalMergePage';
import { MysteryTowerPage } from './pages/MysteryTowerPage';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(() => localStorage.getItem('games-guest-mode') === 'yes');
  const [authReady, setAuthReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);

  useEffect(() => { const quickSave = (event: KeyboardEvent) => { if (window.location.pathname !== '/adventure' || !event.ctrlKey || !event.altKey || event.code !== 'KeyQ') return; event.preventDefault(); window.dispatchEvent(new Event('save-all-games')); localStorage.setItem('games-last-quick-save', new Date().toISOString()); setNotice('💾 Прогресс сохранён!'); window.setTimeout(() => setNotice(''), 2500); }; window.addEventListener('keydown', quickSave); return () => window.removeEventListener('keydown', quickSave); }, []);

  useEffect(() => { const secretLoad = (event: KeyboardEvent) => { if (window.location.pathname !== '/adventure' || !event.ctrlKey || !event.altKey || event.code !== 'KeyE') return; event.preventDefault(); window.dispatchEvent(new Event('load-all-games')); setNotice('✨ Прогресс восстановлен!'); window.setTimeout(() => setNotice(''), 2500); }; window.addEventListener('keydown', secretLoad); return () => window.removeEventListener('keydown', secretLoad); }, []);

  useEffect(() => {
    const message = localStorage.getItem('games-welcome-message');
    if (!message) return;
    localStorage.removeItem('games-welcome-message');
    setNotice(message);
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [session, guest]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  if (!authReady) return <main className="auth-loading">Загрузка…</main>;
  if (!session && !guest) return <Auth onGuest={() => { localStorage.setItem('games-guest-mode', 'yes'); setGuest(true); }} />;

  const logout = () => { if (guest) { localStorage.removeItem('games-guest-mode'); setGuest(false); } else void supabase.auth.signOut(); };

  const accountButton = <button className="account-logout" onClick={logout}>{guest ? 'Гость · Выйти' : 'Выйти'}</button>;

  let page = <HomePage onPlay={() => navigate('/game')} onAdventure={() => navigate('/adventure')} onMerge={() => navigate('/elemental-merge')} onTower={() => navigate('/mystery-tower')} />;
  if (path === '/game') page = <GamePage onHome={() => navigate('/')} />;
  if (path === '/adventure') page = <AdventurePage onHome={() => navigate('/')} />;
  if (path === '/elemental-merge') page = <ElementalMergePage onHome={() => navigate('/')} />;
  if (path === '/mystery-tower') page = <MysteryTowerPage onHome={() => navigate('/')} />;
  return <>{accountButton}{!online && <div className="offline-status">📴 Офлайн-режим · одиночные игры работают</div>}{notice && <div className="step-success" role="status">{notice}</div>}{page}</>;
}
