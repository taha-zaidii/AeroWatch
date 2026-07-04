import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/app';
import { useWeather } from '../hooks/useWeather';
import { askCopilot, generateBriefing, type ChatTurn } from '../lib/copilot';
import { Icon } from './Icon';

interface Message extends ChatTurn {
  engine?: 'local' | 'claude';
}

const SUGGESTIONS = ['Can I fly right now?', 'When is the best time today?', 'Full briefing', 'Any rain coming?'];

/** Renders **bold** segments from the engines' lightweight markdown. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <p key={i} style={{ margin: line.trim() === '' ? '6px 0 0' : '0 0 4px' }}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
            seg.startsWith('**') && seg.endsWith('**')
              ? <strong key={j}>{seg.slice(2, -2)}</strong>
              : <span key={j}>{seg}</span>,
          )}
        </p>
      ))}
    </>
  );
}

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const location = useAppStore(s => s.location);
  const { data: wx } = useWeather();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || !wx || thinking) return;
    setInput('');
    const history: ChatTurn[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages(m => [...m, { role: 'user', content: question }]);
    setThinking(true);
    try {
      const reply = question.toLowerCase() === 'full briefing'
        ? { text: generateBriefing({ wx, location }), engine: 'local' as const }
        : await askCopilot(question, history, { wx, location });
      setMessages(m => [...m, { role: 'assistant', content: reply.text, engine: reply.engine }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <button
        className={`copilot-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close AeroPilot' : 'Open AeroPilot assistant'}
        title="AeroPilot — flight assistant"
      >
        <Icon name={open ? 'chevronDown' : 'zap'} size={18}/>
      </button>

      {open && (
        <div className="copilot-panel" role="dialog" aria-label="AeroPilot flight assistant">
          <div className="copilot-h">
            <div className="copilot-h-title">
              <span className="copilot-h-dot"/>
              <div>
                <div className="copilot-name">AeroPilot</div>
                <div className="copilot-sub">Flight assistant · {location.name}</div>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><Icon name="chevronDown" size={15}/></button>
          </div>

          <div className="copilot-list" ref={listRef}>
            {messages.length === 0 && (
              <div className="copilot-empty">
                <Icon name="zap" size={20}/>
                <p>I compute go/no-go calls, launch windows, and weather answers from the live feed{wx ? '' : ' (still loading…)'}.</p>
                <div className="copilot-chips">
                  {SUGGESTIONS.map(s => (
                    <button key={s} className="copilot-chip" onClick={() => send(s)} disabled={!wx}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`copilot-msg ${m.role}`}>
                <div className="copilot-bubble">
                  <RichText text={m.content}/>
                  {m.role === 'assistant' && (
                    <div className="copilot-engine">{m.engine === 'claude' ? 'Claude' : 'local risk engine'}</div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="copilot-msg assistant">
                <div className="copilot-bubble copilot-typing"><span/><span/><span/></div>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="copilot-chips copilot-chips-row">
              {SUGGESTIONS.filter(s => !messages.some(m => m.content === s)).slice(0, 2).map(s => (
                <button key={s} className="copilot-chip" onClick={() => send(s)} disabled={!wx || thinking}>{s}</button>
              ))}
            </div>
          )}

          <form className="copilot-input" onSubmit={e => { e.preventDefault(); send(); }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={wx ? 'Ask about wind, rain, launch windows…' : 'Waiting for live weather…'}
              disabled={!wx}
              aria-label="Ask AeroPilot"
            />
            <button type="submit" className="copilot-send" disabled={!wx || thinking || !input.trim()} aria-label="Send">
              <Icon name="arrowRight" size={15}/>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
