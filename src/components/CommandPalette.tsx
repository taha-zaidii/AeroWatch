import React, { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PAGES, useAppStore } from '../store/app';
import { fuzzyRank } from '../lib/fuzzy';
import { searchLocations, type GeoResult } from '../lib/weather';
import { Icon } from './Icon';

interface PaletteState {
  open: boolean;
  setOpen: (v: boolean) => void;
}
export const usePalette = create<PaletteState>()((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}));

type Item =
  | { kind: 'page'; id: string; label: string; icon: string; kbd?: string }
  | { kind: 'location'; geo: GeoResult };

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function CommandPalette() {
  const { open, setOpen } = usePalette();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const setLocation = useAppStore((s) => s.setLocation);
  const pushToast = useAppStore((s) => s.pushToast);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!usePalette.getState().open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const debouncedQuery = useDebounced(query, 280);
  const { data: geoResults = [], isFetching: geoLoading } = useQuery({
    queryKey: ['geocode', debouncedQuery],
    queryFn: () => searchLocations(debouncedQuery),
    enabled: open && debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60_000,
  });

  const pageItems: Item[] = useMemo(() => {
    const visible = PAGES.filter((p) => !p.hidden);
    return fuzzyRank(query, visible, (p) => p.label).map((p) => ({
      kind: 'page' as const, id: p.id, label: p.label, icon: p.icon, kbd: p.kbd,
    }));
  }, [query]);

  const locationItems: Item[] = useMemo(
    () => geoResults.map((geo) => ({ kind: 'location' as const, geo })),
    [geoResults],
  );

  const items = useMemo(() => [...pageItems, ...locationItems], [pageItems, locationItems]);

  useEffect(() => { setCursor(0); }, [items.length, query]);

  const run = (item: Item) => {
    if (item.kind === 'page') {
      navigate(`/${item.id}`);
    } else {
      setLocation({
        name: item.geo.name,
        region: item.geo.region,
        lat: item.geo.lat,
        lng: item.geo.lng,
        elevation: item.geo.elevation,
      });
      pushToast({
        level: 'ok',
        title: `Now tracking ${item.geo.name}`,
        body: `Live weather for ${item.geo.region || item.geo.name} is streaming in.`,
      });
      navigate('/dashboard');
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    if (e.key === 'Enter' && items[cursor]) { e.preventDefault(); run(items[cursor]); }
  };

  if (!open) return null;

  let idx = -1;
  return (
    <div className="cmdk-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cmdk-input-row">
          <Icon name="search" size={16}/>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search screens, or type a city to fly anywhere on Earth…"
            aria-label="Search"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="cmdk-list">
          {pageItems.length > 0 && <div className="cmdk-section">Navigate</div>}
          {pageItems.map((item) => {
            idx += 1; const i = idx;
            if (item.kind !== 'page') return null;
            return (
              <button key={`p-${item.id}`} className={`cmdk-item ${cursor === i ? 'active' : ''}`}
                onMouseEnter={() => setCursor(i)} onClick={() => run(item)}>
                <Icon name={item.icon} size={15}/>
                <span>{item.label}</span>
                {item.kbd && <span className="kbd-hint">{item.kbd}</span>}
              </button>
            );
          })}
          {(locationItems.length > 0 || (debouncedQuery.trim().length >= 2)) && (
            <div className="cmdk-section">Fly anywhere · live weather{geoLoading ? ' — searching…' : ''}</div>
          )}
          {locationItems.map((item) => {
            idx += 1; const i = idx;
            if (item.kind !== 'location') return null;
            return (
              <button key={`g-${item.geo.lat}-${item.geo.lng}`} className={`cmdk-item ${cursor === i ? 'active' : ''}`}
                onMouseEnter={() => setCursor(i)} onClick={() => run(item)}>
                <Icon name="cloud" size={15}/>
                <span>{item.geo.name}</span>
                <span className="cmdk-item-sub">{item.geo.region}</span>
              </button>
            );
          })}
          {debouncedQuery.trim().length >= 2 && !geoLoading && locationItems.length === 0 && (
            <div className="cmdk-empty">No places match “{debouncedQuery}”.</div>
          )}
          {query.trim().length < 2 && (
            <div className="cmdk-hint-row">
              <Icon name="info" size={12}/> Try “Tokyo”, “Reykjavik”, or “Cape Town” — the whole app retargets to real weather there.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
