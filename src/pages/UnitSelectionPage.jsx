import { useState, useEffect } from 'react';
import { fetchUnitsFromSheet, clearSheetCache } from '../data/googleSheets';
import { getTheme, mono } from '../theme';

export default function UnitSelectionPage({ dark, assemblyType, onBack, onProceed }) {
  const t = getTheme(dark);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchUnitsFromSheet(assemblyType.sheetName);
      setUnits(data);
      setLoading(false);
    })();
  }, [assemblyType.sheetName]);

  const handleRefresh = async () => {
    setLoading(true);
    clearSheetCache(assemblyType.sheetName);
    const data = await fetchUnitsFromSheet(assemblyType.sheetName);
    setUnits(data);
    setLoading(false);
  };

  const filtered = units.filter((u) => {
    if (filter === 'pending' && u.pendingEcns === 0) return false;
    if (filter === 'clear' && u.pendingEcns > 0) return false;
    if (search && !u.sn.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = (sn) => {
    const n = new Set(selected);
    n.has(sn) ? n.delete(sn) : n.add(sn);
    setSelected(n);
  };

  const pendingCount = units.filter((u) => u.pendingEcns > 0).length;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 14px', color: t.textMuted, cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <span style={{ fontSize: 26 }}>{assemblyType.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{assemblyType.name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${assemblyType.color}18`, color: assemblyType.color, fontFamily: mono }}>v{assemblyType.version || '1.0'}</span>
          </div>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            {loading ? 'Loading from Google Sheets...' : <>{units.length} total · <span style={{ color: pendingCount > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>{pendingCount} with pending ECNs</span></>}
          </div>
        </div>
        <button onClick={handleRefresh} disabled={loading} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 12px', cursor: loading ? 'wait' : 'pointer', color: t.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          🔄 Refresh
        </button>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#22c55e', fontFamily: mono }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          SHEETS LIVE
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: t.textMuted }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 13 }}>Fetching from Google Sheets...</div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search S/N..." style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgCard, color: t.text, fontSize: 12, width: 180, outline: 'none', fontFamily: mono }} />
            {['all', 'pending', 'clear'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: filter === f ? 'none' : `1px solid ${t.border}`, background: filter === f ? (f === 'pending' ? 'rgba(239,68,68,0.15)' : f === 'clear' ? 'rgba(34,197,94,0.15)' : `${t.accent}20`) : 'transparent', color: filter === f ? (f === 'pending' ? '#ef4444' : f === 'clear' ? '#22c55e' : t.accent) : t.textMuted }}>
                {f === 'all' ? `All (${units.length})` : f === 'pending' ? `Pending ECN (${pendingCount})` : `Clear (${units.length - pendingCount})`}
              </button>
            ))}
            <button onClick={() => { const n = new Set(selected); filtered.forEach((u) => n.add(u.sn)); setSelected(n); }} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, marginLeft: 'auto' }}>Select all ({filtered.length})</button>
          </div>

          {units.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: t.textMuted, background: t.bgCard, borderRadius: 12, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 13 }}>No units found in sheet "{assemblyType.sheetName}"</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: 6, maxHeight: 420, overflowY: 'auto', padding: 2 }}>
              {filtered.map((u) => {
                const sel = selected.has(u.sn);
                const hasPending = u.pendingEcns > 0;
                return (
                  <div key={u.sn} onClick={() => toggle(u.sn)} style={{ padding: '10px 12px', borderRadius: 9, cursor: 'pointer', border: sel ? `2px solid ${assemblyType.color}` : `1px solid ${t.border}`, background: sel ? `${assemblyType.color}10` : t.bgCard, transition: 'all 0.1s', position: 'relative' }}>
                    {sel && <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 13, color: assemblyType.color }}>✓</div>}
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: mono }}>{u.sn}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: `${assemblyType.color}18`, color: assemblyType.color, fontFamily: mono }}>v{u.version || '1.0'}</span>
                      {hasPending ? (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontFamily: mono }}>⏳ {u.pendingEcns} ECN</span>
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontFamily: mono }}>✓</span>
                      )}
                    </div>
                    {u.assembler && <div style={{ fontSize: 9, color: t.textDim, marginTop: 3 }}>{u.assembler}</div>}
                    {u.completionDate && <div style={{ fontSize: 8, color: t.textDim }}>{String(u.completionDate).split('T')[0]}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selection bar */}
          {selected.size > 0 && (
            <div style={{ marginTop: 16, padding: '12px 18px', borderRadius: 12, background: `${assemblyType.color}12`, border: `1px solid ${assemblyType.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: t.text, fontSize: 13 }}>{selected.size} selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSelected(new Set())} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, cursor: 'pointer' }}>Clear</button>
                <button onClick={() => onProceed([...selected].map((sn) => units.find((u) => u.sn === sn)).filter(Boolean))} style={{ padding: '9px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: assemblyType.color, border: 'none', color: '#000', cursor: 'pointer' }}>Open Assembly View →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
