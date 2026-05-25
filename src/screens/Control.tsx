import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { HCINote } from '../components/Shell';

interface ConfirmState {
  title: string; body: string; danger?: boolean;
  confirmLabel: string; onConfirm: () => void;
}

export default function ControlPanel() {
  const { telemetry, setTelemetry, pushToast } = useApp();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [armed, setArmed] = useState(true);
  const [recording, setRecording] = useState(true);
  const [autoLand, setAutoLand] = useState(false);

  const askEmergency = () => setConfirm({ title:'Initiate emergency landing?', body:'AERO-07 will immediately abort the current waypoint and descend to the nearest safe landing zone.', danger:true, confirmLabel:'Yes, land now', onConfirm:() => { setTelemetry(t => ({...t, status:'EMERGENCY'})); pushToast({ level:'danger', title:'Emergency landing engaged', body:'AERO-07 descending to LZ-A.' }); } });
  const askRTH = () => setConfirm({ title:'Return to home?', body:'AERO-07 will navigate back to HOME at 80 m altitude. Mission will pause and can be resumed.', confirmLabel:'Confirm RTH', onConfirm:() => { setTelemetry(t => ({...t, status:'RETURN'})); pushToast({ level:'info', title:'Return-to-home initiated', body:'ETA 4 min 12 s.' }); } });
  const askArm = () => setConfirm({ title: armed ? 'Disarm motors?' : 'Arm motors?', body: armed ? 'Motors will spin down. UAV must be on the ground.' : 'Pre-flight checklist will run. Ensure 5 m clearance.', confirmLabel: armed ? 'Disarm' : 'Arm', onConfirm:() => { setArmed(v => !v); pushToast({ level:'ok', title: armed ? 'Motors disarmed' : 'Motors armed' }); } });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Mission · {telemetry.missionId}</div>
          <h1 className="page-title">Control Panel</h1>
          <p className="page-sub">Direct flight commands, navigation, and emergency response. Destructive actions require explicit confirmation.</p>
        </div>
        <div className="page-actions">
          <span className="pill ok mono"><span className="dot ok"/>LINK STRONG · {telemetry.signal.toFixed(0)}%</span>
          <span className="pill mono">ARMED</span>
        </div>
      </div>

      <div className="control-grid">
        <div className="col" style={{ gap:18 }}>
          <div className="card" style={{ position:'relative' }}>
            <HCINote n={1} top={14} right={14} principle="Error Prevention" label="Confirmation dialogs">
              All flight-state-changing commands route through a confirmation dialog. Destructive actions use a red confirm button; safe ones default to gray Cancel.
            </HCINote>
            <div className="card-h">
              <span className="card-title">Primary commands</span>
              <span className="card-sub">Press keyboard shortcuts for quick access</span>
            </div>
            <div className="control-primary">
              <button className="cmd-btn ok" onClick={askArm}><span className="kbd-tip">A</span><div className="cmd-icon"><Icon name="power" size={20}/></div><div className="cmd-label">{armed ? 'Disarm motors' : 'Arm motors'}</div><div className="cmd-sub">{armed ? 'Currently armed' : 'Ready for takeoff'}</div></button>
              <button className="cmd-btn" onClick={() => pushToast({level:'info', title: telemetry.status==='IN-FLIGHT' ? 'Mission paused' : 'Mission resumed'})}><span className="kbd-tip">P</span><div className="cmd-icon"><Icon name={telemetry.status==='IN-FLIGHT' ? 'pause' : 'play'} size={20}/></div><div className="cmd-label">{telemetry.status==='IN-FLIGHT' ? 'Pause mission' : 'Resume mission'}</div><div className="cmd-sub">Hold position</div></button>
              <button className="cmd-btn warn" onClick={askRTH}><span className="kbd-tip">H</span><div className="cmd-icon"><Icon name="home" size={20}/></div><div className="cmd-label">Return to home</div><div className="cmd-sub">Auto-navigate to HOME</div></button>
              <button className="cmd-btn danger" onClick={askEmergency}><span className="kbd-tip">⇧E</span><div className="cmd-icon"><Icon name="warning" size={20}/></div><div className="cmd-label">Emergency landing</div><div className="cmd-sub">Immediate descent</div></button>
            </div>
          </div>
          <div className="card">
            <div className="card-h"><span className="card-title">Secondary controls</span></div>
            <div className="control-secondary">
              <ToggleRow label="Recording" desc="4K · 30fps" active={recording} onChange={() => setRecording(v => !v)} icon="cam"/>
              <ToggleRow label="Auto-land on low battery" desc="Trigger at 18%" active={autoLand} onChange={() => setAutoLand(v => !v)} icon="battery"/>
              <ToggleRow label="Obstacle avoidance" desc="Stereo + LiDAR" active onChange={() => {}} icon="shield"/>
            </div>
          </div>
        </div>

        <div className="col" style={{ gap:18 }}>
          <div className="card" style={{ position:'relative' }}>
            <HCINote n={2} top={14} right={14} principle="Mapping & Pointer Design" label="Virtual joystick">
              Movement maps directly to UAV translation in world space (north up). Cursor changes to grab/grabbing on hover.
            </HCINote>
            <div className="card-h">
              <span className="card-title">Manual control</span>
              <span className="pill mono">MODE · POSITION</span>
            </div>
            <div className="joystick"><div className="ring"/><div className="axis-x"/><div className="axis-y"/><div className="knob"/></div>
            <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
              {(['Throttle','Yaw','Pitch','Roll'] as const).map((k,i) => (
                <div key={k} style={{ textAlign:'center', background:'var(--bg-2)', padding:'8px 6px', borderRadius:8 }}>
                  <div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{k}</div>
                  <div className="mono" style={{ fontSize:14, marginTop:3 }}>{[68,3,7,-2][i]}{i===0?'%':'°'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-h">
              <span className="card-title">Waypoints</span>
              <button className="btn" style={{ padding:'5px 10px', fontSize:12 }}><Icon name="plus" size={12}/> Add</button>
            </div>
            {[{n:1,name:'WP-01 · Survey start',d:'1.2 km',alt:'80 m',done:true},{n:2,name:'WP-02 · Grid scan A',d:'2.4 km',alt:'120 m',done:true},{n:3,name:'WP-03 · Grid scan B',d:'4.1 km',alt:'120 m',done:false,active:true},{n:4,name:'WP-04 · RTH',d:'6.4 km',alt:'80 m',done:false}].map(w => (
              <div key={w.n} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:11, background:w.done?'var(--ok-faint)':w.active?'var(--accent-faint)':'var(--bg-2)', color:w.done?'var(--ok)':w.active?'var(--accent)':'var(--text-3)', border:w.active?'1px solid var(--accent)':'1px solid transparent', fontFamily:'var(--font-mono)' }}>
                  {w.done ? <Icon name="check" size={12}/> : w.n}
                </div>
                <div style={{ flex:1 }}><div style={{ fontSize:13 }}>{w.name}</div><div style={{ fontSize:11, color:'var(--text-3)' }} className="mono">{w.d} · {w.alt}</div></div>
                {w.active && <span className="pill info mono" style={{ fontSize:10 }}>EN ROUTE</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <div style={{ width:32, height:32, borderRadius:8, background: confirm.danger ? 'var(--danger-faint)' : 'var(--accent-faint)', color: confirm.danger ? 'var(--danger)' : 'var(--accent)', display:'grid', placeItems:'center' }}><Icon name="warning" size={16}/></div>
              <div style={{ fontWeight:600, fontSize:15 }}>{confirm.title}</div>
            </div>
            <div className="modal-b">{confirm.body}</div>
            <div className="modal-f">
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className={`btn ${confirm.danger ? 'danger' : 'primary'}`} onClick={() => { confirm.onConfirm(); setConfirm(null); }} autoFocus>{confirm.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({ label, desc, active, onChange, icon }: { label:string; desc:string; active:boolean; onChange:()=>void; icon:string }) {
  return (
    <button onClick={onChange} className="cmd-btn" style={{ minHeight:'auto', padding:'14px 12px', alignItems:'flex-start', textAlign:'left' }}>
      <div style={{ display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center' }}>
        <Icon name={icon} size={16} style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}/>
        <div style={{ width:32, height:18, borderRadius:100, background: active ? 'var(--accent)' : 'var(--border)', position:'relative', transition:'all 140ms' }}>
          <div style={{ position:'absolute', top:2, left: active ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'all 140ms' }}/>
        </div>
      </div>
      <div className="cmd-label" style={{ fontSize:13 }}>{label}</div>
      <div className="cmd-sub">{desc}</div>
    </button>
  );
}
