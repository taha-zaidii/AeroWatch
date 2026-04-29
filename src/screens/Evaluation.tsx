import React from 'react';
import { Icon } from '../components/Icon';

export default function Evaluation() {
  const rows = [
    { attr:'Task completion time — login → arm motors',   method:'User testing (n=12)', now:'14 s',   plan:'8 s',    delta:'−43%' },
    { attr:'Task completion time — locate active alert',  method:'User testing',        now:'6 s',    plan:'3 s',    delta:'−50%' },
    { attr:'Error rate — accidental emergency landing',   method:'Heuristic + testing', now:'4%',     plan:'<1%',    delta:'−75%' },
    { attr:'Learnability — first-flight setup',           method:'Think-aloud',         now:'11 min', plan:'5 min',  delta:'−55%' },
    { attr:'Memorability — return after 1 week',          method:'Recall test',         now:'72%',    plan:'90%',    delta:'+25%' },
    { attr:'Satisfaction — SUS score',                    method:'SUS survey',          now:'68',     plan:'85',     delta:'+17 pt' },
    { attr:'Accessibility — WCAG AA contrast',            method:'Automated audit',     now:'88%',    plan:'100%',   delta:'+12%' },
    { attr:'Alert acknowledgement latency',               method:'Log analysis',        now:'9 s',    plan:'4 s',    delta:'−56%' },
  ];
  const principles = [
    { name:'Usability — Efficiency',   icon:'zap',      body:'Telemetry strip + keyboard accelerators (1–7) let trained operators move between screens without touching the mouse.' },
    { name:'Usability — Learnability', icon:'sparkle',  body:'Conventional layouts (sidebar nav, top bar, table list) and consistent vocabulary (pills, KV rows) flatten the learning curve.' },
    { name:'Feedback',                 icon:'bell',     body:'Toasts on every command, live telemetry tick, pulsing dot for unacknowledged alerts, loading spinner on auth.' },
    { name:'Consistency',              icon:'layout',   body:'Same color tokens, the same pill component, and the same card shell are reused across all screens.' },
    { name:'Error Prevention',         icon:'shield',   body:'All destructive commands (Emergency, RTH, Disarm) require a confirm dialog whose default is Cancel.' },
    { name:'Visual Hierarchy',         icon:'trending', body:'Display serif for screen titles, mono for numbers, muted small caps for section labels.' },
    { name:'Accessibility',            icon:'eye',      body:'WCAG-AA contrast on dark theme, focus rings, semantic ARIA roles, keyboard navigation.' },
    { name:'Pointer / Hot-spot',       icon:'compass',  body:'Cursor changes on joystick, 36px+ hit targets on icon buttons, and clear hover states everywhere.' },
    { name:'Keyboard Accelerators',    icon:'list',     body:'Numeric shortcuts to switch screens, A/P/H/⇧E to issue commands, ⌘K opens search, E toggles annotations.' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Task 4 · Usability evaluation</div>
          <h1 className="page-title">Usability Evaluation Plan</h1>
          <p className="page-sub">A summary of how AeroWatch will be evaluated, the HCI principles it embodies, and the measurable improvements targeted.</p>
        </div>
        <button className="btn"><Icon name="download" size={14}/> Export PDF</button>
      </div>

      <div className="card" style={{ padding:0, marginBottom:18 }}>
        <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div><div className="card-title">Sample evaluation matrix</div><div className="card-sub" style={{ marginTop:4 }}>Now-level vs planned-level across eight measurable usability attributes</div></div>
          <span className="pill info mono">8 ATTRIBUTES</span>
        </div>
        <table className="eval-table">
          <thead><tr><th>Attribute</th><th>Method</th><th>Now</th><th>Planned</th><th>Δ</th></tr></thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i}>
                <td className="label">{r.attr}</td>
                <td style={{ color:'var(--text-2)' }}>{r.method}</td>
                <td className="mono">{r.now}</td>
                <td className="mono" style={{ color:'var(--accent)' }}>{r.plan}</td>
                <td className="gain">{r.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom:14, fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.16em' }}>HCI principles applied</div>
      <div className="principle-grid" style={{ marginBottom:18 }}>
        {principles.map(p => (
          <div key={p.name} className="principle">
            <div className="ic"><Icon name={p.icon} size={16}/></div>
            <div className="name">{p.name}</div>
            <div className="body">{p.body}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-h"><span className="card-title">Evaluation methodology</span><span className="pill mono">3 PHASES</span></div>
        <ol style={{ margin:0, paddingLeft:18, color:'var(--text-2)', lineHeight:1.65, fontSize:13.5 }}>
          <li><b style={{ color:'var(--text)' }}>Heuristic evaluation</b> — three evaluators inspect the prototype against Nielsen's 10 heuristics. Severity ratings 0–4.</li>
          <li><b style={{ color:'var(--text)' }}>Moderated user testing</b> — 12 participants complete 6 representative tasks. Time-on-task and error count recorded. Think-aloud protocol.</li>
          <li><b style={{ color:'var(--text)' }}>Post-task survey</b> — System Usability Scale (SUS) + custom 5-point items on confidence, alert clarity, and command discoverability.</li>
        </ol>
      </div>
    </>
  );
}
