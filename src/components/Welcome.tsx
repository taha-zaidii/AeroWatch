import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

export function WelcomeOverlay() {
  const { firstRun, setFirstRun, setTrainee, setCoachStep, pushToast } = useApp();
  const [stage, setStage] = useState(0);
  if (!firstRun) return null;

  const choose = (level: 'trainee' | 'operator') => {
    setTrainee(level === 'trainee');
    setFirstRun(false);
    if (level === 'trainee') {
      setCoachStep(1);
      pushToast({ level: 'info', title: 'Trainee mode on', body: "We'll guide you step by step." });
    } else {
      pushToast({ level: 'ok', title: 'Operator mode', body: 'Full console enabled. Press T for the guided tour.' });
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(10,15,12,0.78)', display:'grid', placeItems:'center' }}>
      <div style={{ width:540, background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:18, padding:36, boxShadow:'0 30px 80px rgba(0,0,0,0.6)' }}>
        {stage === 0 && <>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <div className="brand-mark" style={{ width:40, height:40, borderRadius:10 }}><Icon name="drone" size={22} stroke={2} style={{ color:'#0a0f0c' }}/></div>
            <div>
              <div style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text-3)' }}>AeroWatch · v2.6</div>
              <div className="serif" style={{ fontSize:24, lineHeight:1.1 }}>Welcome aboard, Lt. Khan.</div>
            </div>
          </div>
          <p style={{ color:'var(--text-2)', fontSize:14, lineHeight:1.6, margin:'0 0 22px' }}>
            This is your mission console. Before you start, let us know how comfortable you are flying with AeroWatch — we'll adapt the interface to match.
          </p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button className="btn primary" onClick={() => setStage(1)}>Continue <Icon name="arrowRight" size={14}/></button>
          </div>
        </>}
        {stage === 1 && <>
          <div style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:6 }}>Step 2 of 2</div>
          <div className="serif" style={{ fontSize:26, lineHeight:1.1, marginBottom:6 }}>How would you like to start?</div>
          <p style={{ color:'var(--text-2)', fontSize:13.5, lineHeight:1.55, margin:'0 0 22px' }}>You can switch modes at any time from the topbar.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <ChoiceCard icon="sparkle" label="I'm new — Trainee" desc="Simpler layout, step-by-step coaching, key controls only." onClick={() => choose('trainee')} primary/>
            <ChoiceCard icon="zap" label="I'm experienced — Operator" desc="Full console: telemetry strip, advanced map layers, all commands." onClick={() => choose('operator')}/>
          </div>
          <div style={{ marginTop:18, fontSize:12, color:'var(--text-3)', textAlign:'center' }}>
            Press <span className="mono" style={{ padding:'1px 5px', border:'1px solid var(--border)', borderRadius:4 }}>?</span> at any time for shortcuts.
          </div>
        </>}
      </div>
    </div>
  );
}

function ChoiceCard({ icon, label, desc, onClick, primary }: { icon:string; label:string; desc:string; onClick:()=>void; primary?:boolean }) {
  return (
    <button onClick={onClick} style={{ textAlign:'left', padding:16, borderRadius:12, background: primary ? 'var(--accent-faint)' : 'var(--bg-2)', border:`1px solid ${primary ? 'var(--accent)' : 'var(--border)'}`, color:'var(--text)', cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', gap:6 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
      <div style={{ width:32, height:32, borderRadius:8, background: primary ? 'var(--accent)' : 'var(--surface-2)', color: primary ? '#0a0f0c' : 'var(--accent)', display:'grid', placeItems:'center' }}><Icon name={icon} size={16}/></div>
      <div style={{ fontWeight:600, fontSize:14, marginTop:4 }}>{label}</div>
      <div style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.5 }}>{desc}</div>
    </button>
  );
}

const COACH = [
  { sel: '.tele-row', text: 'These are your four vitals. They update live every second.', pos: 'bottom' },
  { sel: '.map-card',  text: 'Tactical map. Your drone is the pulsing dot. Drag to pan.',  pos: 'left'   },
  { sel: '.nav-item',  text: 'Use this menu — or press 1–7 — to switch screens.',          pos: 'right'  },
];

export function Coachmarks() {
  const { coachStep, setCoachStep, trainee, page } = useApp();
  const [rect, setRect] = useState<{top:number;left:number;width:number;height:number}|null>(null);
  const step = COACH[coachStep - 1];
  const visible = trainee && coachStep > 0 && coachStep <= COACH.length && page === 'dashboard';

  useEffect(() => {
    if (!visible) return;
    const measure = () => {
      const el = document.querySelector(step.sel);
      if (el) { const r = el.getBoundingClientRect(); setRect({ top:r.top, left:r.left, width:r.width, height:r.height }); }
    };
    const t = setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [visible, coachStep]);

  if (!visible || !rect) return null;
  const tipPos = step.pos === 'right' ? { left: rect.left + rect.width + 16, top: rect.top }
    : step.pos === 'left' ? { left: rect.left - 320 - 16, top: rect.top + 20 }
    : { left: rect.left, top: rect.top + rect.height + 16 };

  return (
    <>
      <div style={{ position:'fixed', top:rect.top-6, left:rect.left-6, width:rect.width+12, height:rect.height+12, borderRadius:14, boxShadow:'0 0 0 2px var(--accent), 0 0 0 8px rgba(163,197,133,0.25)', zIndex:90, pointerEvents:'none' }}/>
      <div style={{ position:'fixed', ...tipPos as React.CSSProperties, width:300, zIndex:91, background:'var(--card)', border:'1px solid var(--accent)', borderRadius:12, padding:14, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent)', fontFamily:'var(--font-mono)', marginBottom:6 }}>Tip {coachStep} of {COACH.length}</div>
        <div style={{ fontSize:13.5, color:'var(--text)', lineHeight:1.5, marginBottom:12 }}>{step.text}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => setCoachStep(0)} style={{ background:'transparent', border:0, color:'var(--text-3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Skip</button>
          <button className="btn primary" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setCoachStep(s => s >= COACH.length ? 0 : s + 1)}>
            {coachStep === COACH.length ? 'Done' : 'Next'} <Icon name="chevronRight" size={12}/>
          </button>
        </div>
      </div>
    </>
  );
}
