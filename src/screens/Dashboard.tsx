import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useAppStore, type Telemetry } from '../store/app';
import { useWeather } from '../hooks/useWeather';
import { weatherCodeInfo } from '../lib/weather';
import { Icon } from '../components/Icon';
import { MissionMap } from '../components/MissionMap';

const fleet = [
  { cs:'AERO-07', role:'Atmospheric survey', model:'Skyhawk X4', battery:78, alt:124, spd:14.2, status:'IN-FLIGHT' },
  { cs:'AERO-12', role:'Cloud profiling',    model:'Skyhawk X4', battery:92, lastFlight:'Last flight 2 h ago', status:'STANDBY' },
  { cs:'AERO-04', role:'Mapping & imagery',  model:'Skyhawk X6', battery:38, lastFlight:'Charging', status:'CHARGING' },
  { cs:'AERO-19', role:'Wind profiling',     model:'Skyhawk X4', battery:71, lastFlight:'Last flight 5 h ago', status:'STANDBY' },
];

function skyKind(t: Telemetry) {
  if (t.precipitation > 0.2) return 'rain';
  if (t.cloudBase < 1200) return 'cloud';
  if (t.humidity < 55) return 'sun';
  return 'partly';
}
function pressureTrend(p: number) { return p > 1018 ? 'High · stable' : p > 1010 ? 'Steady' : p > 1000 ? 'Falling' : 'Low · unstable'; }
function uvLabel(uv: number) { return uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : uv < 11 ? 'Very high' : 'Extreme'; }

export function WeatherIcon({ kind, size = 24 }: { kind: string; size?: number }) {
  const sun = <circle cx="12" cy="12" r="5" fill="#e6a832"/>;
  const cloud = <path d="M7 17 Q3 17 3 13 Q3 10 6 9 Q7 5 11 5 Q15 5 16 9 Q19 9 19 13 Q19 17 15 17 Z" fill="#a8b8c2" stroke="#6b7a85" strokeWidth="0.4"/>;
  const rain = <g stroke="#5a8aab" strokeWidth="1.2" strokeLinecap="round"><line x1="8" y1="18" x2="7" y2="21"/><line x1="12" y1="18" x2="11" y2="21"/><line x1="16" y1="18" x2="15" y2="21"/></g>;
  const snow = <g fill="#8fb2c9"><circle cx="8" cy="19" r="1.1"/><circle cx="12" cy="20" r="1.1"/><circle cx="16" cy="19" r="1.1"/></g>;
  const bolt = <path d="M12 15 L9.5 19.5 L11.5 19.5 L10.5 23 L14.5 18 L12.5 18 L14 15 Z" fill="#e6a832" stroke="#b8801e" strokeWidth="0.3"/>;
  const fog = <g stroke="#9aa8b0" strokeWidth="1.3" strokeLinecap="round" opacity="0.9"><line x1="5" y1="17" x2="17" y2="17"/><line x1="7" y1="20" x2="15" y2="20"/></g>;
  const cloudy = kind === 'cloud' || kind === 'rain' || kind === 'partly' || kind === 'snow' || kind === 'storm';
  return (
    <svg viewBox="0 0 22 24" width={size} height={size}>
      {kind === 'sun' && sun}
      {cloudy && cloud}
      {kind === 'partly' && <circle cx="6" cy="7" r="3" fill="#e6a832"/>}
      {kind === 'rain' && rain}
      {kind === 'snow' && snow}
      {kind === 'storm' && bolt}
      {kind === 'fog' && fog}
    </svg>
  );
}

