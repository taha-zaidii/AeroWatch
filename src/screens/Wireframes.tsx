import React from 'react';

export default function Wireframes() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Task 1 · Low-fidelity design</div>
          <h1 className="page-title">Wireframes</h1>
          <p className="page-sub">Pen-and-paper-style wireframes produced before high-fidelity design. They establish layout, hierarchy, and the spatial vocabulary later refined in the live prototype.</p>
        </div>
      </div>
      <div className="wf-grid">
        <WFCard title="Login" tag="Sign-in to console">
          <WfBox>AeroWatch — logo</WfBox>
          <WfBox>Username field</WfBox>
          <WfBox>Password field · 👁</WfBox>
          <div style={{ display:'flex', gap:8 }}><WfBox style={{ flex:1 }}>☐ Remember me</WfBox><WfBox style={{ flex:1 }}>Forgot?</WfBox></div>
          <WfBox style={{ background:'#cfe9f7', textAlign:'center', fontWeight:700 }}>→ Continue</WfBox>
          <WfNote>2FA hint · encrypted channel</WfNote>
        </WFCard>
        <WFCard title="Dashboard" tag="Telemetry + map">
          <div style={{ display:'flex', gap:6 }}>{['BAT','ALT','SPD','SIG'].map(s=><WfBox key={s} style={{ flex:1, textAlign:'center' }}>{s}</WfBox>)}</div>
          <div style={{ display:'flex', gap:6, flex:1 }}>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}><WfBox>Mission info</WfBox><WfBox>Alerts (3)</WfBox></div>
            <div style={{ flex:1.6, border:'1.2px dashed #555', borderRadius:6, display:'grid', placeItems:'center', minHeight:140, fontSize:18 }}>MAP · UAV pin</div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}><WfBox>Alt graph</WfBox><WfBox>Weather</WfBox></div>
          </div>
          <WfNote>Always-visible vitals · live tick</WfNote>
        </WFCard>
        <WFCard title="Wind & Weather" tag="Storm warnings">
          <WfBox style={{ textAlign:'center', fontSize:18 }}>⊙ Wind rose · gust 41</WfBox>
          <WfBox style={{ background:'#fce6c7' }}>⚠ Gust threshold bar →→→</WfBox>
          <WfBox>• Pre-storm signature detected</WfBox>
          <WfBox>• Gusts approaching limit</WfBox>
          <WfBox>• Geofence updated · ✓ acked</WfBox>
          <WfNote>Color = severity · Ack button per row</WfNote>
        </WFCard>
        <WFCard title="Control Panel" tag="Commands + emergency">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <WfBox style={{ textAlign:'center' }}>⏻ Arm</WfBox>
            <WfBox style={{ textAlign:'center' }}>⏸ Pause</WfBox>
            <WfBox style={{ textAlign:'center' }}>⌂ RTH</WfBox>
            <WfBox style={{ textAlign:'center', background:'#f9c8c8' }}>⚠ EMERGENCY LAND</WfBox>
          </div>
          <WfBox style={{ textAlign:'center', minHeight:60 }}>◉ Joystick</WfBox>
          <WfBox>Waypoints 1–4</WfBox>
          <WfNote>Destructive → confirm modal</WfNote>
        </WFCard>
        <WFCard title="Reports" tag="History + graphs">
          <div style={{ display:'flex', gap:6 }}>{['42','38h','96%','2 abort'].map(s=><WfBox key={s} style={{ flex:1, textAlign:'center' }}>{s}</WfBox>)}</div>
          <WfBox style={{ textAlign:'center', minHeight:60 }}>📊 Bar chart · 7 days</WfBox>
          <WfBox>Flight log table — rows…</WfBox>
          <WfBox>───────────────</WfBox>
          <WfNote>Today highlighted · sortable cols</WfNote>
        </WFCard>
        <WFCard title="Confirm dialog" tag="Error prevention">
          <WfBox style={{ textAlign:'center', fontSize:18, padding:'14px' }}>⚠</WfBox>
          <WfBox><b>Initiate emergency landing?</b></WfBox>
          <WfBox style={{ fontSize:13 }}>UAV will descend immediately. Cannot be undone.</WfBox>
          <div style={{ display:'flex', gap:6 }}><WfBox style={{ flex:1, textAlign:'center' }}>Cancel</WfBox><WfBox style={{ flex:1, textAlign:'center', background:'#f9c8c8', fontWeight:700 }}>Yes, land</WfBox></div>
          <WfNote>Default = Cancel · Esc dismisses</WfNote>
        </WFCard>
      </div>
    </>
  );
}

function WFCard({ title, tag, children }: { title:string; tag:string; children:React.ReactNode }) {
  return <div className="wf-card"><h3>{title}</h3><div className="wf-tag">{tag}</div><div className="wf-frame">{children}</div></div>;
}
function WfBox({ children, style }: { children:React.ReactNode; style?: React.CSSProperties }) {
  return <div className="wf-box" style={style}>{children}</div>;
}
function WfNote({ children }: { children:React.ReactNode }) {
  return <div style={{ fontSize:14, color:'#7a6a4a', marginTop:6, paddingLeft:6, borderLeft:'2px solid #c9b97a' }}>↳ {children}</div>;
}
