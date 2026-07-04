import React from 'react';
import { assessRisk, bestLaunchWindows, type RiskAssessment, type RiskLevel } from '../lib/risk';
import { estimateCloudBase, type WeatherBundle } from '../lib/weather';
import { Icon } from './Icon';

const LEVEL_COLOR: Record<RiskLevel, string> = {
  go: 'var(--ok)',
  caution: 'var(--warn)',
  high: '#d4661e',
  nogo: 'var(--danger)',
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  go: 'GO', caution: 'CAUTION', high: 'HIGH RISK', nogo: 'NO-GO',
};

function RiskDial({ assessment }: { assessment: RiskAssessment }) {
  const { score, level } = assessment;
  const r = 62;
  const circumference = Math.PI * r; // half circle
  const filled = (score / 100) * circumference;
  const color = LEVEL_COLOR[level];
  return (
    <svg viewBox="0 0 160 100" className="risk-dial" role="img" aria-label={`Flight risk ${score} out of 100 — ${LEVEL_LABEL[level]}`}>
      <path d={`M 18 88 A ${r} ${r} 0 0 1 142 88`} fill="none" stroke="var(--border)" strokeWidth="11" strokeLinecap="round"/>
      <path d={`M 18 88 A ${r} ${r} 0 0 1 142 88`} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`} style={{ transition: 'stroke-dasharray 800ms ease, stroke 400ms ease' }}/>
      <text x="80" y="72" textAnchor="middle" fontSize="30" fontFamily="JetBrains Mono" fontWeight="700" fill={color}>{score}</text>
      <text x="80" y="90" textAnchor="middle" fontSize="10" letterSpacing="0.14em" fill="var(--text-3)">RISK INDEX</text>
    </svg>
  );
}

export function RiskPanel({ wx }: { wx: WeatherBundle }) {
  const now = wx.hourly[0];
  const assessment = assessRisk({
    windSpeed: wx.current.windSpeed,
    windGust: wx.current.windGust,
    precip: wx.current.precipitation,
    precipProb: now?.precipProb ?? 0,
    visibility: now?.visibility ?? 10,
    temperature: wx.current.temperature,
    cloudBase: estimateCloudBase(wx.current.temperature, wx.current.dewPoint),
    cloudCover: wx.current.cloudCover,
  });
  const windows = bestLaunchWindows(wx.hourly, 2, 3, 24);
  const color = LEVEL_COLOR[assessment.level];

  return (
    <div className="risk-panel">
      <div className="risk-main">
        <RiskDial assessment={assessment}/>
        <div className="risk-verdict">
          <span className="pill mono" style={{ borderColor: color, color }}>
            <span className="dot" style={{ background: color }}/>{LEVEL_LABEL[assessment.level]}
          </span>
          <div className="risk-headline">{assessment.headline}</div>
          {assessment.gate && (
            <div className="risk-gate"><Icon name="warning" size={13}/> Hard gate: {assessment.gate}</div>
          )}
          <div className="risk-explain">
            Weighted across six factors — gusts weigh heaviest. Deterministic and fully explainable: every point of the score traces to a reading below.
          </div>
        </div>
      </div>

      <div className="risk-factors">
        {assessment.factors.map((f) => {
          const fcolor = f.score <= 20 ? 'var(--ok)' : f.score <= 50 ? 'var(--warn)' : 'var(--danger)';
          return (
            <div key={f.key} className="risk-factor" title={f.detail}>
              <div className="risk-factor-top">
                <span className="risk-factor-label">{f.label}</span>
                <span className="mono risk-factor-score" style={{ color: fcolor }}>{Math.round(f.score)}</span>
              </div>
              <div className="risk-factor-bar">
                <div className="risk-factor-fill" style={{ width: `${f.score}%`, background: fcolor }}/>
              </div>
              <div className="risk-factor-detail">{f.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="risk-windows">
        <div className="risk-windows-h"><Icon name="zap" size={13}/> Best 2-hour launch windows · next 24 h</div>
        <div className="risk-windows-row">
          {windows.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 12.5 }}>Not enough forecast data yet.</span>}
          {windows.map((w) => (
            <div key={w.startIdx} className="risk-window" style={{ borderColor: LEVEL_COLOR[w.level] }}>
              <span className="mono risk-window-time">{w.start}–{w.end}</span>
              <span className="risk-window-score" style={{ color: LEVEL_COLOR[w.level] }}>risk {w.avgScore}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
