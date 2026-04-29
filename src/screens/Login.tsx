import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';

export default function LoginScreen() {
  const { setAuthed, setUser, setPage, pushToast } = useApp();
  const [username, setUsername] = useState('m.khan');
  const [password, setPassword] = useState('••••••••');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [t, setT] = useState(() => new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }));

  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })), 30000);
    return () => clearInterval(id);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault(); setErr('');
    if (!username.trim()) return setErr('Username is required.');
    if (!password.trim() || password.length < 4) return setErr('Password must be at least 4 characters.');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUser({ name:'Maya Khan', initials:'MK', role:'Flight Operator' });
      setAuthed(true); setPage('dashboard');
      pushToast({ level:'ok', title:'Welcome back, Maya', body:'Live weather data is streaming for your sector.' });
    }, 600);
  };

  return (
    <div className="wx-login">
      <div className="wx-login-bg"><CloudArt/></div>
      <div className="wx-login-content">
        <div className="wx-login-left">
          <div className="wx-login-brand">
            <div className="brand-mark" style={{ width:44, height:44, borderRadius:12 }}><Icon name="wind" size={22} stroke={2} style={{ color:'#fff' }}/></div>
            <div><div className="wx-login-brand-name">AeroWatch</div><div className="wx-login-brand-tag">UAV Weather Intelligence</div></div>
          </div>
          <h1 className="wx-login-headline">Know the sky<br/>before you fly.</h1>
          <p className="wx-login-sub">Real-time atmospheric monitoring for unmanned aerial vehicles. Wind, visibility, precipitation, and storm-cell tracking — all in one place.</p>
          <div className="wx-login-stats">
            {[{icon:'cloud',label:'Stations online',value:'14',sub:'across Margalla'},{icon:'wind',label:'Active flights',value:'1',sub:'of 4 fleet'},{icon:'eye',label:'Visibility',value:'9.5 km',sub:'clear'}].map(s=>(
              <div key={s.label} className="wx-login-stat"><Icon name={s.icon} size={18}/><div><div className="wx-login-stat-v">{s.value}</div><div className="wx-login-stat-l">{s.label} · {s.sub}</div></div></div>
            ))}
          </div>
        </div>
        <div className="wx-login-card">
          <div className="wx-login-card-h">
            <div><div className="wx-login-card-eyebrow">Sign in</div><div className="wx-login-card-title">Welcome back</div></div>
            <span className="pill ok mono"><span className="dot ok"/> SECURE</span>
          </div>
          <form onSubmit={submit} className="wx-login-form">
            <div className="field">
              <label htmlFor="user">Operator ID</label>
              <div style={{ position:'relative' }}>
                <Icon name="user" size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }}/>
                <input id="user" type="text" value={username} onChange={e=>setUsername(e.target.value)} style={{ paddingLeft:40, width:'100%' }} autoComplete="username"/>
              </div>
            </div>
            <div className="field">
              <label htmlFor="pass">Password</label>
              <div style={{ position:'relative' }}>
                <Icon name="lock" size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }}/>
                <input id="pass" type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyUp={e=>setCapsOn(!!(e.getModifierState && e.getModifierState('CapsLock')))}
                  style={{ paddingLeft:40, paddingRight:42, width:'100%' }} autoComplete="current-password"/>
                <button type="button" className="icon-btn" style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', width:30, height:30, background:'transparent', border:0 }} onClick={()=>setShowPass(v=>!v)} title={showPass?'Hide':'Show'}>
                  <Icon name={showPass?'eyeOff':'eye'} size={15}/>
                </button>
              </div>
              {capsOn && <div style={{ fontSize:11.5, color:'var(--warn)', display:'flex', alignItems:'center', gap:6 }}><Icon name="warning" size={12}/> Caps Lock is on</div>}
            </div>
            {err && <div className="wx-login-err"><Icon name="warning" size={14}/> {err}</div>}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label className="row" style={{ gap:8, cursor:'pointer' }}>
                <span className={`checkbox ${remember?'on':''}`} onClick={()=>setRemember(v=>!v)}/>
                <span style={{ fontSize:13, color:'var(--text-2)' }}>Keep me signed in</span>
              </label>
              <a href="#" style={{ fontSize:12.5, color:'var(--accent)', textDecoration:'none' }} onClick={e=>{e.preventDefault();pushToast({level:'info',title:'Reset link sent',body:'Check your email for next steps.'});}}>Forgot password?</a>
            </div>
            <button type="submit" className="btn primary lg" disabled={loading} style={{ justifyContent:'center', width:'100%' }}>
              {loading ? <><Icon name="rotate" size={14} className="spin"/> Signing in…</> : <>Sign in <Icon name="arrowRight" size={14}/></>}
            </button>
            <div className="wx-login-foot"><Icon name="shield" size={12}/> Encrypted · station network · {t}</div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CloudArt() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
      <defs>
        <linearGradient id="sky-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dbe7e8"/><stop offset="60%" stopColor="#e9efe5"/><stop offset="100%" stopColor="#f4f7f2"/></linearGradient>
        <radialGradient id="sun" cx="80%" cy="20%" r="40%"><stop offset="0%" stopColor="rgba(255,228,166,0.6)"/><stop offset="100%" stopColor="rgba(255,228,166,0)"/></radialGradient>
        <linearGradient id="sky-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#08101c"/><stop offset="55%" stopColor="#0e1822"/><stop offset="100%" stopColor="#131e2a"/></linearGradient>
        <radialGradient id="moonglow" cx="80%" cy="22%" r="30%"><stop offset="0%" stopColor="rgba(180,200,230,0.18)"/><stop offset="100%" stopColor="rgba(180,200,230,0)"/></radialGradient>
        <radialGradient id="moon" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f0e8d0"/><stop offset="80%" stopColor="#d8cfb5"/><stop offset="100%" stopColor="#b8af95"/></radialGradient>
      </defs>
      <g className="sky-light">
        <rect width="1600" height="1000" fill="url(#sky-light)"/>
        <rect width="1600" height="1000" fill="url(#sun)"/>
        <path d="M0,720 L180,580 L320,640 L520,520 L740,600 L920,540 L1140,610 L1320,560 L1600,640 L1600,1000 L0,1000 Z" fill="#c8d4ba" opacity="0.5"/>
        <path d="M0,800 L240,700 L420,740 L620,660 L840,720 L1060,680 L1280,720 L1600,690 L1600,1000 L0,1000 Z" fill="#a8b89a" opacity="0.55"/>
        {[[220,180,1.4],[680,120,1.0],[1080,220,1.6],[1380,140,0.9],[420,340,1.1],[900,380,1.3]].map(([cx,cy,s],i)=>(
          <g key={i} transform={`translate(${cx},${cy}) scale(${s})`} fill="white" opacity="0.85"><ellipse cx="0" cy="0" rx="80" ry="22"/><ellipse cx="-30" cy="-12" rx="34" ry="22"/><ellipse cx="20" cy="-18" rx="40" ry="26"/><ellipse cx="50" cy="-6" rx="30" ry="20"/></g>
        ))}
      </g>
      <g className="sky-dark">
        <rect width="1600" height="1000" fill="url(#sky-dark)"/>
        <rect width="1600" height="1000" fill="url(#moonglow)"/>
        <circle cx="1280" cy="220" r="60" fill="url(#moon)"/>
        <circle cx="1262" cy="208" r="8" fill="#9c9580" opacity="0.4"/>
        <circle cx="1296" cy="232" r="6" fill="#9c9580" opacity="0.4"/>
        <Stars/>
        <path d="M0,720 L180,580 L320,640 L520,520 L740,600 L920,540 L1140,610 L1320,560 L1600,640 L1600,1000 L0,1000 Z" fill="#1a2536" opacity="0.85"/>
        <path d="M0,800 L240,700 L420,740 L620,660 L840,720 L1060,680 L1280,720 L1600,690 L1600,1000 L0,1000 Z" fill="#0f1828" opacity="0.95"/>
        {[[220,180,1.4],[680,120,1.0],[420,340,1.1],[900,380,1.3]].map(([cx,cy,s],i)=>(
          <g key={i} transform={`translate(${cx},${cy}) scale(${s})`} fill="#1c2a3e" opacity="0.7"><ellipse cx="0" cy="0" rx="80" ry="22"/><ellipse cx="-30" cy="-12" rx="34" ry="22"/><ellipse cx="20" cy="-18" rx="40" ry="26"/><ellipse cx="50" cy="-6" rx="30" ry="20"/></g>
        ))}
      </g>
    </svg>
  );
}

function Stars() {
  const stars: React.ReactNode[] = [];
  let seed = 17;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 110; i++) {
    stars.push(<circle key={i} cx={rand()*1600} cy={rand()*600} r={0.6+rand()*1.2} fill="white" opacity={0.4+rand()*0.5}/>);
  }
  return <g>{stars}</g>;
}
