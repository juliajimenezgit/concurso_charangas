import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen.jsx';
import AdminPage from './pages/AdminPage.jsx';
import VotePage from './pages/VotePage.jsx';

const THEME_STORAGE_KEY = 'charangas:theme:v1';
const SPLASH_DURATION_MS = 5000;

export default function App() {
  const [theme, setTheme] = useState(() => {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  });
  const isAdminRoute = window.location.pathname === '/admin';
  const [showSplash, setShowSplash] = useState(!isAdminRoute);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (isAdminRoute) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isAdminRoute]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return isAdminRoute ? (
    <AdminPage theme={theme} onToggleTheme={toggleTheme} />
  ) : (
    <VotePage theme={theme} onToggleTheme={toggleTheme} />
  );
}
