import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp, PAGES } from '../store/app';
import { Icon } from './Icon';

/** Current page id derived from the URL path. */
export function usePageId(): string {
  const { pathname } = useLocation();
  return pathname.replace(/^\//, '') || 'dashboard';
}

/* ============================================================
 * Sidebar (with mobile drawer)
 * ============================================================ */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { alerts, setAuthed } = useApp();
  const page = usePageId();
  const nav = useNavigate();
  const unreadAlerts = alerts.filter(a => !a.acknowledged).length;
  const visiblePages = PAGES.filter(p => !p.hidden);

  const navigate = (id: string) => { nav(`/${id}`); onClose(); };

  return (
    <>
      <div className={`sidebar-scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true"/>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Icon name="wind" size={18} stroke={2} style={{ color: '#fff' }}/></div>
          <div>
            <div className="brand-name">AeroWatch</div>
            <div className="brand-tag">UAV Weather Intelligence</div>
          </div>
        </div>

        <div className="nav-section">Operations</div>
        {visiblePages.slice(0, 4).map(p => (
          <NavItem key={p.id} page={p} active={page === p.id} onClick={() => navigate(p.id)}
            badge={p.alert && unreadAlerts ? unreadAlerts : null} />
        ))}

        <div className="nav-section">Project</div>
        {visiblePages.slice(4).map(p => (
          <NavItem key={p.id} page={p} active={page === p.id} onClick={() => navigate(p.id)} />
        ))}

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="dot ok"/>
            <span>All systems nominal</span>
          </div>
          <div className="nav-item" onClick={() => { setAuthed(false); nav('/'); onClose(); }}>
            <Icon name="logout" size={16}/>
            <span>Sign out</span>
          </div>
        </div>
      </aside>
    </>
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
export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, telemetry, showAnnotations, setShowAnnotations, theme, setTheme } = useApp();
  const page = usePageId();
  const nav = useNavigate();
  const setPage = (id: string) => nav(`/${id}`);
  const here = PAGES.find(p => p.id === page);
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const showBack = page !== 'dashboard' && page !== 'login';

  return (
    <div className="topbar">
      <div className="topbar-left">
        {onMenuClick && (
          <button className="menu-toggle" onClick={onMenuClick} aria-label="Open menu">
            <Icon name="menu" size={18}/>
          </button>
        )}
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
