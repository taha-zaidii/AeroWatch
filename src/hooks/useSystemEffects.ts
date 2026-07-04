import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAGES, useAppStore } from '../store/app';

/** Applies the persisted theme to <html> on mount and on change. */
export function useTheme() {
  const theme = useAppStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}

/** Simulates live flight telemetry drift while authenticated. */
export function useTelemetrySimulation() {
  const authed = useAppStore((s) => s.authed);
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      useAppStore.getState().setTelemetry((prev) => {
        if (prev.status === 'GROUNDED') return prev;
        const drift = (n: number, mag: number) => n + (Math.random() - 0.5) * mag;
        return {
          ...prev,
          battery:     Math.max(0, prev.battery - 0.05),
          altitude:    Math.max(0, drift(prev.altitude, 1.4)),
          speed:       Math.max(0, drift(prev.speed, 0.4)),
          heading:     (prev.heading + (Math.random() - 0.5) * 2 + 360) % 360,
          signal:      Math.max(40, Math.min(100, drift(prev.signal, 1.2))),
          flightTime:  prev.flightTime + 1,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [authed]);
}

/** Global keyboard accelerators: 1–7 navigate, E toggles annotations. */
export function useKeyboardNav() {
  const authed = useAppStore((s) => s.authed);
  const navigate = useNavigate();
  useEffect(() => {
    if (!authed) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const match = PAGES.find((p) => p.kbd === e.key);
      const { pushToast, setShowAnnotations } = useAppStore.getState();
      if (match) {
        e.preventDefault();
        navigate(`/${match.id}`);
      } else if (e.key === '?') {
        pushToast({ level: 'info', title: 'Keyboard shortcuts', body: 'Press 1–7 to navigate. E to toggle annotations. ⌘K to search.' });
      } else if (e.key.toLowerCase() === 'e') {
        setShowAnnotations((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [authed, navigate]);
}
