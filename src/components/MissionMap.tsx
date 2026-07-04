import React, { useCallback, useEffect, useRef, useState } from 'react';
import { aStar, haversine, type Point } from '../lib/astar';
import { useAppStore } from '../store/app';
import { Icon } from './Icon';

const TILE = 256;
const lngToX = (lng: number, z: number) => ((lng + 180) / 360) * Math.pow(2, z) * TILE;
const latToY = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z) * TILE;
};
const xToLng = (x: number, z: number) => (x / (Math.pow(2, z) * TILE)) * 360 - 180;
const yToLat = (y: number, z: number) => {
  const n = Math.PI - (2 * Math.PI * y) / (Math.pow(2, z) * TILE);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

const HOME = { lat: 33.7444, lng: 73.0479 };
const GEOFENCE_M = 1200;

/** Simulated convective cells, anchored in geography (meters radius). */
const STORM_CELLS = [
  { lat: 33.7550, lng: 73.0600, r: 520 },
  { lat: 33.7380, lng: 73.0440, r: 330 },
];

const M_PER_DEG_LAT = 111111;
const mPerDegLng = (lat: number) => M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

/**
 * Plans a storm-avoiding route from HOME through every waypoint using A*
 * over a 72×72 cost grid: cells inside a storm core or outside the
 * geofence are impassable; storm fringes carry a soft penalty so paths
 * keep a healthy margin.
 */
function planSafeRoute(waypoints: { lat: number; lng: number }[]) {
  const N = 72;
  const halfLat = (GEOFENCE_M * 1.25) / M_PER_DEG_LAT;
  const halfLng = (GEOFENCE_M * 1.25) / mPerDegLng(HOME.lat);
  const lat0 = HOME.lat - halfLat, lng0 = HOME.lng - halfLng;
  const dLat = (2 * halfLat) / N, dLng = (2 * halfLng) / N;

  const cellLat = (y: number) => lat0 + (y + 0.5) * dLat;
  const cellLng = (x: number) => lng0 + (x + 0.5) * dLng;
  const toCell = (p: { lat: number; lng: number }): Point => ({
    x: Math.max(0, Math.min(N - 1, Math.floor((p.lng - lng0) / dLng))),
    y: Math.max(0, Math.min(N - 1, Math.floor((p.lat - lat0) / dLat))),
  });

  const cost = (x: number, y: number): number => {
    const lat = cellLat(y), lng = cellLng(x);
    if (haversine(lat, lng, HOME.lat, HOME.lng) > GEOFENCE_M) return Infinity;
    for (const cell of STORM_CELLS) {
      const d = haversine(lat, lng, cell.lat, cell.lng);
      if (d < cell.r) return Infinity;
      if (d < cell.r * 1.55) return 6; // fringe penalty: keep a margin
    }
    return 1;
  };

  const stops = [HOME, ...waypoints];
  const route: { lat: number; lng: number }[] = [];
  let lengthM = 0;
  for (let i = 0; i + 1 < stops.length; i++) {
    const seg = aStar(toCell(stops[i]), toCell(stops[i + 1]), { width: N, height: N, cost });
    if (!seg) return null;
    const geoSeg = seg.map((c) => ({ lat: cellLat(c.y), lng: cellLng(c.x) }));
    for (let j = 1; j < geoSeg.length; j++) {
      lengthM += haversine(geoSeg[j - 1].lat, geoSeg[j - 1].lng, geoSeg[j].lat, geoSeg[j].lng);
    }
    route.push(...(i === 0 ? geoSeg : geoSeg.slice(1)));
  }
  return { route, lengthM };
}

const INITIAL_DRONES = [
  { cs: 'AERO-07', lat: 33.7470, lng: 73.0500, alt: 124, hdg: 47,  spd: 14, role: 'survey',  own: true,  battery: 78 },
  { cs: 'AERO-12', lat: 33.7395, lng: 73.0410, alt: 96,  hdg: 312, spd: 11, role: 'patrol',  own: false, battery: 82 },
  { cs: 'AERO-04', lat: 33.7530, lng: 73.0560, alt: 168, hdg: 95,  spd: 18, role: 'mapping', own: false, battery: 64 },
  { cs: 'AERO-19', lat: 33.7370, lng: 73.0530, alt: 112, hdg: 200, spd: 13, role: 'patrol',  own: false, battery: 71 },
  { cs: 'AERO-23', lat: 33.7510, lng: 73.0420, alt: 144, hdg: 270, spd: 16, role: 'relay',   own: false, battery: 88 },
  { cs: 'AERO-31', lat: 33.7430, lng: 73.0570, alt: 88,  hdg: 145, spd: 9,  role: 'survey',  own: false, battery: 55 },
];

const INITIAL_WAYPOINTS = [
  { id: 'wp-1', lat: 33.7460, lng: 73.0490 },
  { id: 'wp-2', lat: 33.7488, lng: 73.0522 },
  { id: 'wp-3', lat: 33.7505, lng: 73.0498 },
  { id: 'wp-4', lat: 33.7475, lng: 73.0455 },
];

interface Layers { geofence: boolean; weather: boolean; path: boolean; labels: boolean; }
interface MissionMapProps {
  pickedCs: string; onPick: (cs: string) => void;
  height?: number; layers: Layers; onLayerChange: (k: string) => void;
}

export function MissionMap({ pickedCs, onPick, height = 520, layers, onLayerChange }: MissionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(HOME);
  const [zoom, setZoom] = useState(15);
  const [size, setSize] = useState({ w: 800, h: height });
  const [cursor, setCursor] = useState('grab');
  const [drones, setDrones] = useState(INITIAL_DRONES);
  const [waypoints, setWaypoints] = useState(INITIAL_WAYPOINTS);
  const [trails] = useState<Record<string, {lat:number;lng:number}[]>>(() => {
    const t: Record<string, {lat:number;lng:number}[]> = {};
    INITIAL_DRONES.forEach(d => { t[d.cs] = [{ lat: d.lat, lng: d.lng }]; });
    return t;
  });
  const [readout, setReadout] = useState<{lat:number;lng:number}|null>(null);
  const [editMode, setEditMode] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<{lat:number;lng:number}[]|null>(null);
  const [draggingWp, setDraggingWp] = useState<string|null>(null);
  const [confirmDel, setConfirmDel] = useState<string|null>(null);
  const [hoverDrone, setHoverDrone] = useState<string|null>(null);
  const pushToast = useAppStore(s => s.pushToast);

  // A stale plan is worse than no plan — drop it when waypoints move.
  useEffect(() => { setPlannedRoute(null); }, [waypoints]);

  const planRoute = () => {
    if (waypoints.length === 0) {
      pushToast({ level: 'warn', title: 'No waypoints to route', body: 'Enable waypoint mode and click the map to add targets first.' });
      return;
    }
    const result = planSafeRoute(waypoints);
    if (!result) {
      setPlannedRoute(null);
      pushToast({ level: 'danger', title: 'No safe route found', body: 'A waypoint sits inside a storm cell or outside the geofence.' });
      return;
    }
    setPlannedRoute(result.route);
    pushToast({ level: 'ok', title: 'A* route planned', body: `${(result.lengthM / 1000).toFixed(2)} km through ${waypoints.length} waypoint${waypoints.length > 1 ? 's' : ''} — storm cells avoided, geofence respected.` });
  };

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setDrones(prev => prev.map(d => {
        const newHdg = d.hdg + (Math.random() - 0.5) * 8;
        const meters = d.spd;
        const dLat = (meters * Math.cos((newHdg * Math.PI) / 180)) / 111111;
        const dLng = (meters * Math.sin((newHdg * Math.PI) / 180)) / (111111 * Math.cos((d.lat * Math.PI) / 180));
        const nlat = d.lat + dLat * 0.5, nlng = d.lng + dLng * 0.5;
        const dist = Math.hypot(nlat - HOME.lat, nlng - HOME.lng);
        if (dist > 0.012) return { ...d, hdg: (newHdg + 180) % 360 };
        return { ...d, lat: nlat, lng: nlng, hdg: newHdg };
      }));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const project = useCallback((lat: number, lng: number) => {
    const wx = lngToX(lng, zoom), wy = latToY(lat, zoom);
    const cx = lngToX(center.lng, zoom), cy = latToY(center.lat, zoom);
    return { x: size.w / 2 + (wx - cx), y: size.h / 2 + (wy - cy) };
  }, [zoom, center, size]);

  const unproject = useCallback((x: number, y: number) => {
    const cx = lngToX(center.lng, zoom), cy = latToY(center.lat, zoom);
    return { lat: yToLat(cy + (y - size.h / 2), zoom), lng: xToLng(cx + (x - size.w / 2), zoom) };
  }, [zoom, center, size]);

  const tiles = (() => {
    const cx = lngToX(center.lng, zoom), cy = latToY(center.lat, zoom);
    const x0 = Math.floor((cx - size.w/2)/TILE), x1 = Math.ceil((cx + size.w/2)/TILE);
    const y0 = Math.floor((cy - size.h/2)/TILE), y1 = Math.ceil((cy + size.h/2)/TILE);
    const max = Math.pow(2, zoom), out = [];
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) {
      const tx = ((x % max) + max) % max;
      if (y < 0 || y >= max) continue;
      out.push({ x: tx, y, z: zoom, left: x * TILE - (cx - size.w/2), top: y * TILE - (cy - size.h/2) });
    }
    return out;
  })();

  const panRef = useRef<{x:number;y:number;center:typeof HOME}|null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || draggingWp) return;
    panRef.current = { x: e.clientX, y: e.clientY, center };
    setCursor('grabbing');
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    setReadout(unproject(mx, my));
    if (draggingWp) { setWaypoints(prev => prev.map(w => w.id === draggingWp ? { ...w, ...unproject(mx, my) } : w)); return; }
    if (panRef.current) {
      const dx = e.clientX - panRef.current.x, dy = e.clientY - panRef.current.y;
      const cx2 = lngToX(panRef.current.center.lng, zoom), cy2 = latToY(panRef.current.center.lat, zoom);
      setCenter({ lng: xToLng(cx2 - dx, zoom), lat: yToLat(cy2 - dy, zoom) });
    }
  };
  const onMouseUp = () => { panRef.current = null; setDraggingWp(null); setCursor(editMode ? 'crosshair' : 'grab'); };
  const onMouseLeave = () => { panRef.current = null; setReadout(null); };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const r = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const before = unproject(mx, my);
    const newZ = Math.max(13, Math.min(18, zoom + (e.deltaY < 0 ? 1 : -1)));
    if (newZ === zoom) return;
    setZoom(newZ);
    requestAnimationFrame(() => {
      setCenter({ lng: xToLng(lngToX(before.lng, newZ) - (mx - size.w/2), newZ), lat: yToLat(latToY(before.lat, newZ) - (my - size.h/2), newZ) });
    });
  };
  const onClick = (e: React.MouseEvent) => {
    if (panRef.current || !editMode) return;
    const r = containerRef.current!.getBoundingClientRect();
    setWaypoints(prev => [...prev, { id: `wp-${Date.now()}`, ...unproject(e.clientX - r.left, e.clientY - r.top) }]);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,button')) return;
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(18, z + 1));
      if (e.key === '-' || e.key === '_') setZoom(z => Math.max(13, z - 1));
      if (e.key.toLowerCase() === 'g') onLayerChange('geofence');
      if (e.key.toLowerCase() === 'w') onLayerChange('weather');
      if (e.key.toLowerCase() === 'p') onLayerChange('path');
      if (e.key.toLowerCase() === 'l') onLayerChange('labels');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onLayerChange]);

  const geofenceRadius = (() => { const a = project(HOME.lat, HOME.lng), b = project(HOME.lat + 0.011, HOME.lng); return Math.abs(b.y - a.y); })();
  const home = project(HOME.lat, HOME.lng);
  const droneColor = (d: typeof INITIAL_DRONES[0]) => d.own ? '#5a7d3e' : d.battery < 30 ? '#c8442b' : d.battery < 50 ? '#d4861e' : '#56685b';

  const mPerPx = (156543.03 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, zoom);
  const scaleTargets = [50, 100, 200, 500, 1000];
  const scaleT = scaleTargets.find(t => t / mPerPx > 40 && t / mPerPx < 140) || 200;
  const scaleW = scaleT / mPerPx;

  return (
    <div ref={containerRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave} onWheel={onWheel} onClick={onClick}
      style={{ position:'relative', width:'100%', height, borderRadius:16, overflow:'hidden',
        background:'#e9efe5', border:'1px solid var(--border)', cursor: editMode ? 'crosshair' : cursor, userSelect:'none' }}>
      <div style={{ position:'absolute', inset:0, filter:'saturate(0.85)' }}>
        {tiles.map(t => {
          const sub = ['a','b','c','d'][(t.x + t.y) % 4];
          return <img key={`${t.z}/${t.x}/${t.y}`} src={`https://${sub}.basemaps.cartocdn.com/light_all/${t.z}/${t.x}/${t.y}.png`}
            alt="" draggable={false} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
            style={{ position:'absolute', left:t.left, top:t.top, width:TILE, height:TILE, pointerEvents:'none' }}/>;
        })}
      </div>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse at 50% 50%, rgba(90,125,62,0.04), transparent 70%)' }}/>
      <svg width={size.w} height={size.h} style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        {layers.geofence && <>
          <circle cx={home.x} cy={home.y} r={geofenceRadius} fill="rgba(90,125,62,0.10)" stroke="rgba(90,125,62,0.65)" strokeWidth="1.5" strokeDasharray="6 6"/>
          <text x={home.x + geofenceRadius * 0.7} y={home.y - geofenceRadius * 0.7} fill="var(--accent-3)" fontSize="10" fontFamily="JetBrains Mono">GEOFENCE · 1.2 km</text>
        </>}
        {layers.weather && (() => {
          return <g><defs><radialGradient id="storm" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(217,102,102,0.45)"/><stop offset="60%" stopColor="rgba(212,180,84,0.25)"/><stop offset="100%" stopColor="rgba(212,180,84,0)"/></radialGradient></defs>
            {STORM_CELLS.map((cell, i) => {
              const p = project(cell.lat, cell.lng);
              const rPx = cell.r / mPerPx;
              return <circle key={i} cx={p.x} cy={p.y} r={rPx} fill="url(#storm)" opacity={i === 0 ? 1 : 0.75}/>;
            })}
          </g>;
        })()}
        {plannedRoute && plannedRoute.length > 1 && (
          <polyline
            points={plannedRoute.map(w => { const p = project(w.lat, w.lng); return `${p.x},${p.y}`; }).join(' ')}
            fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.95"/>
        )}
        {layers.path && waypoints.length > 1 && <polyline points={waypoints.map(w => { const p = project(w.lat, w.lng); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" opacity="0.85"/>}
        {drones.map(d => { const tr = trails[d.cs] || []; if (tr.length < 2) return null;
          const pts = tr.map(p => { const pp = project(p.lat, p.lng); return `${pp.x},${pp.y}`; }).join(' ');
          return <polyline key={`tr-${d.cs}`} points={pts} fill="none" stroke={d.own ? 'rgba(90,125,62,0.55)' : 'rgba(86,104,91,0.35)'} strokeWidth="1.4"/>;
        })}
      </svg>
      <div style={{ position:'absolute', left:home.x, top:home.y, transform:'translate(-50%,-50%)', zIndex:7, pointerEvents:'none' }}>
        <div style={{ width:22, height:22, borderRadius:6, background:'#ffffff', border:'2px solid var(--accent)', display:'grid', placeItems:'center', color:'var(--accent)', boxShadow:'0 0 0 4px rgba(90,125,62,0.18), 0 4px 10px rgba(31,42,35,0.12)' }}><Icon name="home" size={12}/></div>
      </div>
      {waypoints.map((w, i) => {
        const p = project(w.lat, w.lng); const isDel = confirmDel === w.id;
        return <div key={w.id} onMouseDown={e => { e.stopPropagation(); setDraggingWp(w.id); }}
          onContextMenu={e => { e.preventDefault(); setConfirmDel(w.id); }}
          style={{ position:'absolute', left:p.x-12, top:p.y-12, width:24, height:24, borderRadius:'50%', background: isDel ? 'var(--danger)' : 'var(--accent)', border:'2px solid #fff', display:'grid', placeItems:'center', color:'#1f2a23', fontSize:10, fontWeight:700, fontFamily:'JetBrains Mono', cursor:'move', zIndex:5 }}>
          {i+1}
          {isDel && <div style={{ position:'absolute', top:30, left:'50%', transform:'translateX(-50%)', background:'var(--card)', border:'1px solid var(--danger)', borderRadius:8, padding:'8px 10px', whiteSpace:'nowrap', zIndex:10 }}>
            <div style={{fontSize:11,color:'var(--text)',marginBottom:6}}>Delete waypoint {i+1}?</div>
            <div style={{display:'flex',gap:6}}>
              <button className="btn danger" style={{padding:'4px 10px',fontSize:11}} onClick={e=>{e.stopPropagation();setWaypoints(prev=>prev.filter(x=>x.id!==w.id));setConfirmDel(null);}}>Delete</button>
              <button className="btn" style={{padding:'4px 10px',fontSize:11}} onClick={e=>{e.stopPropagation();setConfirmDel(null);}}>Cancel</button>
            </div>
          </div>}
        </div>;
      })}
      {drones.map(d => {
        const p = project(d.lat, d.lng);
        if (p.x < -40 || p.x > size.w+40 || p.y < -40 || p.y > size.h+40) return null;
        const isLocked = pickedCs === d.cs;
        return <div key={d.cs} onMouseEnter={() => { setHoverDrone(d.cs); setCursor('pointer'); }}
          onMouseLeave={() => { setHoverDrone(null); setCursor(editMode ? 'crosshair' : 'grab'); }}
          onClick={e => { e.stopPropagation(); onPick(d.cs); }}
          style={{ position:'absolute', left:p.x-16, top:p.y-16, width:32, height:32, cursor:'pointer', zIndex: isLocked ? 8 : 6 }}>
          {isLocked && <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'2px dashed var(--accent)', animation:'spin 6s linear infinite' }}/>}
          <div style={{ position:'absolute', inset:0, transform:`rotate(${d.hdg}deg)`, transition:'transform 1.5s linear', filter: isLocked ? 'drop-shadow(0 0 8px rgba(90,125,62,0.7))' : 'drop-shadow(0 1px 2px rgba(31,42,35,0.25))' }}>
            <svg viewBox="-12 -12 24 24" width="32" height="32">
              <g fill={droneColor(d)} stroke="#1f2a23" strokeWidth="0.6" strokeLinejoin="round">
                <path d="M0,-10 L1.4,-2 L1.4,5 L3,7 L3,8.4 L0.7,7.6 L0.7,9.6 L1.6,10.4 L1.6,11 L0,10.4 L-1.6,11 L-1.6,10.4 L-0.7,9.6 L-0.7,7.6 L-3,8.4 L-3,7 L-1.4,5 L-1.4,-2 Z"/>
                <path d="M-9,1 L-1.4,-1 L-1.4,3 L-9,3 Z"/>
                <path d="M9,1 L1.4,-1 L1.4,3 L9,3 Z"/>
              </g>
            </svg>
          </div>
          {(layers.labels || isLocked || hoverDrone === d.cs) && <div style={{ position:'absolute', left:36, top:0, whiteSpace:'nowrap', fontFamily:'JetBrains Mono', fontSize:10, color: isLocked ? 'var(--accent-3)' : 'var(--text)', background:'rgba(255,255,255,0.95)', padding:'3px 6px', borderRadius:4, border:`1px solid ${isLocked?'var(--accent)':'var(--border)'}`, pointerEvents:'none' }}>
            <div style={{fontWeight:600}}>{d.cs}</div>
            <div style={{color:'var(--text-3)',fontSize:9}}>{Math.round(d.alt)}m · {d.spd}m/s · {Math.round(d.battery)}%</div>
          </div>}
        </div>;
      })}
      <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:6, zIndex:20 }}>
        {([['geofence','shield','G'],['weather','rain','W'],['path','route','P'],['labels','tag','L']] as [keyof Layers,string,string][]).map(([k,icon,kbd]) => (
          <button key={k} onClick={e=>{e.stopPropagation();onLayerChange(k);}} style={{ padding:'6px 10px', borderRadius:8, background: layers[k] ? 'var(--accent-soft)' : 'rgba(255,255,255,0.92)', border:`1px solid ${layers[k]?'var(--accent)':'var(--border)'}`, color:layers[k]?'var(--accent-3)':'var(--text-2)', fontSize:11, display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(8px)' }}>
            <Icon name={icon} size={11}/>{k.charAt(0).toUpperCase()+k.slice(1)}<span style={{fontFamily:'JetBrains Mono',fontSize:9,color:'var(--text-3)',marginLeft:4}}>{kbd}</span>
          </button>
        ))}
      </div>
      <div style={{ position:'absolute', top:12, right:12, display:'flex', flexDirection:'column', gap:6, zIndex:20 }}>
        {[{label:'+',action:()=>setZoom(z=>Math.min(18,z+1)),title:'Zoom in (+)'},{label:'−',action:()=>setZoom(z=>Math.max(13,z-1)),title:'Zoom out (−)'}].map(b=>(
          <button key={b.label} onClick={e=>{e.stopPropagation();b.action();}} className="map-btn" title={b.title}>{b.label}</button>
        ))}
        <button onClick={e=>{e.stopPropagation();setCenter(HOME);setZoom(15);}} className="map-btn" title="Recenter"><Icon name="home" size={12}/></button>
        <button onClick={e=>{e.stopPropagation();setEditMode(v=>!v);}} className="map-btn" style={{ background: editMode?'rgba(163,197,133,0.25)':undefined, borderColor:editMode?'#a3c585':undefined, color:editMode?'#a3c585':undefined }} title={editMode?'Exit waypoint mode':'Add waypoints'}><Icon name="route" size={12}/></button>
        <button onClick={e=>{e.stopPropagation();planRoute();}} className="map-btn" style={{ background: plannedRoute?'rgba(163,197,133,0.25)':undefined, borderColor:plannedRoute?'#a3c585':undefined, color:plannedRoute?'#a3c585':undefined }} title="Plan storm-safe route (A*)"><Icon name="zap" size={12}/></button>
      </div>
      <div style={{ position:'absolute', bottom:12, left:12, display:'flex', flexDirection:'column', gap:6, zIndex:20 }}>
        <div style={{ background:'rgba(255,255,255,0.92)', border:'1px solid var(--border)', padding:'4px 8px', borderRadius:6, fontFamily:'JetBrains Mono', fontSize:10.5, color:'var(--text-2)', backdropFilter:'blur(8px)' }}>
          {readout ? `${readout.lat.toFixed(5)}°N  ${readout.lng.toFixed(5)}°E` : `${center.lat.toFixed(5)}°N  ${center.lng.toFixed(5)}°E`}
        </div>
        <div style={{ background:'rgba(255,255,255,0.92)', border:'1px solid var(--border)', padding:'4px 8px', borderRadius:6, backdropFilter:'blur(8px)', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:scaleW, height:5, borderLeft:'1.5px solid var(--accent)', borderRight:'1.5px solid var(--accent)', borderBottom:'1.5px solid var(--accent)' }}/>
          <span style={{ fontFamily:'JetBrains Mono', fontSize:10.5, color:'var(--text-2)' }}>{scaleT >= 1000 ? `${scaleT/1000} km` : `${scaleT} m`}</span>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:12, right:12, zIndex:20, background:'rgba(255,255,255,0.92)', border:'1px solid var(--border)', padding:'6px 10px', borderRadius:6, fontSize:10.5, color:'var(--text-2)', fontFamily:'JetBrains Mono', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', gap:8 }}>
        <Icon name="info" size={11}/>{editMode ? 'Click to add waypoint · right-click to delete' : 'Drag to pan · scroll to zoom'}
      </div>
      <div style={{ position:'absolute', bottom:0, right:0, fontSize:9, color:'var(--text-3)', background:'rgba(255,255,255,0.7)', padding:'2px 6px', zIndex:19 }}>© OpenStreetMap · © CARTO</div>
      <style>{`.map-btn{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.92);border:1px solid var(--border);color:var(--text-2);box-shadow:0 2px 6px rgba(31,42,35,0.08);cursor:pointer;font-family:inherit;display:grid;place-items:center;backdrop-filter:blur(8px);font-size:16px;font-weight:500;transition:all 140ms ease;}.map-btn:hover{color:var(--accent);border-color:var(--accent);background:var(--accent-soft);}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
