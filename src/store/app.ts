import { create } from 'zustand';

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

export interface GeoLocation {
  name: string;
  region: string;
  lat: number;
  lng: number;
  elevation?: number;
}

/* ============================================================
 * Constants
 * ============================================================ */
export const PAGES: Page[] = [
  { id: 'dashboard',  label: 'Dashboard',      icon: 'dashboard',  kbd: '1' },
  { id: 'wind',       label: 'Wind & Weather', icon: 'wind',       kbd: '2', alert: true },
  { id: 'control',    label: 'Control Panel',  icon: 'joystick',   kbd: '3' },
  { id: 'reports',    label: 'Reports',        icon: 'history',    kbd: '4' },
  { id: 'wireframes', label: 'Wireframes',     icon: 'wireframe',  kbd: '5', section: 'Project' },
  { id: 'evaluation', label: 'Usability Plan', icon: 'evaluation', kbd: '6' },
  { id: 'benchmark',  label: 'HCI Benchmark',  icon: 'zap',        kbd: '7' },
];

export const DEFAULT_LOCATION: GeoLocation = {
  name: 'Margalla Hills',
  region: 'Islamabad, Pakistan',
  lat: 33.7444,
  lng: 73.0479,
  elevation: 540,
};

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
  { id: 1, level: 'warn',   title: 'Wind gusts approaching threshold',  body: 'Gust speed at 41 km/h. Operational limit 45 km/h.',    time: '2 min ago',  acknowledged: false, source: 'METAR' },
  { id: 2, level: 'info',   title: 'Geofence boundary update applied',  body: 'New buffer of 50 m loaded for sector C-7.',             time: '12 min ago', acknowledged: true,  source: 'System' },
  { id: 3, level: 'danger', title: 'Pre-storm signature detected',      body: 'Rapid cloud darkening + dust uplift in ENE quadrant.',  time: '18 min ago', acknowledged: false, source: 'Vision AI' },
];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/* ============================================================
 * Store
 * ============================================================ */
export interface AppState {
  authed: boolean;
  setAuthed: (v: boolean) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  telemetry: Telemetry;
  setTelemetry: (updater: Telemetry | ((prev: Telemetry) => Telemetry)) => void;
  alerts: Alert[];
  setAlerts: (updater: Alert[] | ((prev: Alert[]) => Alert[])) => void;
  flightLogs: FlightLog[];
  setFlightLogs: (updater: FlightLog[] | ((prev: FlightLog[]) => FlightLog[])) => void;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  showAnnotations: boolean;
  setShowAnnotations: (updater: boolean | ((prev: boolean) => boolean)) => void;
  theme: string;
  setTheme: (t: string) => void;
  location: GeoLocation;
  setLocation: (loc: GeoLocation) => void;
}

type Updater<T> = T | ((prev: T) => T);
const resolve = <T,>(updater: Updater<T>, prev: T): T =>
  typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;

export const useAppStore = create<AppState>()((set, get) => ({
  authed: false,
  setAuthed: (v) => set({ authed: v }),

  user: null,
  setUser: (u) => set({ user: u }),

  telemetry: initialTelemetry,
  setTelemetry: (updater) => set({ telemetry: resolve(updater, get().telemetry) }),

  alerts: seedAlerts,
  setAlerts: (updater) => set({ alerts: resolve(updater, get().alerts) }),

  flightLogs: seedFlightLogs,
  setFlightLogs: (updater) => set({ flightLogs: resolve(updater, get().flightLogs) }),

  toasts: [],
  pushToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { id, ...toast }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((x) => x.id !== id) });
    }, toast.duration || 3500);
  },

  showAnnotations: false,
  setShowAnnotations: (updater) => set({ showAnnotations: resolve(updater, get().showAnnotations) }),

  theme: (() => {
    try { return localStorage.getItem('aero-theme') || 'dark'; } catch { return 'dark'; }
  })(),
  setTheme: (t) => {
    set({ theme: t });
    try { localStorage.setItem('aero-theme', t); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', t);
  },

  location: loadJSON<GeoLocation>('aero-location', DEFAULT_LOCATION),
  setLocation: (loc) => {
    set({ location: loc });
    try { localStorage.setItem('aero-location', JSON.stringify(loc)); } catch { /* ignore */ }
  },
}));

/** Convenience hook preserving the original context API shape. */
export const useApp = useAppStore;
