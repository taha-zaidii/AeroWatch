import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

interface DemoStep {
  page: string;
  target: string;
  title: string;
  body: string;
  principle: string;
}

const DEMO_STEPS: DemoStep[] = [
  { page: 'dashboard', target: '.tele-row',       title: 'Live telemetry strip',       body: 'Four safety-critical readings — battery, altitude, speed, signal — update every second from the on-board IMU. Same position on every screen for fast scanning.',             principle: 'Visibility · Consistency' },
  { page: 'dashboard', target: '.map-card',        title: 'Tactical map',               body: 'UAV position, geofence boundary, and the storm cell are layered on a single map. The pulsing pin instantly draws the eye to current location.',                              principle: 'Visual Hierarchy' },
  { page: 'dashboard', target: '.alert-row',       title: 'Alert hierarchy',            body: 'Color encodes severity: red = critical, amber = caution, blue = info. An unread dot pulses until acknowledged.',                                                             principle: 'Feedback' },
  { page: 'wind',      target: '.wind-rose',       title: 'Wind rose + gust gauge',     body: 'The arrow rotates to current wind direction; the live gust value sits in the middle. Spatial encoding lets a pilot decide without translating numbers.',                      principle: 'Mapping · Feedback' },
  { page: 'wind',      target: '.threshold-bar',   title: 'Operational threshold bar',  body: 'A horizontal traffic-light bar shows where current gusts sit relative to the 45 km/h limit. The marker visualises proximity to the danger zone.',                            principle: 'Error Prevention' },
  { page: 'control',   target: '.cmd-btn.danger',  title: 'Emergency landing — guarded',body: 'Red card + a confirmation dialog whose default button is Cancel. Destructive actions never fire on a single click.',                                                          principle: 'Error Prevention' },
  { page: 'control',   target: '.joystick',        title: 'Virtual joystick',           body: 'Movement maps directly to UAV translation in world space (north up). Cursor changes to grab/grabbing on hover — pointer hot-spot awareness.',                               principle: 'Pointer Design · Mapping' },
  { page: 'reports',   target: '.bar-chart',       title: 'Daily flights chart',        body: "Today's bar uses the accent color while past days fade to neutral — visual hierarchy puts the present front and centre.",                                                    principle: 'Visual Hierarchy' },
  { page: 'reports',   target: '.flight-row.head', title: 'Tabular flight log',         body: 'The same pill component, same columns, same colours used elsewhere — one vocabulary, learned once, reused everywhere.',                                                      principle: 'Consistency' },
  { page: 'wireframes',target: '.wf-grid',         title: 'Low-fidelity wireframes',    body: 'Pen-and-paper layouts produced before high-fidelity design — required by Task 1 of the rubric.',                                                                            principle: 'Design Process' },
  { page: 'evaluation',target: '.eval-table',      title: 'Usability evaluation matrix',body: 'Eight measurable attributes with Now-level vs Planned-level and the targeted improvement (Δ). This is the rubric format from the brief.',                                   principle: 'Usability Evaluation' },
  { page: 'evaluation',target: '.principle-grid',  title: 'HCI principles, mapped',     body: 'Every principle the prototype embodies is listed with the place it shows up. End of tour — press Esc or click Finish.',                                                     principle: 'Recap' },
];

interface Rect { top: number; left: number; width: number; height: number; }

