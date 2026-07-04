import React from 'react';
import { useApp, useAppStore } from '../store/app';
import { useWeather } from '../hooks/useWeather';
import { Icon } from '../components/Icon';
import { HCINote } from '../components/Shell';

export default function WindAlertScreen() {
  const { telemetry, alerts, setAlerts, pushToast } = useApp();
  const location = useAppStore(s => s.location);
  const { data: wx } = useWeather();
  const limit = 45;
  const pct = Math.min(100, (telemetry.windGust / limit) * 100);
  const level = telemetry.windGust >= limit ? 'danger' : telemetry.windGust >= limit * 0.85 ? 'warn' : 'ok';

  // Derived live metrics from the real hourly feed
  const cloudCover = wx ? Math.round(wx.current.cloudCover) : null;
  const rainHour = wx?.hourly.find(h => h.precipProb >= 50 || h.precip >= 0.2);
  const rainEtaH = rainHour && wx ? Math.max(0, wx.hourly.indexOf(rainHour)) : null;
  const visNow = wx?.hourly[0]?.visibility ?? telemetry.visibility;
  const vis3h = wx?.hourly[2]?.visibility;
  // Pressure tendency over the next 3 forecast hours (hPa/h)
  const pressureTrend = wx && wx.hourly.length > 3
    ? (wx.hourly[3].pressure - wx.hourly[0].pressure) / 3
    : 0;
  const trendDown = pressureTrend < -0.5;

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
          <div className="arrow" style={{ transform:`rotate(${Math.round(telemetry.windHeading)}deg)`, transition:'transform 1.2s ease' }}/>
          <div className="center">
            <div className="mono" style={{ fontSize:34, color:'var(--warn)', lineHeight:1 }}>{telemetry.windGust.toFixed(0)}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', letterSpacing:'0.1em' }}>GUST · KM/H</div>
          </div>
        </div>
        <div>
          <div className="page-eyebrow" style={{ color: level==='ok' ? 'var(--ok)' : level==='warn' ? 'var(--warn)' : 'var(--danger)' }}>
            {level==='ok' ? `Nominal · winds within limits at ${location.name}` : level==='warn' ? 'Caution · approaching gust threshold' : 'Exceeded · gusts above operational limit'}
          </div>
          <div className="serif" style={{ fontSize:32, lineHeight:1.1, margin:'8px 0 14px', maxWidth:'40ch' }}>
            {level==='ok'
              ? 'Winds are within operational limits. Conditions support normal flight operations.'
              : level==='warn'
              ? 'Conditions are deteriorating. Recommend completing current waypoint and returning to home.'
              : 'Gusts exceed the operational limit. Land immediately or hold at safe altitude.'}
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
            { label:'Cloud cover', v: cloudCover !== null ? String(cloudCover) : '—', unit:'%', icon:'cloud',
              sub: cloudCover === null ? 'Awaiting live feed…' : cloudCover > 80 ? 'Overcast — expect reduced light' : cloudCover > 40 ? 'Broken cloud layer' : 'Mostly clear skies' },
            { label:'Precipitation', v: rainEtaH === null ? 'None' : rainEtaH === 0 ? 'Now' : `${rainEtaH}`, unit: rainEtaH !== null && rainEtaH > 0 ? 'h ETA' : '', icon:'rain',
              sub: rainEtaH === null ? 'No rain signal in the next 48 h' : rainEtaH === 0 ? 'Precipitation in progress at site' : `Rain likely around ${rainHour!.hour} local` },
            { label:'Visibility', v: visNow.toFixed(1), unit:'km', icon:'eye',
              sub: vis3h !== undefined ? (vis3h > visNow ? `Improving to ${vis3h.toFixed(1)} km within 3 h` : vis3h < visNow ? `Dropping to ${vis3h.toFixed(1)} km within 3 h` : 'Holding steady over the next 3 h') : 'Live from forecast model' },
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
              <span className="mono" style={{ fontSize:28, color: trendDown ? 'var(--danger)' : 'var(--ok)' }}>
                {pressureTrend > 0 ? '↑' : pressureTrend < 0 ? '↓' : '→'} {Math.abs(pressureTrend).toFixed(1)}
              </span><span style={{ color:'var(--text-3)' }}>hPa/h</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-2)' }}>
              {trendDown ? 'Falling — watch for destabilising conditions' : pressureTrend > 0.5 ? 'Rising — conditions stabilising' : 'Steady over the next 3 hours'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
