import React from 'react';

type IconProps = {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
};

const ICONS: Record<string, React.ReactNode> = {
  // Brand
  drone: <>
    <path d="M12 8v8M8 12h8"/>
    <circle cx="5" cy="5" r="2.5"/>
    <circle cx="19" cy="5" r="2.5"/>
    <circle cx="5" cy="19" r="2.5"/>
    <circle cx="19" cy="19" r="2.5"/>
    <path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/>
  </>,
  // Nav
  dashboard: <>
    <rect x="3" y="3" width="7" height="9" rx="1.5"/>
    <rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/>
    <rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </>,
  wind: <>
    <path d="M3 8h11a3 3 0 1 0-3-3"/>
    <path d="M3 12h17a3 3 0 1 1-3 3"/>
    <path d="M3 16h9"/>
  </>,
  joystick: <>
    <path d="M12 3v8"/>
    <circle cx="12" cy="13" r="2.5"/>
    <path d="M5 13a7 7 0 0 0 14 0"/>
    <path d="M5 13v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3"/>
  </>,
  history: <>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 8v5l3 2"/>
  </>,
  wireframe: <>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 9v12"/>
  </>,
  evaluation: <>
    <path d="M9 11l3 3 8-8"/>
    <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>
  </>,
  settings: <>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </>,
  logout: <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <path d="M16 17l5-5-5-5"/>
    <path d="M21 12H9"/>
  </>,
  // UI
  search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
  bell: <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </>,
  chevronRight: <path d="M9 6l6 6-6 6"/>,
  chevronDown:  <path d="M6 9l6 6 6-6"/>,
  chevronLeft:  <path d="M15 6l-6 6 6 6"/>,
  arrowUp:    <path d="M12 19V5M5 12l7-7 7 7"/>,
  arrowDown:  <path d="M12 5v14M19 12l-7 7-7-7"/>,
  arrowRight: <><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></>,
  plus:  <><path d="M12 5v14M5 12h14"/></>,
  minus: <path d="M5 12h14"/>,
  x:     <><path d="M18 6L6 18M6 6l12 12"/></>,
  menu:  <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>,
  check: <path d="M5 13l4 4L19 7"/>,
  info:  <><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v4h1"/></>,
  warning: <>
    <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <path d="M12 9v4M12 17h.01"/>
  </>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  eye: <>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </>,
  eyeOff: <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <path d="M1 1l22 22"/>
  </>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  lock: <>
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </>,
  // Telemetry
  battery: <>
    <rect x="2" y="7" width="18" height="10" rx="2"/>
    <path d="M22 11v2"/>
  </>,
  altitude: <path d="M3 20l6-12 4 7 3-4 5 9z"/>,
  speed: <>
    <path d="M12 21a9 9 0 1 1 9-9"/>
    <path d="M12 12l5-3"/>
  </>,
  signal: <>
    <path d="M2 20h2"/>
    <path d="M7 20v-4"/>
    <path d="M12 20v-8"/>
    <path d="M17 20v-12"/>
    <path d="M22 20v-16"/>
  </>,
  satellite: <>
    <path d="M5 13l-2 2 4 4 2-2"/>
    <path d="M14 8l5-5"/>
    <path d="M9 12l9-9"/>
    <path d="M11 5l8 8"/>
    <path d="M19 13a6 6 0 0 1-6 6"/>
    <path d="M19 19a12 12 0 0 0-12-12"/>
  </>,
  thermometer: <><path d="M14 4a2 2 0 0 0-4 0v10.54a4 4 0 1 0 4 0z"/></>,
  compass: <>
    <circle cx="12" cy="12" r="9"/>
    <path d="M14.5 9.5L13 13l-3.5 1.5L11 11z"/>
  </>,
  cloud:  <path d="M17.5 19a4.5 4.5 0 1 0-1.5-8.74A6 6 0 1 0 6 16h11.5z"/>,
  rain:   <>
    <path d="M17.5 13a4.5 4.5 0 1 0-1.5-8.74A6 6 0 1 0 6 10h11.5z"/>
    <path d="M8 19l-1 2M12 17l-1 2M16 19l-1 2"/>
  </>,
  // Action
  play:   <path d="M5 3l14 9-14 9z" fill="currentColor"/>,
  pause:  <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  stop:   <rect x="5" y="5" width="14" height="14" rx="1"/>,
  power:  <><path d="M12 2v10"/><path d="M5.6 6.6a9 9 0 1 0 12.8 0"/></>,
  rotate: <>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
    <path d="M3 3v5h5"/>
  </>,
  home: <>
    <path d="M3 12l9-9 9 9"/>
    <path d="M5 10v10h14V10"/>
  </>,
  download: <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <path d="M7 10l5 5 5-5"/>
    <path d="M12 15V3"/>
  </>,
  filter:   <path d="M22 3H2l8 9v7l4 2v-9z"/>,
  cam: <>
    <path d="M23 7l-7 5 7 5z"/>
    <rect x="1" y="5" width="15" height="14" rx="2"/>
  </>,
  map: <>
    <path d="M9 3l-6 2v16l6-2 6 2 6-2V3l-6 2z"/>
    <path d="M9 3v16M15 5v16"/>
  </>,
  // misc
  star:    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z"/>,
  sparkle: <>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    <path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9z"/>
  </>,
  zap:      <path d="M13 2L3 14h7l-1 8 10-12h-7z"/>,
  flag:  <>
    <path d="M4 22V4"/>
    <path d="M4 4h13l-2 4 2 4H4"/>
  </>,
  pin: <>
    <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </>,
  trending: <>
    <path d="M3 17l6-6 4 4 8-8"/>
    <path d="M14 7h7v7"/>
  </>,
  clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  calendar: <>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </>,
  layout: <>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 3v18M3 9h18"/>
  </>,
  list: <>
    <path d="M8 6h13M8 12h13M8 18h13"/>
    <path d="M3 6h.01M3 12h.01M3 18h.01"/>
  </>,
  more:     <><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></>,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
  mic: <>
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M19 11a7 7 0 0 1-14 0"/>
    <path d="M12 18v4"/>
  </>,
  recording: <circle cx="12" cy="12" r="4" fill="currentColor"/>,
  route: <>
    <circle cx="6" cy="19" r="3"/>
    <circle cx="18" cy="5" r="3"/>
    <path d="M9 19h7a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h7"/>
  </>,
  tag: <>
    <path d="M20 12L12 20l-9-9V3h8z"/>
    <circle cx="7" cy="7" r="1.4"/>
  </>,
  plane: <><path d="M12 2l2 8 8 3-8 3-2 8-2-8-8-3 8-3z"/></>,
  droplet: <path d="M12 3.5c-3 4-6 7.5-6 10.5a6 6 0 0 0 12 0c0-3-3-6.5-6-10.5z"/>,
  gauge: <>
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 13l4-3"/>
    <path d="M5 13a7 7 0 0 1 14 0"/>
    <path d="M12 5v2"/>
  </>,
  sun: <>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>,
};

export function Icon({ name, size = 16, stroke = 1.75, className = '', style }: IconProps) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      className={`icon ${className}`} style={style}
    >
      {paths}
    </svg>
  );
}
