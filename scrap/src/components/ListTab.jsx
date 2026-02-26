import { DISPOSITION } from '../data/constants';
import { getTheme, mono } from '../theme';

export default function ListTab({ dark, role, activeUnit, changes, ecnStepSet, cascade, applied, allEcnApplied, expanded, setExpanded, setShowModal, getGroupCascadeCount, tree, dragState, onDragStart, onDragOver, onDragEnd, onUpgrade }) {
  const t = getTheme(dark);
  const isOutdated = activeUnit.status === 'outdated';

  return (
    <>
      {/* Legend */}
      {isOutdated && changes.length > 0 && (
        <div style={{ display: 'flex', gap: 16, padding: '8px 20px', borderBottom: `1px solid ${t.border}`, background: t.headerBg, fontSize: 11, color: t.textMuted, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>Legend:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 12 }}>🔴</span> ECN change</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 12 }}>⚠️</span> Disassembly cascade</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 12 }}>✅</span> Applied</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 12 }}>🔒</span> Blocked</span>
          <span style={{ width: 1, height: 14, background: t.border }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>♻️</span><span style={{ color: '#3b82f6', fontWeight: 600 }}>Reuse</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>🗑️</span><span style={{ color: '#ef4444', fontWeight: 600 }}>Scrap</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>🔧</span><span style={{ color: '#f59e0b', fontWeight: 600 }}>Rework</span></span>
        </div>
      )}

      {/* ECN Banner */}
      {isOutdated && changes.length > 0 && (
        <div style={{ margin: '12px 20px 0', padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>⚠ {changes.length} ECN changes · {[...cascade.values()].filter((v) => v.isCascade).length} cascade steps</span>
            <span style={{ fontSize: 11, color: t.textMuted }}>{[...applied].filter((k) => k.startsWith(activeUnit.sn)).length}/{changes.length} applied</span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(239,68,68,0.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, transition: 'width 0.3s', width: `${([...applied].filter((k) => k.startsWith(activeUnit.sn)).length / changes.length) * 100}%`, background: allEcnApplied ? '#22c55e' : '#f59e0b' }} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {changes.map((c, i) => {
              const done = applied.has(`${activeUnit.sn}-${c.step}`);
              const info = cascade.get(c.step);
              const blocked = info?.isBlocked && !done;
              return (
                <div key={i} onClick={() => !blocked && setShowModal(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: done ? 'rgba(34,197,94,0.06)' : blocked ? 'rgba(139,143,163,0.06)' : t.bgCard, border: `1px solid ${done ? 'rgba(34,197,94,0.15)' : blocked ? 'rgba(139,143,163,0.15)' : t.border}`, cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.6 : 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: done ? '#22c55e' : blocked ? t.textDim : '#ef4444', fontFamily: mono, minWidth: 32, textAlign: 'center', background: done ? 'rgba(34,197,94,0.12)' : blocked ? 'rgba(139,143,163,0.08)' : 'rgba(239,68,68,0.12)', padding: '2px 6px', borderRadius: 4 }}>{c.step}</span>
                  <span style={{ flex: 1, fontSize: 12, color: t.text, fontWeight: 500, opacity: done ? 0.5 : 1, textDecoration: done ? 'line-through' : 'none' }}>{c.stepName}</span>
                  <span style={{ fontSize: 10, color: t.textMuted, fontFamily: mono }}>{c.field}</span>
                  {c.removedParts?.length > 0 && c.removedParts.map((rp, j) => {
                    const d = DISPOSITION[rp.disposition] || DISPOSITION.reuse;
                    return (
                      <span key={j} style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: d.bg, color: d.color, fontFamily: mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {d.icon} {d.label}
                      </span>
                    );
                  })}
                  {blocked && <span style={{ fontSize: 11 }} title={`Blocked by: ${info.cascadeFrom.join(', ')}`}>🔒</span>}
                  <span style={{ fontSize: 14, color: done ? '#22c55e' : t.textDim }}>{done ? '✓' : '○'}</span>
                </div>
              );
            })}
          </div>

          {/* Upgrade Button */}
          {allEcnApplied && (
            <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeIn 0.3s' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>✅ All {changes.length} changes applied</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Ready to upgrade {activeUnit.sn} from v{activeUnit.version} to v{activeUnit.latestVersion}</div>
              </div>
              <button onClick={onUpgrade} style={{ padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#22c55e', border: 'none', color: '#000', cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.35)', whiteSpace: 'nowrap' }}>
                ✓ Upgrade to v{activeUnit.latestVersion}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Assembly Tree */}
      <div style={{ padding: '12px 20px 36px', maxWidth: 960, margin: '0 auto' }}>
        {tree.map((group) => {
          const open = expanded.has(group.id);
          const ecnCount = group.steps.filter((s) => ecnStepSet.has(s.sn) && !applied.has(`${activeUnit.sn}-${s.sn}`)).length;
          const cascadeCount = getGroupCascadeCount(group);
          return (
            <div key={group.id} style={{ marginBottom: 2 }}>
              {/* Group header */}
              <div onClick={() => { const n = new Set(expanded); n.has(group.id) ? n.delete(group.id) : n.add(group.id); setExpanded(n); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: t.bgCard, borderLeft: `3px solid ${group.color}`, cursor: 'pointer', borderRight: (ecnCount > 0 || cascadeCount > 0) ? `3px solid ${ecnCount > 0 ? '#ef4444' : '#f59e0b'}` : 'none' }}>
                <span style={{ color: t.textMuted, fontSize: 11, transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>▶</span>
                <span style={{ fontSize: 15 }}>{group.icon}</span>
                <span style={{ color: group.color, fontWeight: 700, fontSize: 14, flex: 1 }}>{group.name}</span>
                {group.level !== null && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${group.color}20`, color: group.color, fontFamily: mono }}>L{group.level}</span>}
                <span style={{ fontSize: 11, color: t.textMuted, fontFamily: mono }}>{group.steps.length}</span>
                {ecnCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 7px', borderRadius: 6, fontFamily: mono }}>🔴 {ecnCount}</span>}
                {cascadeCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: 6, fontFamily: mono }}>⚠️ {cascadeCount}</span>}
              </div>

              {/* Steps */}
              {open && group.steps.map((step, stepIdx) => {
                const isEcn = ecnStepSet.has(step.sn);
                const ecnApplied = isEcn && applied.has(`${activeUnit.sn}-${step.sn}`);
                const info = cascade.get(step.sn);
                const isCascade = info?.isCascade && !ecnApplied;
                const isBlocked = isEcn && info?.isBlocked && !ecnApplied;
                const cObj = changes.find((c) => c.step === step.sn);

                let leftBorderColor = `${group.color}22`;
                if (ecnApplied) leftBorderColor = '#22c55e';
                else if (isEcn && !ecnApplied) leftBorderColor = '#ef4444';
                else if (isCascade) leftBorderColor = '#f59e0b';

                let bgColor = 'transparent';
                if (ecnApplied) bgColor = 'rgba(34,197,94,0.03)';
                else if (isEcn && !ecnApplied) bgColor = 'rgba(239,68,68,0.03)';
                else if (isCascade) bgColor = 'rgba(245,158,11,0.03)';

                const isDragging = dragState.dragging && dragState.groupId === group.id && dragState.stepIdx === stepIdx;
                const isOver = dragState.dragging && dragState.groupId === group.id && dragState.overIdx === stepIdx;

                return (
                  <div
                    key={step.id}
                    draggable={role === 'admin'}
                    onDragStart={(e) => { if (role !== 'admin') return; e.dataTransfer.effectAllowed = 'move'; onDragStart(group.id, stepIdx); }}
                    onDragOver={(e) => { if (role !== 'admin') return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(group.id, stepIdx); }}
                    onDragEnd={role === 'admin' ? onDragEnd : undefined}
                    onClick={() => { if (isEcn && !isBlocked) setShowModal(cObj); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px 8px 20px',
                      cursor: role === 'admin' ? (isDragging ? 'grabbing' : 'grab') : (isEcn && !isBlocked && role === 'operator') ? 'pointer' : 'default',
                      borderLeft: `3px solid ${leftBorderColor}`,
                      marginLeft: 16, background: bgColor,
                      borderRight: (isEcn && !ecnApplied && !isBlocked) ? '2px solid rgba(239,68,68,0.25)' : isCascade ? '2px solid rgba(245,158,11,0.2)' : 'none',
                      opacity: isDragging ? 0.4 : isBlocked ? 0.5 : 1,
                      transition: isDragging ? 'none' : 'all 0.12s',
                      borderTop: isOver ? '2px solid #f59e0b' : '2px solid transparent',
                      position: 'relative',
                    }}
                  >
                    {/* Drag handle - admin only */}
                    {role === 'admin' && <span style={{ fontSize: 12, color: t.textDim, cursor: 'grab', userSelect: 'none', lineHeight: 1 }} title="Drag to reorder">⠿</span>}

                    <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: ecnApplied ? '#22c55e' : isEcn ? '#ef4444' : isCascade ? '#f59e0b' : group.color, minWidth: 32, textAlign: 'center', background: ecnApplied ? 'rgba(34,197,94,0.15)' : isEcn ? 'rgba(239,68,68,0.15)' : isCascade ? 'rgba(245,158,11,0.12)' : `${group.color}15`, padding: '2px 7px', borderRadius: 4 }}>{step.sn}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: step.type === 'PREP' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.08)', color: step.type === 'PREP' ? '#a855f7' : '#3b82f6', fontFamily: mono }}>{step.type}</span>

                    <div style={{ display: 'flex', gap: 2, minWidth: 36 }}>
                      {isCascade && <span style={{ fontSize: 12 }} title={`Cascade from: ${info.cascadeFrom.join(', ')}`}>⚠️</span>}
                      {isEcn && !ecnApplied && !isBlocked && <span style={{ fontSize: 12 }}>🔴</span>}
                      {isEcn && isBlocked && <span style={{ fontSize: 11 }}>🔒</span>}
                      {ecnApplied && <span style={{ fontSize: 12 }}>✅</span>}
                    </div>

                    <span style={{ flex: 1, color: t.text, fontSize: 13, fontWeight: 500, opacity: ecnApplied ? 0.5 : 1 }}>{step.name}</span>

                    {isEcn && cObj && !ecnApplied && <span style={{ fontSize: 9, color: '#ef4444', fontFamily: mono, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cObj.old || '—'} → {cObj.new}</span>}
                    {isEcn && cObj && !ecnApplied && cObj.removedParts?.length > 0 && cObj.removedParts.map((rp, j) => {
                      const d = DISPOSITION[rp.disposition] || DISPOSITION.reuse;
                      return <span key={j} style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: d.bg, color: d.color, fontFamily: mono }}>{d.icon}{d.label}</span>;
                    })}
                    {isCascade && !isEcn && <span style={{ fontSize: 9, color: '#f59e0b', fontFamily: mono }}>← cascade from {info.cascadeFrom.join(', ')}</span>}
                    {isCascade && !isEcn && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontFamily: mono }}>♻️REUSE</span>}

                    <div style={{ display: 'flex', gap: 4 }}>
                      {step.parts > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontFamily: mono }}>{step.parts}P</span>}
                      {step.fasteners > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontFamily: mono }}>{step.fasteners}F</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
