import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { HCINote } from '../components/Shell';

export default function WindAlertScreen() {
  const { telemetry, alerts, setAlerts, pushToast } = useApp();
  const limit = 45;
  const pct = Math.min(100, (telemetry.windGust / limit) * 100);
  const level = telemetry.windGust >= limit ? 'danger' : telemetry.windGust >= limit * 0.85 ? 'warn' : 'ok';

  const ack = (id: number) => {
    setAlerts(a => a.map(x => x.id === id ? { ...x, acknowledged: true } : x));
    pushToast({ level: 'ok', title: 'Alert acknowledged', body: 'Logged to mission record.' });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Environmental monitoring</div>
          <h1 className="page-title">Wind &amp; Weather</h1>
          <p className="page-sub">Pre-storm signature detection, gust monitoring, and operational threshold alerts.</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="rotate" size={14}/> Refresh</button>
          <button className="btn"><Icon name="download" size={14}/> Export forecast</button>
        </div>
      </div>

      <div className="wind-hero wind-hero-grid" style={{ marginBottom:18, position:'relative' }}>
        <HCINote n={1} top={14} right={14} principle="Visibility & Feedback" label="Wind rose">
          The arrow rotates to current wind heading; gust value updates live.
        </HCINote>
        <div className="wind-rose">
          <span className="label n">N</span><span className="label e">E</span>
          <span className="label s">S</span><span className="label w">W</span>
          <div className="arrow" style={{ transform:`rotate(${30}deg)` }}/>
          <div className="center">
            <div className="mono" style={{ fontSize:34, color:'var(--warn)', lineHeight:1 }}>{telemetry.windGust.toFixed(0)}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', letterSpacing:'0.1em' }}>GUST · KM/H</div>
          </div>
        </div>
        <div>
          <div className="page-eyebrow" style={{ color:'var(--warn)' }}>Caution · approaching gust threshold</div>
          <div className="serif" style={{ fontSize:32, lineHeight:1.1, margin:'8px 0 14px', maxWidth:'40ch' }}>
            Conditions are deteriorating. Recommend completing current waypoint and returning to home.
          </div>
          <div style={{ marginBottom:8, display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-3)' }}>
            <span>0 km/h</span><span>Operational limit · {limit} km/h</span>
          </div>
          <div className="threshold-bar">
            <div className="fill" style={{ width:`${pct}%` }}/>
            <div className="marker" style={{ left:`${(limit/limit)*100 - 1}%`, opacity:0.4 }}/>
            <div className="marker" style={{ left:`calc(${pct}% - 1.5px)` }}/>
          </div>
          <div style={{ marginTop:14, display:'flex', gap:10, alignItems:'center' }}>
            <span className={`pill ${level}`} style={{ textTransform:'uppercase' }}>{level === 'danger' ? 'EXCEEDED' : level === 'warn' ? 'CAUTION' : 'NOMINAL'}</span>
            <span style={{ fontSize:13, color:'var(--text-2)' }}>Sustained {telemetry.windSpeed.toFixed(0)} km/h · gusts {telemetry.windGust.toFixed(0)} km/h · {telemetry.windDir}</span>
          </div>
        </div>
      </div>

      <div className="wind-body-grid">
        <div className="card" style={{ position:'relative' }}>
          <HCINote n={2} top={14} right={14} principle="Error Prevention" label="Active alerts list">
            Each alert shows source, time, and severity. Acknowledge confirms receipt and is logged.
          </HCINote>
          <div className="card-h">
            <span className="card-title">Alert log</span>
            <div className="row" style={{ gap:8 }}>
              <button className="icon-btn"><Icon name="filter" size={14}/></button>
              <span className="pill mono">{alerts.filter(a => !a.acknowledged).length} unacked</span>
            </div>
          </div>
          {alerts.map(a => (
            <div key={a.id} className={`alert-row ${a.level}`}>
              <div className="ic"><Icon name={a.level==='danger'?'warning':a.level==='warn'?'wind':'info'} size={14}/></div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:13.5, fontWeight:500 }}>{a.title}</span>
                  <span className={`pill ${a.level} mono`} style={{ fontSize:10 }}>{a.level.toUpperCase()}</span>
                </div>
                <div style={{ fontSize:12.5, color:'var(--text-2)', marginBottom:4 }}>{a.body}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{a.time} · source: {a.source}</div>
              </div>
              {a.acknowledged
                ? <span className="pill ok mono" style={{ fontSize:10 }}><Icon name="check" size={10}/> ACKED</span>
                : <button className="btn" onClick={() => ack(a.id)} style={{ fontSize:12, padding:'6px 10px' }}>Acknowledge</button>}
            </div>
          ))}
        </div>
        <div className="col" style={{ gap:14 }}>
          {[
            { label:'Cloud cover', v:'72', unit:'%', icon:'cloud', sub:'Heavy cumulus advancing from ENE' },
            { label:'Precipitation', v:'14', unit:'min ETA', icon:'rain', sub:'Light rain expected at 14:32 local' },
            { label:'Visibility', v:'9.4', unit:'km', icon:'eye', sub:'Reduced from 12.1 km · 30 min ago' },
          ].map(t => (
            <div key={t.label} className="weather-tile">
              <div style={{ color:'var(--text-3)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em' }}>{t.label}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span className="mono" style={{ fontSize:28 }}>{t.v}</span><span style={{ color:'var(--text-3)' }}>{t.unit}</span>
                <Icon name={t.icon} size={20} style={{ marginLeft:'auto', color:'var(--text-3)' }}/>
              </div>
              <div style={{ fontSize:12, color:'var(--text-2)' }}>{t.sub}</div>
            </div>
          ))}
          <div className="weather-tile">
            <div style={{ color:'var(--text-3)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em' }}>Pressure trend</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span className="mono" style={{ fontSize:28, color:'var(--danger)' }}>↓ 4.2</span><span style={{ color:'var(--text-3)' }}>hPa/h</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-2)' }}>Falling rapidly — typical pre-storm signature</div>
          </div>
        </div>
      </div>
    </>
  );
}
