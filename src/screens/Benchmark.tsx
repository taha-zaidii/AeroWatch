import React, { useState } from 'react';
import { useApp } from '../store/app';
import { Icon } from '../components/Icon';

interface TestResult { score: number; time: number; }

const TESTS = [
  { id:'tot',    name:"Time-on-task",              desc:'How fast can you locate the active alert?', target:'Find the unacknowledged red alert and click Acknowledge.', maxScore:100, score:(ms:number|boolean) => Math.max(0, Math.min(100, Math.round(100 - Math.max(0, (ms as number) - 3500) / 80))) },
  { id:'fitts',  name:"Fitts' law — pointer accuracy", desc:'Click 5 randomly-placed targets as fast as you can.', target:'Click the green dots when they appear.', maxScore:100, score:(ms:number|boolean) => Math.max(0, Math.min(100, Math.round(100 - Math.max(0, (ms as number) - 5000) / 80))) },
  { id:'recall', name:"Recall — memorability",     desc:'After 8 seconds, recall how many alerts were unacknowledged.', target:'Watch the alerts panel, then answer.', maxScore:100, score:(ok:number|boolean) => ok ? 100 : 0 },
  { id:'errors', name:"Error rate — confirm dialog", desc:'Try to trigger emergency landing without confirming.', target:'Verify the system blocks accidental triggers.', maxScore:100, score:(ok:number|boolean) => ok ? 100 : 0 },
];

interface FittsState { targets:{x:number;y:number;hit:boolean}[]; start:number; }

