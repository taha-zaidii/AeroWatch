import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { HCINote } from '../components/Shell';

function Sparkline({ data, height = 60, color = 'var(--accent)' }: { data: number[]; height?: number; color?: string }) {
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = Math.max(max - min, 1);
  const w = 280, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height }}>
      <defs><linearGradient id="spark2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.4"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#spark2)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

export default function Reports() {
  const { flightLogs } = useApp();
  const [selected, setSelected] = useState(flightLogs[0].id);
  const [range, setRange] = useState('week');
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const flightCounts = [3, 5, 4, 7, 6, 8, 9];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Past 7 days</div>
          <h1 className="page-title">Reports &amp; History</h1>
          <p className="page-sub">Mission logs, performance metrics, and aircraft health trends.</p>
        </div>
        <div className="page-actions">
          <div style={{ display:'flex', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r-2)', padding:2 }}>
            {['day','week','month'].map(r => (
              <button key={r} onClick={() => setRange(r)} className="btn" style={{ padding:'6px 12px', fontSize:12, textTransform:'capitalize', background:range===r?'var(--card)':'transparent', border:0, borderRadius:6 }}>{r}</button>
            ))}
          </div>
          <button className="btn"><Icon name="download" size={14}/> Export CSV</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:20 }}>
        {[{label:'Total flights',v:'42',trend:'+8',sub:'vs last week',icon:'drone',tone:'accent'},{label:'Flight hours',v:'38.4',trend:'+12%',sub:'vs last week',icon:'clock',tone:'accent'},{label:'Success rate',v:'96%',trend:'+2%',sub:'vs last week',icon:'check',tone:'ok'},{label:'Aborted',v:'2',trend:'-1',sub:'vs last week',icon:'warning',tone:'warn'}].map(c => {
          const tc = c.tone==='ok'?'var(--ok)':c.tone==='warn'?'var(--warn)':'var(--accent)';
          const tf = c.tone==='ok'?'var(--ok-faint)':c.tone==='warn'?'var(--warn-faint)':'var(--accent-faint)';
          return (
            <div key={c.label} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div><div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.12em' }}>{c.label}</div><div className="mono" style={{ fontSize:32, lineHeight:1.1, marginTop:6 }}>{c.v}</div></div>
                <div style={{ width:36, height:36, borderRadius:10, background:tf, color:tc, display:'grid', placeItems:'center' }}><Icon name={c.icon} size={18}/></div>
              </div>
              <div style={{ marginTop:8, fontSize:12, color:'var(--text-2)' }}><span style={{ color: c.trend.startsWith('-')?'var(--danger)':'var(--ok)', fontWeight:500 }}>{c.trend}</span> {c.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, marginBottom:18 }}>
        <div className="card" style={{ position:'relative' }}>
          <HCINote n={1} top={14} right={14} principle="Visual Hierarchy" label="Today highlighted">
            Today's bar uses the accent color while past days fade — the eye instantly knows where the present is.
          </HCINote>
          <div className="card-h"><span className="card-title">Daily flights · last 7 days</span><span className="pill mono">avg 6.0 / day</span></div>
          <div className="bar-chart">
            {flightCounts.map((c,i) => (
              <div key={i} className={`bar ${i===6?'':'muted'}`} style={{ height:`${(c/10)*100}%` }}>
                <span className="label">{days[i]}</span>
                <span style={{ position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)', fontSize:10.5, color:'var(--text-2)' }} className="mono">{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><span className="card-title">Performance score</span><span className="pill ok mono">93 AVG</span></div>
          <Sparkline data={[88,90,87,92,89,94,93,96,91,93]} height={130}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14 }}>
            {[{l:'Battery efficiency',v:'91%'},{l:'Path accuracy',v:'98%'},{l:'On-time arrivals',v:'94%'}].map(m => (
              <div key={m.l} style={{ background:'var(--bg-2)', padding:'10px 12px', borderRadius:8 }}>
                <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{m.l}</div>
                <div className="mono" style={{ fontSize:16, marginTop:3 }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding:0, position:'relative' }}>
        <HCINote n={2} top={14} right={14} principle="Consistency" label="Tabular log">
          Columns and pill colors match those used elsewhere — pilots learn the vocabulary once and reuse it everywhere.
        </HCINote>
        <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span className="card-title">Flight log</span>
          <div className="row" style={{ gap:8 }}>
            <div className="topbar-search" style={{ width:240 }}><Icon name="search" size={13}/><input placeholder="Search by mission, pilot…"/></div>
            <button className="icon-btn"><Icon name="filter" size={14}/></button>
          </div>
        </div>
        <div>
          <div className="flight-row head"><span>Mission</span><span>Date / Pilot</span><span>Duration</span><span>Distance</span><span>Max alt</span><span>Status</span><span>Score</span><span></span></div>
          {flightLogs.map(f => (
            <div key={f.id} className="flight-row" style={{ cursor:'pointer', background: selected===f.id?'var(--bg-2)':'transparent' }} onClick={() => setSelected(f.id)}>
              <span className="mono" style={{ color:'var(--accent)' }}>{f.id}</span>
              <span><div>{f.date}</div><div style={{ fontSize:11, color:'var(--text-3)' }}>{f.pilot}</div></span>
              <span className="mono">{f.duration}</span>
              <span className="mono">{f.dist} km</span>
              <span className="mono">{f.max_alt} m</span>
              <span><span className={`pill mono ${f.status==='completed'?'ok':f.status==='in-progress'?'info':f.status==='aborted'?'danger':''}`} style={{ fontSize:10 }}>{f.status.toUpperCase()}</span></span>
              <span className="mono" style={{ color: f.score==null?'var(--text-3)':f.score>=90?'var(--ok)':f.score>=70?'var(--warn)':'var(--danger)' }}>{f.score==null?'—':f.score}</span>
              <Icon name="chevronRight" size={14} style={{ color:'var(--text-3)' }}/>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