export function DemoMode() {
  const { setPage, page } = useApp();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number>(0);

  const current = DEMO_STEPS[step];

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't' && !(e.target as HTMLElement).matches('input,textarea')) {
        setActive(v => !v); setStep(0);
      }
      if (!active) return;
      if (e.key === 'Escape') setActive(false);
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    if (current && page !== current.page) setPage(current.page);
  }, [active, step]);

  useEffect(() => {
    if (!active || !current) { setRect(null); return; }
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(current.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        if (r.top < 60 || r.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(measure);
    };
    const t = setTimeout(measure, 350);
    window.addEventListener('resize', measure);
    return () => {
      cancelled = true;
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', measure);
    };
  }, [active, step, page]);

  const next = () => setStep(s => Math.min(DEMO_STEPS.length - 1, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));
  const finish = () => { setActive(false); setStep(0); };

  return (
    <>
      {!active && (
        <button
          onClick={() => { setActive(true); setStep(0); }}
          title="Start guided demo (T)"
          style={{
            position: 'fixed', bottom: 22, left: 22, zIndex: 90,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 100,
            background: 'var(--accent)', color: '#0a0f0c',
            border: 0, cursor: 'pointer', fontWeight: 600, fontSize: 13,
            fontFamily: 'inherit',
            boxShadow: '0 8px 24px rgba(163,197,133,0.35), 0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <Icon name="play" size={12} stroke={2}/>
          Guided demo
          <span className="mono" style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,23,34,0.25)', marginLeft: 4 }}>T</span>
        </button>
      )}

      {active && current && (
        <DemoOverlay
          step={step}
          total={DEMO_STEPS.length}
          current={current}
          rect={rect}
          onNext={step === DEMO_STEPS.length - 1 ? finish : next}
          onPrev={prev}
          onClose={finish}
          isLast={step === DEMO_STEPS.length - 1}
        />
      )}
    </>
  );
}

function DemoOverlay({
  step, total, current, rect, onNext, onPrev, onClose, isLast,
}: {
  step: number; total: number; current: DemoStep; rect: Rect | null;
  onNext: () => void; onPrev: () => void; onClose: () => void; isLast: boolean;
}) {
  const pad = 8;
  const has = rect && rect.width > 0;
  const r = has ? {
    top: rect!.top - pad, left: rect!.left - pad,
    width: rect!.width + pad * 2, height: rect!.height + pad * 2,
  } : null;

  const tipPos: React.CSSProperties = (() => {
    if (!r) return { bottom: 32, left: '50%', transform: 'translateX(-50%)' };
    const spaceBelow = window.innerHeight - (r.top + r.height);
    if (spaceBelow > 224) {
      return { top: r.top + r.height + 14, left: Math.max(20, Math.min(window.innerWidth - 380, r.left)) };
    }
    return { top: Math.max(20, r.top - 214), left: Math.max(20, Math.min(window.innerWidth - 380, r.left)) };
  })();

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(10,15,12,0.55)', pointerEvents: 'auto' }}/>
      {r && (
        <div style={{
          position: 'fixed', top: r.top, left: r.left, width: r.width, height: r.height,
          borderRadius: 14,
          boxShadow: '0 0 0 2px var(--accent), 0 0 0 8px rgba(163,197,133,0.30), 0 0 40px rgba(163,197,133,0.25)',
          zIndex: 151, pointerEvents: 'none', transition: 'all 320ms cubic-bezier(.4,.2,.2,1)',
        }}/>
      )}
      <div style={{
        position: 'fixed', zIndex: 160, width: 360,
        background: 'var(--card)', border: '1px solid var(--accent)',
        borderRadius: 14, padding: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        transition: 'all 320ms cubic-bezier(.4,.2,.2,1)', ...tipPos,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            HCI · {current.principle}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 2, display: 'grid', placeItems: 'center' }} title="Exit demo (Esc)">
            <Icon name="x" size={14}/>
          </button>
        </div>
        <div className="serif" style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 8 }}>{current.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 16 }}>{current.body}</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--accent)' : 'var(--border)', transition: 'background 200ms' }}/>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onPrev} disabled={step === 0} style={{ padding: '7px 12px', fontSize: 12 }}>
              <Icon name="chevronLeft" size={13}/> Back
            </button>
            <button className="btn primary" onClick={onNext} style={{ padding: '7px 14px', fontSize: 12 }}>
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <Icon name="chevronRight" size={13}/>}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between' }}>
          <span>← / → to navigate</span><span>Esc to exit</span>
        </div>
      </div>
    </>
  );
}
