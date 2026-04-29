import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, Topbar, Toasts } from './components/Shell';
import { DemoMode } from './components/DemoMode';
import { WelcomeOverlay, Coachmarks } from './components/Welcome';

import LoginScreen    from './screens/Login';
import Dashboard      from './screens/Dashboard';
import WindAlertScreen from './screens/Wind';
import ControlPanel   from './screens/Control';
import Reports        from './screens/Reports';
import Wireframes     from './screens/Wireframes';
import Evaluation     from './screens/Evaluation';
import BenchmarkScreen from './screens/Benchmark';

function AppShell() {
  const { page, authed, telemetry } = useApp();

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
      <Sidebar/>
      <div className="main-col">
        <div className="tele-row">
          <TeleCard icon="battery"    label="Battery"   value={telemetry.battery.toFixed(0)}  unit="%" tone={telemetry.battery < 25 ? 'danger' : telemetry.battery < 40 ? 'warn' : 'ok'} />
          <TeleCard icon="altitude"   label="Altitude"  value={telemetry.altitude.toFixed(0)} unit="m" />
          <TeleCard icon="speed"      label="Airspeed"  value={telemetry.speed.toFixed(1)}    unit="m/s" />
          <TeleCard icon="signal"     label="Signal"    value={telemetry.signal.toFixed(0)}   unit="%" tone={telemetry.signal < 50 ? 'danger' : telemetry.signal < 70 ? 'warn' : 'ok'} />
        </div>
        <div style={{ borderBottom: '1px solid var(--border)' }}><Topbar/></div>
        <main className="page-scroll">
          {page === 'dashboard'  && <Dashboard/>}
          {page === 'wind'       && <WindAlertScreen/>}
          {page === 'control'    && <ControlPanel/>}
          {page === 'reports'    && <Reports/>}
          {page === 'wireframes' && <Wireframes/>}
          {page === 'evaluation' && <Evaluation/>}
          {page === 'benchmark'  && <BenchmarkScreen/>}
        </main>
      </div>
      <Toasts/>
      <WelcomeOverlay/>
      <Coachmarks/>
      <DemoMode/>
    </div>
  );
}

function TeleCard({ icon, label, value, unit, tone = '' }: { icon:string; label:string; value:string; unit:string; tone?:string }) {
  const { showAnnotations: _ } = useApp(); // keep import alive
  return (
    <div className={`tele-card ${tone}`}>
      <div className="tele-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon === 'battery'  && <><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></>}
        {icon === 'altitude' && <path d="M3 20l6-12 4 7 3-4 5 9z"/>}
        {icon === 'speed'    && <><path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l5-3"/></>}
        {icon === 'signal'   && <><path d="M2 20h2"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20v-12"/><path d="M22 20v-16"/></>}
      </svg></div>
      <div className="tele-label">{label}</div>
      <div className="tele-value">{value}<span className="tele-unit">{unit}</span></div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell/>
    </AppProvider>
  );
}
