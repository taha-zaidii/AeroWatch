import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/app';
import { useKeyboardNav, useTelemetrySimulation, useTheme } from './hooks/useSystemEffects';
import { useLiveWeatherBridge } from './hooks/useWeather';
import { Sidebar, Topbar, Toasts } from './components/Shell';
import { CommandPalette } from './components/CommandPalette';
import { Copilot } from './components/Copilot';

import LoginScreen from './screens/Login';
const Dashboard       = lazy(() => import('./screens/Dashboard'));
const WindAlertScreen = lazy(() => import('./screens/Wind'));
const ControlPanel    = lazy(() => import('./screens/Control'));
const Reports         = lazy(() => import('./screens/Reports'));
const Wireframes      = lazy(() => import('./screens/Wireframes'));
const Evaluation      = lazy(() => import('./screens/Evaluation'));
const BenchmarkScreen = lazy(() => import('./screens/Benchmark'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function ScreenFallback() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 240, color: 'var(--text-3)', fontSize: 13 }}>
      Loading…
    </div>
  );
}

function AppShell() {
  const authed = useAppStore((s) => s.authed);
  const telemetry = useAppStore((s) => s.telemetry);
  const [menuOpen, setMenuOpen] = useState(false);

  useTheme();
  useTelemetrySimulation();
  useKeyboardNav();
  useLiveWeatherBridge();

  // Auto-close the mobile drawer on viewport widen
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 960) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  if (!authed) {
    return (
      <>
        <LoginScreen/>
        <Toasts/>
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)}/>
      <div className="main-col">
        <Topbar onMenuClick={() => setMenuOpen(v => !v)}/>
        <div className="tele-row">
          <TeleCard
            icon="battery" label="Battery"
            value={telemetry.battery.toFixed(0)} unit="%"
            tone={telemetry.battery < 25 ? 'danger' : telemetry.battery < 40 ? 'warn' : 'ok'}
          />
          <TeleCard icon="altitude" label="Altitude"
            value={telemetry.altitude.toFixed(0)} unit="m"/>
          <TeleCard icon="speed" label="Airspeed"
            value={telemetry.speed.toFixed(1)} unit="m/s"/>
          <TeleCard
            icon="signal" label="Signal"
            value={telemetry.signal.toFixed(0)} unit="%"
            tone={telemetry.signal < 50 ? 'danger' : telemetry.signal < 70 ? 'warn' : 'ok'}
          />
        </div>
        <main className="page-scroll">
          <Suspense fallback={<ScreenFallback/>}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
              <Route path="/dashboard"  element={<Dashboard/>}/>
              <Route path="/wind"       element={<WindAlertScreen/>}/>
              <Route path="/control"    element={<ControlPanel/>}/>
              <Route path="/reports"    element={<Reports/>}/>
              <Route path="/wireframes" element={<Wireframes/>}/>
              <Route path="/evaluation" element={<Evaluation/>}/>
              <Route path="/benchmark"  element={<BenchmarkScreen/>}/>
              <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
            </Routes>
          </Suspense>
        </main>
      </div>
      <CommandPalette/>
      <Copilot/>
      <Toasts/>
    </div>
  );
}

function TeleCard({ icon, label, value, unit, tone = '' }: {
  icon: 'battery' | 'altitude' | 'speed' | 'signal';
  label: string; value: string; unit: string; tone?: string;
}) {
  return (
    <div className={`tele-card ${tone}`}>
      <div className="tele-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon === 'battery'  && <><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></>}
          {icon === 'altitude' && <path d="M3 20l6-12 4 7 3-4 5 9z"/>}
          {icon === 'speed'    && <><path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l5-3"/></>}
          {icon === 'signal'   && <><path d="M2 20h2"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20v-12"/><path d="M22 20v-16"/></>}
        </svg>
      </div>
      <div className="tele-label">{label}</div>
      <div className="tele-value">{value}<span className="tele-unit">{unit}</span></div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell/>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