export default function Dashboard() {
  const { telemetry, pushToast } = useApp();
  const nav = useNavigate();
  const setPage = (id: string) => nav(`/${id}`);
  const [pickedCs, setPickedCs] = useState('AERO-07');
  const [layers, setLayers] = useState({ geofence:true, weather:true, path:true, labels:true });
  const toggleLayer = (k: string) => setLayers(s => ({ ...s, [k]: !(s as any)[k] }));
  const [open, setOpen] = useState({ conditions:true, forecast:true, fleet:true, map:true, flow:true });
  const tog = (k: keyof typeof open) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const [stepDone, setStepDone] = useState({ plan:false, preflight:false, launch:false });
  const fmt = (n: number, d = 1) => Number(n).toFixed(d);

  const { data: wx, isLoading: wxLoading } = useWeather();
  const location = useAppStore(s => s.location);

  // Real hourly forecast from Open-Meteo (next 12 hours)
  const forecast = (wx?.hourly ?? []).slice(1, 13).map(h => {
    const sky = weatherCodeInfo(h.code).sky;
    const ideal = sky !== 'rain' && sky !== 'storm' && sky !== 'snow'
      && h.windGust < 35 && h.precipProb < 30 && h.visibility > 3;
    return {
      time: h.hour, sky,
      temp: Math.round(h.temp),
      wind: Math.round(h.windSpeed),
      precip: Math.round(h.precipProb),
      ideal,
    };
  });

  const flightOk = telemetry.windGust < 35 && telemetry.visibility > 3 && telemetry.precipitation < 1;
  const flightStatus = flightOk
    ? { tone:'ok', label:'Conditions favourable', sub:'All flight parameters within nominal range.' }
    : { tone:'warn', label:'Conditions marginal', sub:'Review wind & visibility before launch.' };

  const Section = ({ id, title, sub, action, open: isOpen, onToggle, children }: any) => (
    <section className={`section ${isOpen ? 'open' : 'closed'}`} data-section={id}>
      <header className="section-h" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e:any)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onToggle();}}}>
        <div className="section-h-l">
          <button className="section-toggle" aria-label={isOpen?'Collapse':'Expand'}><Icon name={isOpen?'chevronDown':'chevronRight'} size={14}/></button>
          <div><h2 className="section-title">{title}</h2>{sub && <div className="section-sub">{sub}</div>}</div>
        </div>
        {action && <div onClick={(e:any)=>e.stopPropagation()} className="section-h-r">{action}</div>}
      </header>
      {isOpen && <div className="section-b">{children}</div>}
    </section>
  );

  return (
    <>
      <div className="ph-wrap">
        <div className="ph-row"><div className="ph-crumbs"><span className="ph-crumb-home">Dashboard</span><Icon name="chevronRight" size={11} style={{ color:'var(--text-3)' }}/><span className="ph-crumb-here">Home</span></div></div>
        <div className="ph-main">
          <div>
            <div className="page-eyebrow">Live · {location.name} · Open-Meteo real-time feed</div>
            <h1 className="page-title">Weather overview</h1>
            <p className="page-sub">A single glance at sky conditions, wind, and your fleet.</p>
          </div>
          <div className="page-actions">
            <button className="btn" onClick={() => setPage('reports')}><Icon name="history" size={14}/> Past flights</button>
            <button className="btn primary" onClick={() => setPage('control')}><Icon name="play" size={13}/> Plan a flight</button>
          </div>
        </div>
      </div>

      <Section id="conditions" title="Current conditions" sub="Live readings from the on-site weather station and aircraft sensors." open={open.conditions} onToggle={() => tog('conditions')}>
        <div className="wx-hero">
          <div className="wx-hero-now">
            <div className="wx-hero-temp"><span className="wx-hero-temp-value">{fmt(telemetry.temperature,0)}</span><span className="wx-hero-temp-unit">°C</span></div>
            <div className="wx-hero-meta">
              <div className="wx-hero-cond"><WeatherIcon kind={wx ? weatherCodeInfo(wx.current.weatherCode).sky : skyKind(telemetry)} size={28}/> {telemetry.conditions}</div>
              <div className="wx-hero-feels">Feels like {fmt(wx?.current.apparentTemperature ?? telemetry.temperature - 1.5, 0)}° · Dew point {fmt(telemetry.dewPoint,0)}°</div>
              <div className="wx-hero-loc">{location.name} · {Math.abs(location.lat).toFixed(2)}° {location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(2)}° {location.lng >= 0 ? 'E' : 'W'}{location.elevation ? ` · ${Math.round(location.elevation)} m ASL` : ''}</div>
            </div>
          </div>
          <div className={`wx-status pill ${flightStatus.tone}`}><span className={`dot ${flightStatus.tone}`}/><div><div className="wx-status-label">{flightStatus.label}</div><div className="wx-status-sub">{flightStatus.sub}</div></div></div>
        </div>
        <div className="wx-grid">
          {[
            {icon:'wind',label:'Wind',value:`${fmt(telemetry.windSpeed,0)}`,unit:'km/h',sub:`${telemetry.windDir} · gust ${fmt(telemetry.windGust,0)}`},
            {icon:'droplet',label:'Humidity',value:`${fmt(telemetry.humidity,0)}`,unit:'%',sub:`Dew ${fmt(telemetry.dewPoint,0)}°C`},
            {icon:'gauge',label:'Pressure',value:`${fmt(telemetry.pressure,0)}`,unit:'hPa',sub:pressureTrend(telemetry.pressure)},
            {icon:'eye',label:'Visibility',value:`${fmt(telemetry.visibility,1)}`,unit:'km',sub:telemetry.visibility>8?'Clear':telemetry.visibility>4?'Hazy':'Reduced'},
            {icon:'sun',label:'UV index',value:`${fmt(telemetry.uvIndex,0)}`,unit:'',sub:uvLabel(telemetry.uvIndex)},
            {icon:'cloud',label:'Ceiling',value:`${Math.floor(telemetry.cloudBase/100)*100}`,unit:'m',sub:telemetry.cloudBase>1500?'High base':'Low base'},
            {icon:'rain',label:'Precip',value:`${fmt(telemetry.precipitation,1)}`,unit:'mm/h',sub:telemetry.precipitation>0?'Active':'None'},
            {icon:'route',label:'Wind heading',value:`${String(Math.round(telemetry.windHeading)).padStart(3,'0')}`,unit:'°',sub:'from'},
          ].map(s => (
            <div key={s.label} className="wx-stat">
              <div className="wx-stat-i"><Icon name={s.icon} size={16}/></div>
              <div className="wx-stat-l">{s.label}</div>
              <div className="wx-stat-v"><span className="wx-stat-num">{s.value}</span><span className="wx-stat-unit">{s.unit}</span></div>
              <div className="wx-stat-s">{s.sub}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="flow" title="What to do next" sub="A simple 3-step path from arming the aircraft to takeoff." open={open.flow} onToggle={() => tog('flow')}>
        <div className="flow-rail">
          {[
            {n:1,title:'Review the weather',body:"You're already here. Confirm wind & visibility are within limits.",done:true,ctaLabel:'Skip',disabledCta:true},
            {n:2,title:'Plan a flight path',body:'Open the control panel, choose a sector, and drop waypoints. Geofence is auto-applied.',done:stepDone.plan,ctaLabel:stepDone.plan?'Re-open plan':'Open planner',onCta:()=>{setStepDone(s=>({...s,plan:true}));setPage('control');}},
            {n:3,title:'Run pre-flight checklist',body:'Verify battery, GPS lock, signal strength, and propeller arming.',done:stepDone.preflight,ctaLabel:stepDone.preflight?'Re-run check':'Run pre-flight',onCta:()=>{setStepDone(s=>({...s,preflight:true}));pushToast({level:'ok',title:'Pre-flight passed',body:'Battery, GPS, signal, and props all green.'});}},
            {n:4,title:'Launch & monitor',body:'Aircraft arms with a confirmation prompt. Watch live telemetry during flight.',done:stepDone.launch,ctaLabel:'Launch',primary:true,disabledCta:!stepDone.preflight,disabledHint:!stepDone.preflight?'Complete pre-flight first':undefined,onCta:()=>{setStepDone(s=>({...s,launch:true}));pushToast({level:'ok',title:'Aircraft armed',body:'AERO-07 cleared for takeoff.'});}},
          ].map(step => (
            <div key={step.n} className={`flow-step ${step.done?'done':''}`}>
              <div className="flow-num">{step.done ? <Icon name="check" size={14}/> : step.n}</div>
              <div className="flow-body"><div className="flow-title">{step.title}</div><div className="flow-text">{step.body}</div></div>
              {step.ctaLabel && <button className={`btn ${step.primary?'primary':''}`} onClick={step.onCta} disabled={step.disabledCta} title={step.disabledHint||''} style={{ fontSize:12 }}>{step.ctaLabel} <Icon name="arrowRight" size={12}/></button>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="forecast" title="Hourly forecast — next 12 hours" sub={`Real forecast for ${location.name} · ideal launch windows are highlighted.`} open={open.forecast} onToggle={() => tog('forecast')}>
        {wxLoading && <div style={{ padding: 24, color: 'var(--text-3)', fontSize: 13 }}>Fetching live forecast…</div>}
        <div className="forecast-strip">
          {forecast.map((h, i) => (
            <div key={i} className={`forecast-cell ${h.ideal?'ideal':''}`}>
              {h.ideal && <div className="forecast-tag">Ideal</div>}
              <div className="forecast-time">{h.time}</div>
              <WeatherIcon kind={h.sky} size={22}/>
              <div className="forecast-temp">{h.temp}°</div>
              <div className="forecast-wind"><Icon name="wind" size={10}/> {h.wind} km/h</div>
              <div className="forecast-rain" style={{ opacity:h.precip>0?1:0.35 }}><Icon name="droplet" size={10}/> {h.precip}%</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="map" title="Weather map & fleet positions" sub="Live precipitation overlay, geofence boundary, and drone positions." open={open.map} onToggle={() => tog('map')} action={<button className="btn" onClick={()=>setPage('wind')} style={{fontSize:12}}><Icon name="wind" size={12}/> Detailed weather →</button>}>
        <div className="map-wrap">
          <MissionMap pickedCs={pickedCs} onPick={cs=>{setPickedCs(cs);pushToast({level:'info',title:`Selected ${cs}`,duration:1800});}} height={460} layers={layers} onLayerChange={toggleLayer}/>
        </div>
      </Section>

      <Section id="fleet" title="Your fleet" sub={`${fleet.length} aircraft · 1 in flight, ${fleet.length-1} on standby`} open={open.fleet} onToggle={() => tog('fleet')} action={<button className="btn" style={{fontSize:12}} onClick={()=>setPage('reports')}><Icon name="history" size={12}/> View history</button>}>
        <div className="fleet-grid">
          {fleet.map(d => {
            const battTone = d.battery > 40 ? 'ok' : d.battery > 20 ? 'warn' : 'danger';
            const statusColor = d.status==='IN-FLIGHT' ? 'var(--ok)' : d.status==='CHARGING' ? 'var(--warn)' : 'var(--text-3)';
            return (
              <button key={d.cs} className={`fleet-card ${pickedCs===d.cs?'picked':''}`} onClick={()=>setPickedCs(d.cs)}>
                <div className="fleet-card-h"><div className="fleet-cs">{d.cs}</div><span className="pill mono" style={{fontSize:9.5,padding:'2px 7px'}}><span className="dot" style={{background:statusColor}}/>{d.status}</span></div>
                <div className="fleet-meta">{d.role} · {d.model}</div>
                <div className="fleet-batt-row"><div className={`fleet-batt-bar ${battTone}`}><div className="fleet-batt-fill" style={{width:`${d.battery}%`}}/></div><div className="fleet-batt-num">{d.battery}%</div></div>
                {d.status==='IN-FLIGHT'
                  ? <div className="fleet-stats"><span><Icon name="trending" size={10}/> {(d as any).alt} m</span><span><Icon name="route" size={10}/> {(d as any).spd} m/s</span></div>
                  : <div className="fleet-stats" style={{color:'var(--text-3)'}}><Icon name="home" size={10}/> {(d as any).lastFlight}</div>}
              </button>
            );
          })}
        </div>
      </Section>
    </>
  );
}