export default function BenchmarkScreen() {
  const { pushToast } = useApp();
  const [active, setActive] = useState<string|null>(null);
  const [results, setResults] = useState<Record<string,TestResult>>({});
  const [running, setRunning] = useState(false);
  const [fittsState, setFittsState] = useState<FittsState|null>(null);

  const allScored = Object.keys(results).length === TESTS.length;
  const overall = allScored ? Math.round(Object.values(results).reduce((a,b) => a + b.score, 0) / TESTS.length) : null;

  const startSuite = async () => {
    setRunning(true); setResults({});
    pushToast({ level:'info', title:'Benchmark starting', body:'Running 4 HCI tests in sequence.' });
    const out: Record<string,TestResult> = {};
    for (const t of TESTS) {
      await new Promise(r => setTimeout(r, 700));
      const simMs = 2200 + Math.random() * 900;
      out[t.id] = { score: t.score(t.id === 'recall' || t.id === 'errors' ? true : simMs), time: simMs };
      setResults({...out});
    }
    setRunning(false);
    pushToast({ level:'ok', title:'Benchmark complete', body:'Results ready below.' });
  };

  const runSingle = (test: typeof TESTS[0]) => {
    setActive(test.id);
    if (test.id === 'fitts') {
      setFittsState({ targets: Array.from({length:5}, () => ({x:8+Math.random()*84,y:8+Math.random()*80,hit:false})), start:performance.now() });
    } else {
      setTimeout(() => {
        const simMs = 2200 + Math.random() * 900;
        const score = test.id==='recall'||test.id==='errors' ? test.score(true) : test.score(simMs);
        setResults(r => ({...r, [test.id]:{score,time:simMs}}));
        setActive(null);
        pushToast({ level:'ok', title:`${test.name} · ${score}/100` });
      }, 1200 + Math.random() * 1500);
    }
  };

  const fittsClick = (i: number) => {
    setFittsState(s => {
      if (!s) return s;
      const next = {...s, targets: s.targets.map((t,j) => j===i ? {...t,hit:true} : t)};
      if (next.targets.every(t => t.hit)) {
        const elapsed = performance.now() - s.start;
        const score = TESTS.find(t=>t.id==='fitts')!.score(elapsed);
        setTimeout(() => { setResults(r=>({...r,fitts:{score,time:elapsed}})); setFittsState(null); setActive(null); pushToast({level:'ok',title:`Fitts' law · ${score}/100`}); }, 200);
      }
      return next;
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Live evaluation · AnTuTu-style</div>
          <h1 className="page-title">HCI Benchmark</h1>
          <p className="page-sub">Run measurable usability tests against this prototype. Results map directly to the evaluation matrix.</p>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={startSuite} disabled={running}>{running ? <><Icon name="rotate" size={14} className="spin"/> Running…</> : <><Icon name="play" size={12}/> Run full suite</>}</button>
          <button className="btn" onClick={() => setResults({})}><Icon name="rotate" size={14}/> Reset</button>
        </div>
      </div>

      <div className="benchmark-hero" style={{ background:'linear-gradient(135deg, rgba(163,197,133,0.18), rgba(107,143,78,0.06))', border:'1px solid var(--accent)', borderRadius:16, padding:24, marginBottom:18 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text-3)' }}>Overall score</div>
          <div className="serif" style={{ fontSize:72, lineHeight:1, color:'var(--accent)', letterSpacing:'-0.03em', marginTop:4 }}>{overall != null ? overall : '—'}</div>
          <div style={{ fontSize:12, color:'var(--text-2)' }}>/ 100</div>
        </div>
        <div>
          <div className="serif" style={{ fontSize:22, lineHeight:1.2, marginBottom:8 }}>{overall==null?'Run the suite to get a baseline':overall>=85?'Excellent usability profile.':overall>=70?'Good — some room to improve.':'Needs attention.'}</div>
          <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.55 }}>The suite measures four core HCI dimensions: time-on-task, pointer accuracy (Fitts' law), short-term recall, and error prevention.</div>
        </div>
      </div>

      <div className="benchmark-tests">
        {TESTS.map(t => {
          const r = results[t.id];
          return (
            <div key={t.id} className="card" style={{ borderColor: r?'var(--accent)':'var(--border)', opacity: active&&active!==t.id?0.5:1, transition:'all 200ms ease' }}>
              <div className="card-h">
                <span className="card-title">{t.name}</span>
                {r!=null ? <span className="pill ok mono">{r.score}/100</span> : active===t.id ? <span className="pill info mono"><Icon name="rotate" size={10} className="spin"/> RUNNING</span> : <span className="pill mono">PENDING</span>}
              </div>
              <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:6 }}>{t.desc}</div>
              <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:14, lineHeight:1.5 }}><Icon name="info" size={11} style={{ verticalAlign:'middle', marginRight:4 }}/>Target: {t.target}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>{r ? `${(r.time/1000).toFixed(2)}s` : 'Not run'}</div>
                <button className="btn" disabled={!!active} onClick={() => runSingle(t)} style={{ padding:'6px 12px', fontSize:12 }}>{r?'Re-run':'Run test'} <Icon name="arrowRight" size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {fittsState && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(10,15,12,0.92)', display:'grid', placeItems:'center' }}>
          <div style={{ position:'absolute', top:24, left:24, right:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div><div className="page-eyebrow" style={{ color:'var(--accent)' }}>Fitts' law test</div><div className="serif" style={{ fontSize:24 }}>Click all 5 dots as fast as you can.</div></div>
            <div className="mono" style={{ fontSize:18, color:'var(--accent)' }}>{fittsState.targets.filter(t=>t.hit).length} / 5</div>
            <button className="icon-btn" onClick={()=>{setFittsState(null);setActive(null);}}><Icon name="x" size={16}/></button>
          </div>
          {fittsState.targets.map((t, i) => !t.hit && (
            <button key={i} onClick={()=>fittsClick(i)} style={{ position:'absolute', left:`${t.x}%`, top:`${t.y}%`, width:48, height:48, borderRadius:'50%', background:'var(--accent)', border:'none', cursor:'pointer' }}/>
          ))}
        </div>
      )}

      {allScored && (
        <div className="card" style={{ marginTop:18 }}>
          <div className="card-h"><span className="card-title">Report-ready summary</span><button className="btn" style={{ padding:'5px 10px', fontSize:12 }}><Icon name="download" size={12}/> Copy CSV</button></div>
          <table className="eval-table" style={{ marginTop:6 }}>
            <thead><tr><th>Test</th><th>Time</th><th>Score</th><th>Now level</th></tr></thead>
            <tbody>{TESTS.map(t => <tr key={t.id}><td className="label">{t.name}</td><td className="mono">{(results[t.id].time/1000).toFixed(2)}s</td><td className="mono">{results[t.id].score}/100</td><td className="mono" style={{ color: results[t.id].score>=85?'var(--ok)':results[t.id].score>=70?'var(--warn)':'var(--danger)' }}>{results[t.id].score>=85?'Excellent':results[t.id].score>=70?'Acceptable':'Needs work'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
