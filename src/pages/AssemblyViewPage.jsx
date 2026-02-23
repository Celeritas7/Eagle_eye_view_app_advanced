import { useState, useEffect } from 'react';
import { supabase, fetchTree, saveStepOrder } from '../data/supabase';
import { fetchEcnColumnsFromSheet, clearSheetCache } from '../data/googleSheets';
import { computeCascade } from '../data/cascadeEngine';
import { getTheme, mono } from '../theme';
import TabBar from '../components/TabBar';
import ListTab from '../components/ListTab';
import GraphPlaceholder from '../components/GraphPlaceholder';
import KanbanPlaceholder from '../components/KanbanPlaceholder';
import ChangeModal from '../components/ChangeModal';

export default function AssemblyViewPage({ dark, role, assemblyType, selectedUnits, onBack }) {
  const t = getTheme(dark);
  const [activeTab, setActiveTab] = useState('list');
  const [activeUnit, setActiveUnit] = useState(selectedUnits[0]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasTree, setHasTree] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [applied, setApplied] = useState(new Set());
  const [changes, setChanges] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [ecnColumns, setEcnColumns] = useState([]);
  const [dragState, setDragState] = useState({ dragging: false, groupId: null, stepIdx: null, overIdx: null });

  // Load tree from Supabase + ECN columns from Google Sheets
  useEffect(() => {
    (async () => {
      setLoading(true);

      // Try to load tree from Supabase (only works for assemblies that have tree data)
      let treeData = [];
      if (assemblyType.tag) {
        // Find assembly in Supabase by tag
        const { data: assy } = await supabase
          .from('eagle_eye_app_assemblies')
          .select('id')
          .eq('tag', assemblyType.tag)
          .single();

        if (assy) {
          treeData = await fetchTree(assy.id);
        }
      }

      setTree(treeData);
      setHasTree(treeData.length > 0);
      setExpanded(new Set(treeData.map((g) => g.id)));

      // Load ECN columns from Google Sheets
      const ecnCols = await fetchEcnColumnsFromSheet(assemblyType.sheetName);
      setEcnColumns(ecnCols);

      setLoading(false);
    })();
  }, [assemblyType.tag, assemblyType.sheetName]);

  // Build ECN changes from the active unit's Google Sheets data
  useEffect(() => {
    if (!activeUnit) return;
    const ecnStatuses = activeUnit.ecnStatuses || {};
    const changesList = Object.entries(ecnStatuses).map(([ecnName, info]) => ({
      step: ecnName,
      stepName: ecnName,
      changeType: 'ecn',
      field: 'ECN Status',
      old: '',
      new: info.rawValue,
      reason: '',
      group: '',
      disposition: info.status === 'applied' ? 'applied' : 'pending',
      status: info.status,
    }));
    setChanges(changesList);

    // Build applied set
    const appliedSet = new Set();
    Object.entries(ecnStatuses).forEach(([ecnName, info]) => {
      if (info.status === 'applied') {
        appliedSet.add(`${activeUnit.sn}-${ecnName}`);
      }
    });
    setApplied(appliedSet);
  }, [activeUnit]);

  const isOutdated = activeUnit.pendingEcns > 0;
  const pendingChanges = changes.filter((c) => c.status === 'pending');
  const appliedChanges = changes.filter((c) => c.status === 'applied');
  const ecnStepSet = new Set(changes.filter(c => c.status === 'pending').map((c) => c.step));
  const cascade = computeCascade(tree, pendingChanges, applied, activeUnit.sn);
  const allEcnApplied = pendingChanges.length === 0;

  // Drag handlers
  const onDragStart = (groupId, stepIdx) => setDragState({ dragging: true, groupId, stepIdx, overIdx: null });
  const onDragOver = (groupId, stepIdx) => {
    if (dragState.groupId !== groupId) return;
    if (dragState.overIdx !== stepIdx) setDragState((p) => ({ ...p, overIdx: stepIdx }));
  };
  const onDragEnd = async () => {
    if (dragState.groupId && dragState.stepIdx !== null && dragState.overIdx !== null && dragState.stepIdx !== dragState.overIdx) {
      const newTree = tree.map((g) => {
        if (g.id !== dragState.groupId) return g;
        const s = [...g.steps]; const [m] = s.splice(dragState.stepIdx, 1); s.splice(dragState.overIdx, 0, m);
        return { ...g, steps: s };
      });
      setTree(newTree);
      const group = newTree.find((g) => g.id === dragState.groupId);
      if (group) await saveStepOrder(group.steps);
    }
    setDragState({ dragging: false, groupId: null, stepIdx: null, overIdx: null });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: t.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⬡</div>
          <div style={{ fontSize: 14 }}>Loading assembly data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: `1px solid ${t.border}`, background: t.headerBg, position: 'sticky', top: 0, zIndex: 10, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 12px', color: t.textMuted, cursor: 'pointer', fontSize: 12 }}>← Units</button>
        <span style={{ fontSize: 20, fontWeight: 800, color: t.accent, fontFamily: mono }}>⬡</span>

        {/* Unit selector */}
        <select value={activeUnit.sn} onChange={(e) => setActiveUnit(selectedUnits.find((u) => u.sn === e.target.value))} style={{ background: t.bgCard, color: t.text, border: `1px solid ${t.border}`, borderRadius: 8, padding: '7px 28px 7px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', appearance: 'none', fontFamily: mono }}>
          {selectedUnits.map((u) => <option key={u.sn} value={u.sn}>{u.sn} {u.pendingEcns > 0 ? `⚠ ${u.pendingEcns} pending` : '✓'}</option>)}
        </select>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: isOutdated ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', border: `1px solid ${isOutdated ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, borderRadius: 18, fontSize: 11, fontWeight: 700, color: isOutdated ? '#ef4444' : '#22c55e', fontFamily: mono }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOutdated ? '#ef4444' : '#22c55e' }} />
          {isOutdated ? `${activeUnit.pendingEcns} ECN pending` : 'All ECN applied'}
        </div>

        {/* Refresh button */}
        <button onClick={() => { clearSheetCache(assemblyType.sheetName); window.location.reload(); }} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 10px', color: t.textMuted, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
          🔄 Refresh
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#22c55e', fontFamily: mono }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
          SHEETS
        </div>
      </div>

      {/* ECN Status Dashboard (always shown) */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>ECN Status — {activeUnit.sn}</div>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Pill label={`${appliedChanges.length} Applied`} bg="rgba(34,197,94,0.12)" color="#22c55e" />
          <Pill label={`${pendingChanges.length} Pending`} bg="rgba(239,68,68,0.12)" color="#ef4444" />
          <Pill label={`${changes.filter(c => c.status === 'not_required').length} N/A`} bg={`${t.textMuted}15`} color={t.textMuted} />
        </div>

        {/* ECN grid */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {changes.map((c, i) => {
            const st = c.status;
            const bg = st === 'applied' ? 'rgba(34,197,94,0.15)' : st === 'pending' ? 'rgba(239,68,68,0.15)' : st === 'not_required' ? `${t.textMuted}10` : 'rgba(245,158,11,0.15)';
            const color = st === 'applied' ? '#22c55e' : st === 'pending' ? '#ef4444' : st === 'not_required' ? t.textDim : '#f59e0b';
            const icon = st === 'applied' ? '✅' : st === 'pending' ? '⏳' : st === 'not_required' ? '—' : '❓';
            return (
              <div key={i} onClick={() => setShowModal(c)} style={{ padding: '5px 8px', borderRadius: 6, background: bg, cursor: 'pointer', minWidth: 90, transition: 'all 0.1s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                <div style={{ fontSize: 9, fontWeight: 700, color, fontFamily: mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                  {icon} {c.step.split('\\n')[0].split(' ')[0]}
                </div>
                <div style={{ fontSize: 8, color: t.textDim, marginTop: 1 }}>{c.new || st}</div>
              </div>
            );
          })}
          {changes.length === 0 && <div style={{ fontSize: 12, color: t.textMuted, padding: 10 }}>No ECN columns found for this assembly</div>}
        </div>
      </div>

      {/* Component Traceability (for Ghost and Arm) */}
      {activeUnit.components && Object.keys(activeUnit.components).length > 0 && (
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${t.border}`, background: `${t.accent}05` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Component Traceability</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(activeUnit.components).map(([type, sn]) => (
              <div key={type} style={{ padding: '6px 10px', borderRadius: 8, background: t.bgCard, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: t.accent }}>{type}</div>
                <div style={{ fontSize: 11, fontFamily: mono, color: t.text }}>{sn}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Bar + Tree View (only if Supabase tree exists) */}
      {hasTree && (
        <>
          <TabBar dark={dark} activeTab={activeTab} onTabChange={setActiveTab} ecnCount={pendingChanges.length} tree={tree} />

          {activeTab === 'list' && (
            <ListTab
              dark={dark} role={role} activeUnit={activeUnit} changes={pendingChanges}
              ecnStepSet={ecnStepSet} cascade={cascade} applied={applied}
              allEcnApplied={allEcnApplied} expanded={expanded}
              setExpanded={setExpanded} setShowModal={setShowModal}
              getGroupCascadeCount={(g) => g.steps.filter((s) => cascade.get(s.sn)?.isCascade).length}
              tree={tree} dragState={dragState}
              onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
              onUpgrade={() => {}}
            />
          )}
          {activeTab === 'graph' && <GraphPlaceholder dark={dark} />}
          {activeTab === 'kanban' && <KanbanPlaceholder dark={dark} />}
        </>
      )}

      {!hasTree && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: t.textMuted }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Assembly tree not yet configured in Supabase for <span style={{ color: t.accent, fontFamily: mono }}>{assemblyType.tag}</span></div>
          <div style={{ fontSize: 12 }}>ECN tracking above is live from Google Sheets. Tree view will be available once assembly steps are added.</div>
        </div>
      )}

      {/* ECN Detail Modal */}
      {showModal && (
        <div onClick={() => setShowModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: t.bgCard, borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', border: `1px solid ${t.border}`, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>ECN Detail</div>
              <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', color: t.textMuted, fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, fontFamily: mono, marginBottom: 4 }}>{showModal.step}</div>
              <div style={{ fontSize: 12, color: t.text, lineHeight: 1.5 }}>{showModal.stepName}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: t.bg }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>Status</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: showModal.status === 'applied' ? '#22c55e' : showModal.status === 'pending' ? '#ef4444' : '#f59e0b' }}>
                  {showModal.status === 'applied' ? '✅ Applied' : showModal.status === 'pending' ? '⏳ Pending' : showModal.status === 'not_required' ? '— N/A' : '❓ ' + showModal.status}
                </div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: t.bg }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>Raw Value</div>
                <div style={{ fontSize: 12, fontFamily: mono, color: t.text }}>{showModal.new || '—'}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: t.textMuted, fontStyle: 'italic' }}>
              Data source: Google Sheets (live) — edit the spreadsheet to update.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ label, bg, color }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: bg, color }}>{label}</span>
  );
}
