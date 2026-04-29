import React, { useState } from 'react';
import { useApp, PAGES } from '../context/AppContext';
import { Icon } from './Icon';

/* ============================================================
 * Sidebar
 * ============================================================ */
export function Sidebar() {
  const { page, setPage, alerts, setAuthed } = useApp();
  const unreadAlerts = alerts.filter(a => !a.acknowledged).length;
  const visiblePages = PAGES.filter(p => !p.hidden);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Icon name="wind" size={18} stroke={2} style={{ color: '#fff' }}/></div>
        <div>
          <div className="brand-name">AeroWatch</div>
          <div className="brand-tag">UAV Weather Intelligence</div>
        </div>
      </div>

      <div className="nav-section">Operations</div>
      {visiblePages.slice(0, 4).map(p => (
        <NavItem key={p.id} page={p} active={page === p.id} onClick={() => setPage(p.id)}
          badge={p.alert && unreadAlerts ? unreadAlerts : null} />
      ))}

      <div className="nav-section">Project</div>
      {visiblePages.slice(4).map(p => (
        <NavItem key={p.id} page={p} active={page === p.id} onClick={() => setPage(p.id)} />
      ))}

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="dot ok"/>
          <span>All systems nominal</span>
        </div>
        <div className="nav-item" onClick={() => { setAuthed(false); setPage('login'); }}>
          <Icon name="logout" size={16}/>
          <span>Sign out</span>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  page, active, onClick, badge,
}: {
  page: { id: string; label: string; icon: string; kbd?: string };
  active: boolean;
  onClick: () => void;
  badge?: number | null;
}) {
  return (
    <div
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }}}
    >
      <Icon name={page.icon} size={17}/>
      <span>{page.label}</span>
      {badge
        ? <span className="badge">{badge}</span>
        : page.kbd ? <span className="kbd-hint">{page.kbd}</span> : null}
    </div>
  );
}

/* ============================================================
 * Topbar
 * ============================================================ */
export function Topbar() {
  const { page, setPage, user, telemetry, showAnnotations, setShowAnnotations, trainee, setTrainee, theme, setTheme } = useApp();
  const here = PAGES.find(p => p.id === page);
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const showBack = page !== 'dashboard' && page !== 'login';

  return (
    <div className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button className="ph-back" onClick={() => setPage('dashboard')} title="Back to Dashboard" style={{ marginRight: 4 }}>
            <Icon name="chevronLeft" size={14}/> Back
          </button>
        )}
        <div className="topbar-crumbs">
          <span style={{ cursor: 'pointer' }} onClick={() => setPage('dashboard')}>AeroWatch</span>
          <Icon name="chevronRight" size={12}/>
          <span className="here">{here?.label || ''}</span>
        </div>
        <div className="topbar-search">
          <Icon name="search" size={14}/>
          <input placeholder="Search location, mission, alerts…"/>
          <span className="kbd">⌘K</span>
        </div>
      </div>
      <div className="topbar-right">
        <button
          onClick={() => setTrainee(v => !v)}
          className="pill mono"
          style={{
            cursor: 'pointer',
            border: '1px solid var(--border)',
            background: trainee ? 'var(--accent-soft)' : 'var(--surface-2)',
            color: trainee ? 'var(--accent-3)' : 'var(--text-2)',
          }}
          title="Toggle Trainee / Operator mode"
        >
          {trainee ? '◐ TRAINEE' : '● OPERATOR'}
        </button>
        <div className="pill mono"><span className="dot ok"/>LIVE · {telemetry.callsign}</div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          <span className="theme-toggle-icons">
            <Icon name="sun" size={11}/><Icon name="moon" size={11}/>
          </span>
          <span className="theme-toggle-thumb">
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={12}/>
          </span>
        </button>
        <button
          className={`icon-btn ${showAnnotations ? 'active' : ''}`}
          title="Toggle HCI annotations (E)"
          onClick={() => setShowAnnotations(v => !v)}
        >
          <Icon name="info" size={16}/>
        </button>
        <button className="icon-btn" title="Notifications"><Icon name="bell" size={16}/></button>
        <div className="user-chip">
          <div className="avatar">{user?.initials || 'MK'}</div>
          <div>
            <div className="name">{user?.name || 'Maya Khan'}</div>
            <div className="role">{user?.role || 'Flight Operator'} · {time}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Toasts
 * ============================================================ */
export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.level || 'info'}`}>
          <Icon name={t.level === 'danger' ? 'warning' : t.level === 'ok' ? 'check' : 'info'} size={16}/>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
            {t.body && <div style={{ color: 'var(--text-2)', fontSize: 12 }}>{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * HCI annotation marker
 * ============================================================ */
interface HCINoteProps {
  n: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  label: string;
  principle: string;
  children?: React.ReactNode;
}

export function HCINote({ n, top, left, right, bottom, label, principle, children }: HCINoteProps) {
  const { showAnnotations } = useApp();
  const [open, setOpen] = useState(false);
  if (!showAnnotations) return null;
  const style = { top, left, right, bottom } as React.CSSProperties;
  return (
    <div style={{ position: 'absolute', ...style }}>
      <div className="note-marker" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {n}
      </div>
      <div className={`note-popover ${open ? 'visible' : ''}`} style={{ top: 28, left: 0 }}>
        <div className="note-h">HCI · {principle}</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--text-2)' }}>{children}</div>
      </div>
    </div>
  );
}
