import { useRef } from 'react';
import { DISPOSITION } from '../data/constants';
import { getTheme, mono } from '../theme';
import { getChainPrefix, buildStepChain } from '../data/cascadeEngine';

export default function ChangeModal({ change, dark, role, isApplied, unitSn, cascadeInfo, onToggle, onClose, tree }) {
  const t = getTheme(dark);
  const ref = useRef(null);

  const typeConfig = {
    part_changed: { bg: 'rgba(59,130,246,0.1)', c: '#3b82f6', l: 'Part Changed' },
    part_added: { bg: 'rgba(34,197,94,0.1)', c: '#22c55e', l: 'Part Added' },
    fastener_changed: { bg: 'rgba(239,68,68,0.1)', c: '#ef4444', l: 'Fastener Changed' },
    step_modified: { bg: 'rgba(168,85,247,0.1)', c: '#a855f7', l: 'Step Modified' },
  };
  const tc = typeConfig[change.changeType] || { bg: 'rgba(168,85,247,0.1)', c: '#a855f7', l: 'Modified' };

  const flat = buildStepChain(tree);
  const chain = getChainPrefix(change.step);
  const idx = flat.findIndex((s) => s.sn === change.step);
  const downstream = flat.filter((s, i) => i > idx && s.chain === chain);

  return (
    <div ref={ref} onClick={(e) => e.target === ref.current && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: t.bgModal, borderRadius: 14, width: 'min(500px,92vw)', maxHeight: '85vh', boxShadow: t.shadow, border: `1px solid ${t.border}`, overflow: 'hidden', animation: 'slideUp 0.2s', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: tc.c, background: tc.bg, padding: '3px 9px', borderRadius: 5 }}>{change.step}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{change.stepName}</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>{change.group} · {unitSn}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: tc.bg, color: tc.c, fontFamily: mono, alignSelf: 'flex-start' }}>{tc.l}</span>

          {/* Before / After */}
          <div style={{ display: 'flex', gap: 10 }}>
            {change.old && (
              <div style={{ flex: 1, padding: 12, borderRadius: 9, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Before</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text, fontFamily: mono, wordBreak: 'break-all' }}>{change.old}</div>
              </div>
            )}
            <div style={{ flex: 1, padding: 12, borderRadius: 9, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{change.old ? 'After' : 'New'}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text, fontFamily: mono, wordBreak: 'break-all' }}>{change.new}</div>
            </div>
          </div>

          {/* Reason */}
          <div style={{ padding: 12, borderRadius: 9, background: `${t.accent}08`, border: `1px solid ${t.accent}15` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: t.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Reason</div>
            <div style={{ fontSize: 12, color: t.text }}>{change.reason}</div>
          </div>

          {/* Removed Parts Disposition */}
          {change.removedParts?.length > 0 && (
            <div style={{ padding: 12, borderRadius: 9, background: t.bgCard, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Removed Parts — Disposition
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {change.removedParts.map((rp, i) => {
                  const d = DISPOSITION[rp.disposition] || DISPOSITION.reuse;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, background: d.bg, border: `1px solid ${d.color}20` }}>
                      <span style={{ fontSize: 16 }}>{d.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.text, fontFamily: mono }}>{rp.pn}</div>
                        <div style={{ fontSize: 10, color: t.textMuted }}>{rp.name}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: d.color, color: '#000', fontFamily: mono, letterSpacing: 0.5 }}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cascade Impact */}
          {downstream.length > 0 && (
            <div style={{ padding: 12, borderRadius: 9, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                ⚠️ Disassembly Cascade — {downstream.length} steps affected
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 8 }}>
                These steps must be disassembled to reach step {change.step}. All cascade-removed parts are <span style={{ color: '#3b82f6', fontWeight: 700 }}>♻️ REUSE</span> unless marked otherwise.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {downstream.map((s) => (
                  <span key={s.sn} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontFamily: mono, border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {s.sn} {s.name.length > 18 ? s.name.slice(0, 18) + '…' : s.name}
                    <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>♻️</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          {isApplied && <span style={{ fontSize: 11, color: '#22c55e', marginRight: 'auto' }}>✅ Applied — cascade cleared</span>}
          {!isApplied && cascadeInfo?.isBlocked && <span style={{ fontSize: 11, color: t.textDim, marginRight: 'auto' }}>🔒 Resolve upstream: {cascadeInfo.cascadeFrom.join(', ')}</span>}
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, cursor: 'pointer' }}>Close</button>
          {role !== 'viewer' && (
            <button
              onClick={() => { onToggle(); onClose(); }}
              disabled={!isApplied && cascadeInfo?.isBlocked}
              style={{
                padding: '7px 20px', borderRadius: 7, fontSize: 12, fontWeight: 700, border: 'none',
                cursor: (!isApplied && cascadeInfo?.isBlocked) ? 'not-allowed' : 'pointer',
                background: isApplied ? 'rgba(239,68,68,0.15)' : cascadeInfo?.isBlocked ? t.bgHover : '#22c55e',
                color: isApplied ? '#ef4444' : cascadeInfo?.isBlocked ? t.textDim : '#000',
                opacity: (!isApplied && cascadeInfo?.isBlocked) ? 0.5 : 1,
              }}
            >
              {isApplied ? '↩ Undo' : cascadeInfo?.isBlocked ? '🔒 Blocked' : '✓ Mark Applied'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
