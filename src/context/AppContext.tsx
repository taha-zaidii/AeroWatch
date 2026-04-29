import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

/* ============================================================
 * Types
 * ============================================================ */
export interface Page {
  id: string;
  label: string;
  icon: string;
  kbd?: string;
  hidden?: boolean;
  alert?: boolean;
  section?: string;
}

export interface Telemetry {
  callsign: string;
  model: string;
  pilot: string;
  missionId: string;
  battery: number;
  altitude: number;
  speed: number;
  heading: number;
  signal: number;
  satellites: number;
  temperature: number;
  dewPoint: number;
  humidity: number;
  pressure: number;
  visibility: number;
  cloudBase: number;
  uvIndex: number;
  precipitation: number;
  windSpeed: number;
  windGust: number;
  windDir: string;
  windHeading: number;
  flightTime: number;
  status: string;
  recording: boolean;
  geofence: string;
  conditions: string;
}

export interface Alert {
  id: number;
  level: string;
  title: string;
  body: string;
  time: string;
  acknowledged: boolean;
  source: string;
}

export interface FlightLog {
  id: string;
  date: string;
  pilot: string;
  duration: string;
  dist: number;
  max_alt: number;
  status: string;
  score: number | null;
}

export interface Toast {
  id: string;
  level?: string;
  title: string;
  body?: string;
  duration?: number;
}

export interface User {
  name: string;
  initials: string;
  role: string;
}

export interface AppState {
  page: string;
  setPage: (p: string) => void;
  authed: boolean;
  setAuthed: (v: boolean) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  telemetry: Telemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<Telemetry>>;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  flightLogs: FlightLog[];
  setFlightLogs: React.Dispatch<React.SetStateAction<FlightLog[]>>;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  showAnnotations: boolean;
  setShowAnnotations: React.Dispatch<React.SetStateAction<boolean>>;
  firstRun: boolean;
  setFirstRun: React.Dispatch<React.SetStateAction<boolean>>;
  trainee: boolean;
  setTrainee: React.Dispatch<React.SetStateAction<boolean>>;
  coachStep: number;
  setCoachStep: React.Dispatch<React.SetStateAction<number>>;
  theme: string;
  setTheme: (t: string) => void;
}

/* ============================================================
 * Constants
 * ============================================================ */
export const PAGES: Page[] = [
  { id: 'login',      label: 'Login',          icon: 'lock',       hidden: true  },
  { id: 'dashboard',  label: 'Dashboard',      icon: 'dashboard',  kbd: '1' },
  { id: 'wind',       label: 'Wind & Weather', icon: 'wind',       kbd: '2', alert: true },
  { id: 'control',    label: 'Control Panel',  icon: 'joystick',   kbd: '3' },
  { id: 'reports',    label: 'Reports',        icon: 'history',    kbd: '4' },
  { id: 'wireframes', label: 'Wireframes',     icon: 'wireframe',  kbd: '5', section: 'Project' },
  { id: 'evaluation', label: 'Usability Plan', icon: 'evaluation', kbd: '6' },
  { id: 'benchmark',  label: 'HCI Benchmark',  icon: 'zap',        kbd: '7' },
];

const initialTelemetry: Telemetry = {
  callsign: 'AERO-07',
  model: 'Skyhawk X4',
  pilot: 'Lt. Maya Khan',
  missionId: 'MX-2042-04',
  battery: 78,
  altitude: 124,
  speed: 14.2,
  heading: 47,
  signal: 92,
  satellites: 14,
  temperature: 18.4,
  dewPoint: 11.2,
  humidity: 62,
  pressure: 1013.4,
  visibility: 9.5,
  cloudBase: 1800,
  uvIndex: 5,
  precipitation: 0,
  windSpeed: 12,
  windGust: 18,
  windDir: 'NNE',
  windHeading: 22,
  flightTime: 0,
  status: 'IN-FLIGHT',
  recording: true,
  geofence: 'NOMINAL',
  conditions: 'Partly cloudy',
};

const seedFlightLogs: FlightLog[] = [
  { id: 'MX-2042-04', date: '2026-04-29', pilot: 'Lt. Maya Khan',  duration: '00:42:18', dist: 6.4,  max_alt: 142, status: 'in-progress', score: null },
  { id: 'MX-2041-03', date: '2026-04-28', pilot: 'Lt. Maya Khan',  duration: '01:12:04', dist: 11.2, max_alt: 138, status: 'completed',   score: 96 },
  { id: 'MX-2040-08', date: '2026-04-27', pilot: 'Cpt. R. Iqbal',  duration: '00:38:51', dist: 5.1,  max_alt: 110, status: 'completed',   score: 92 },
  { id: 'MX-2039-02', date: '2026-04-26', pilot: 'Lt. Maya Khan',  duration: '00:08:32', dist: 0.8,  max_alt: 64,  status: 'aborted',     score: 41 },
  { id: 'MX-2038-09', date: '2026-04-25', pilot: 'Sgt. A. Yusef',  duration: '01:04:11', dist: 9.7,  max_alt: 156, status: 'completed',   score: 98 },
  { id: 'MX-2037-01', date: '2026-04-24', pilot: 'Cpt. R. Iqbal',  duration: '00:55:40', dist: 8.3,  max_alt: 121, status: 'completed',   score: 94 },
  { id: 'MX-2036-05', date: '2026-04-23', pilot: 'Lt. Maya Khan',  duration: '00:22:09', dist: 3.2,  max_alt: 88,  status: 'completed',   score: 87 },
];

const seedAlerts: Alert[] = [
  { id: 1, level: 'warn',   title: 'Wind gusts approaching threshold',  body: 'Gust speed at 41 km/h. Operational limit 45 km/h.',          time: '2 min ago',  acknowledged: false, source: 'METAR' },
  { id: 2, level: 'info',   title: 'Geofence boundary update applied',  body: 'New buffer of 50 m loaded for sector C-7.',                   time: '12 min ago', acknowledged: true,  source: 'System' },
  { id: 3, level: 'danger', title: 'Pre-storm signature detected',      body: 'Rapid cloud darkening + dust uplift in ENE quadrant.',        time: '18 min ago', acknowledged: false, source: 'Vision AI' },
];

/* ============================================================
 * Context
 * ============================================================ */
const AppCtx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState('login');
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry>(initialTelemetry);
  const [alerts, setAlerts] = useState<Alert[]>(seedAlerts);
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>(seedFlightLogs);
  const [firstRun, setFirstRun] = useState(false);
  const [trainee, setTrainee] = useState(true);
  const [coachStep, setCoachStep] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [theme, setThemeState] = useState<string>(() => {
    try { return localStorage.getItem('aero-theme') || 'dark'; } catch { return 'dark'; }
  });

  const setTheme = (t: string) => {
    setThemeState(t);
    try { localStorage.setItem('aero-theme', t); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Live telemetry simulation
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      setTelemetry(prev => {
        if (prev.status === 'GROUNDED') return prev;
        const drift = (n: number, mag: number) => n + (Math.random() - 0.5) * mag;
        return {
          ...prev,
          battery:     Math.max(0, prev.battery - 0.05),
          altitude:    Math.max(0, drift(prev.altitude, 1.4)),
          speed:       Math.max(0, drift(prev.speed, 0.4)),
          heading:     (prev.heading + (Math.random() - 0.5) * 2 + 360) % 360,
          signal:      Math.max(40, Math.min(100, drift(prev.signal, 1.2))),
          temperature: drift(prev.temperature, 0.05),
          humidity:    Math.max(20, Math.min(100, drift(prev.humidity, 0.3))),
          pressure:    drift(prev.pressure, 0.05),
          dewPoint:    drift(prev.dewPoint, 0.04),
          visibility:  Math.max(0.5, Math.min(15, drift(prev.visibility, 0.04))),
          uvIndex:     Math.max(0, Math.min(11, drift(prev.uvIndex, 0.04))),
          windSpeed:   Math.max(0, drift(prev.windSpeed, 0.4)),
          windGust:    Math.max(prev.windSpeed + 4, drift(prev.windGust, 0.6)),
          windHeading: (prev.windHeading + (Math.random() - 0.5) * 2 + 360) % 360,
          flightTime:  prev.flightTime + 1,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [authed]);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, ...toast }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), toast.duration || 3500);
  }, []);

  // Keyboard accelerators
  useEffect(() => {
    if (!authed) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const match = PAGES.find(p => p.kbd === e.key);
      if (match) {
        e.preventDefault();
        setPage(match.id);
      } else if (e.key === '?') {
        pushToast({ level: 'info', title: 'Keyboard shortcuts', body: 'Press 1–7 to navigate. E to toggle annotations.' });
      } else if (e.key.toLowerCase() === 'e') {
        setShowAnnotations(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [authed, pushToast]);

  const value: AppState = {
    page, setPage,
    authed, setAuthed,
    user, setUser,
    telemetry, setTelemetry,
    alerts, setAlerts,
    flightLogs, setFlightLogs,
    toasts, pushToast,
    showAnnotations, setShowAnnotations,
    firstRun, setFirstRun,
    trainee, setTrainee,
    coachStep, setCoachStep,
    theme, setTheme,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
