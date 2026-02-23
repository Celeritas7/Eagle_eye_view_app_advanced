import { useState, useEffect, useCallback } from 'react';
import { getTheme, mono } from '../theme';
import {
  supabase, fetchAllAssemblies, fetchTree, updateAssemblyVersion,
  createGroup, updateGroup, deleteGroup,
  createStep, updateStep, deleteStep, saveStepOrder,
  fetchStepParts, createPart, updatePart, deletePart,
  fetchStepFasteners, createFastener, updateFastener, deleteFastener,
  fetchEcnLog, createEcnEntry, bulkUpdateUnitVersions,
  ASSEMBLY_DISPLAY,
} from '../data/supabase';
import { fetchUnitsFromSheet, SHEET_CONFIG } from '../data/googleSheets';

const TABS = [
  { key: 'tree', label: '🌲 Assembly Tree', desc: 'Groups, steps, parts, fasteners' },
  { key: 'versions', label: '📋 Versions', desc: 'Define assembly versions' },
  { key: 'units', label: '🔧 Unit Assignment', desc: 'Assign versions to units' },
  { key: 'ecn', label: '📌 ECN Map', desc: 'Link ECNs to version bumps' },
];

export default function TreeEditorPage({ dark, onBack }) {
  const t = getTheme(dark);
  const [tab, setTab] = useState('tree');
  const [assemblies, setAssemblies] = useState([]);
  const [selectedAssy, setSelectedAssy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchAllAssemblies();
      setAssemblies(data);
      if (data.length) setSelectedAssy(data[0]);
      setLoading(false);
    })();
  }, []);

  const sty = {
    page: { minHeight: '100vh', background: t.bg, padding: '16px 20px', maxWidth: 1200, margin: '0 auto' },
    card: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, marginBottom: 10 },
    input: { padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontSize: 12, fontFamily: mono, outline: 'none', width: '100%' },
    btn: (bg, color) => ({ padding: '7px 14px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: mono }),
    btnOutline: { padding: '7px 14px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontSize: 11, cursor: 'pointer' },
  };

  if (loading) return <div style={{ ...sty.page, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div style={{ color: t.textMuted }}>Loading assemblies...</div></div>;

  return (
    <div style={sty.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={sty.btnOutline}>← Home</button>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6', fontFamily: mono }}>🔧 Tree Editor</div>
        <div style={{ fontSize: 11, color: t.textMuted }}>Admin only</div>

        {/* Assembly selector */}
        <select value={selectedAssy?.id || ''} onChange={(e) => setSelectedAssy(assemblies.find((a) => a.id === parseInt(e.target.value)))}
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgCard, color: t.text, fontSize: 12, fontFamily: mono, cursor: 'pointer' }}>
          {assemblies.map((a) => <option key={a.id} value={a.id}>{a.display?.icon} {a.display?.name || a.tag} (v{a.version})</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${t.border}`, paddingBottom: 8, flexWrap: 'wrap' }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: tab === tb.key ? `1px solid ${t.border}` : '1px solid transparent', borderBottom: tab === tb.key ? `2px solid #8b5cf6` : '2px solid transparent', background: tab === tb.key ? t.bgCard : 'transparent', color: tab === tb.key ? t.text : t.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedAssy && tab === 'tree' && <TreeTab dark={dark} assembly={selectedAssy} showToast={showToast} sty={sty} />}
      {selectedAssy && tab === 'versions' && <VersionsTab dark={dark} assembly={selectedAssy} assemblies={assemblies} setAssemblies={setAssemblies} showToast={showToast} sty={sty} />}
      {selectedAssy && tab === 'units' && <UnitsTab dark={dark} assembly={selectedAssy} showToast={showToast} sty={sty} />}
      {selectedAssy && tab === 'ecn' && <EcnTab dark={dark} assembly={selectedAssy} showToast={showToast} sty={sty} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: toast.type === 'error' ? '#1e1214' : '#121e16', border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, color: toast.type === 'error' ? '#f87171' : '#34d399' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 1: ASSEMBLY TREE
// ============================================================
function TreeTab({ dark, assembly, showToast, sty }) {
  const t = getTheme(dark);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [editingStep, setEditingStep] = useState(null);
  const [stepDetail, setStepDetail] = useState(null); // { stepDbId, parts, fasteners }
  const [addGroupName, setAddGroupName] = useState('');
  const [addStepGroup, setAddStepGroup] = useState(null);
  const [addStepLabel, setAddStepLabel] = useState('');
  const [addStepTag, setAddStepTag] = useState('');

  const loadTree = useCallback(async () => {
    setLoading(true);
    const data = await fetchTree(assembly.id);
    setTree(data);
    setExpanded(new Set(data.map((g) => g.id)));
    setLoading(false);
  }, [assembly.id]);

  useEffect(() => { loadTree(); }, [loadTree]);

  const handleAddGroup = async () => {
    if (!addGroupName.trim()) return;
    const r = await createGroup(assembly.id, addGroupName.trim(), '📦', '#8b8fa3', tree.length + 1);
    if (r) { showToast(`Group "${addGroupName}" created`); setAddGroupName(''); loadTree(); }
    else showToast('Failed to create group', 'error');
  };

  const handleDeleteGroup = async (dbId, name) => {
    if (!confirm(`Delete group "${name}" and all its steps?`)) return;
    if (await deleteGroup(dbId)) { showToast(`Group "${name}" deleted`); loadTree(); }
    else showToast('Delete failed', 'error');
  };

  const handleAddStep = async (groupDbId) => {
    if (!addStepLabel.trim()) return;
    const group = tree.find((g) => g.dbId === groupDbId);
    const order = group ? group.steps.length + 1 : 1;
    const r = await createStep(groupDbId, addStepLabel.trim(), addStepTag.trim() || null, order, 'step');
    if (r) { showToast('Step added'); setAddStepLabel(''); setAddStepTag(''); setAddStepGroup(null); loadTree(); }
    else showToast('Failed to add step', 'error');
  };

  const handleDeleteStep = async (dbId, name) => {
    if (!confirm(`Delete step "${name}"?`)) return;
    if (await deleteStep(dbId)) { showToast('Step deleted'); loadTree(); if (stepDetail?.stepDbId === dbId) setStepDetail(null); }
    else showToast('Delete failed', 'error');
  };

  const handleStepClick = async (step) => {
    if (stepDetail?.stepDbId === step.dbId) { setStepDetail(null); return; }
    const parts = await fetchStepParts(step.dbId);
    const fasteners = await fetchStepFasteners(step.dbId);
    setStepDetail({ stepDbId: step.dbId, stepName: step.name, parts, fasteners });
  };

  if (loading) return <div style={{ padding: 20, color: t.textMuted }}>Loading tree...</div>;

  return (
    <div>
      {tree.length === 0 ? (
        <div style={{ ...sty.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, color: t.textMuted, marginBottom: 12 }}>No groups/steps defined for <span style={{ color: '#8b5cf6', fontFamily: mono }}>{assembly.tag}</span></div>
          <div style={{ fontSize: 12, color: t.textDim }}>Add a group below to start building the assembly tree</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Left: Tree */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {tree.map((group) => {
              const isExp = expanded.has(group.id);
              return (
                <div key={group.id} style={{ ...sty.card, padding: 0, overflow: 'hidden' }}>
                  <div onClick={() => { const n = new Set(expanded); isExp ? n.delete(group.id) : n.add(group.id); setExpanded(n); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', borderLeft: `3px solid ${group.color}` }}>
                    <span style={{ fontSize: 14 }}>{group.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text, flex: 1 }}>{group.name}</span>
                    <span style={{ fontSize: 10, color: t.textMuted, fontFamily: mono }}>{group.steps.length} steps</span>
                    <span style={{ fontSize: 10, color: t.textMuted, transition: 'transform 0.2s', transform: isExp ? 'rotate(180deg)' : 'none' }}>▼</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.dbId, group.name); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: '2px 6px', opacity: 0.5 }}>✕</button>
                  </div>
                  {isExp && (
                    <div style={{ borderTop: `1px solid ${t.border}` }}>
                      {group.steps.map((step, idx) => (
                        <div key={step.id} onClick={() => handleStepClick(step)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px 7px 28px', cursor: 'pointer', background: stepDetail?.stepDbId === step.dbId ? `rgba(139,92,246,0.08)` : 'transparent', borderLeft: stepDetail?.stepDbId === step.dbId ? '2px solid #8b5cf6' : '2px solid transparent' }}
                          onMouseEnter={(e) => { if (stepDetail?.stepDbId !== step.dbId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={(e) => { if (stepDetail?.stepDbId !== step.dbId) e.currentTarget.style.background = 'transparent'; }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', fontFamily: mono, minWidth: 28 }}>{step.sn}</span>
                          <span style={{ fontSize: 12, color: t.text, flex: 1 }}>{step.name}</span>
                          <span style={{ fontSize: 9, color: t.textMuted, fontFamily: mono }}>{step.parts}P {step.fasteners}F</span>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.dbId, step.name); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10, cursor: 'pointer', opacity: 0.4 }}>✕</button>
                        </div>
                      ))}
                      {/* Add step inline */}
                      {addStepGroup === group.dbId ? (
                        <div style={{ display: 'flex', gap: 6, padding: '8px 14px 8px 28px', alignItems: 'center' }}>
                          <input placeholder="Tag (1a)" value={addStepTag} onChange={(e) => setAddStepTag(e.target.value)} style={{ ...sty.input, width: 50 }} />
                          <input placeholder="Step name" value={addStepLabel} onChange={(e) => setAddStepLabel(e.target.value)} style={{ ...sty.input, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleAddStep(group.dbId)} />
                          <button onClick={() => handleAddStep(group.dbId)} style={sty.btn('#8b5cf6', '#fff')}>Add</button>
                          <button onClick={() => setAddStepGroup(null)} style={sty.btnOutline}>✕</button>
                        </div>
                      ) : (
                        <div onClick={() => setAddStepGroup(group.dbId)} style={{ padding: '6px 14px 6px 28px', cursor: 'pointer', color: t.textMuted, fontSize: 11 }}>
                          + Add step
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Step detail panel */}
          {stepDetail && (
            <div style={{ width: 340, flexShrink: 0 }}>
              <StepDetailPanel dark={dark} detail={stepDetail} setDetail={setStepDetail} showToast={showToast} sty={sty} />
            </div>
          )}
        </div>
      )}

      {/* Add group */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <input placeholder="New group name..." value={addGroupName} onChange={(e) => setAddGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()} style={{ ...sty.input, width: 250 }} />
        <button onClick={handleAddGroup} style={sty.btn('#8b5cf6', '#fff')}>+ Add Group</button>
      </div>
    </div>
  );
}

// Step detail side panel (parts + fasteners)
function StepDetailPanel({ dark, detail, setDetail, showToast, sty }) {
  const t = getTheme(dark);
  const [newPn, setNewPn] = useState('');
  const [newPname, setNewPname] = useState('');
  const [newFcode, setNewFcode] = useState('');
  const [newFtorque, setNewFtorque] = useState('');

  const refresh = async () => {
    const parts = await fetchStepParts(detail.stepDbId);
    const fasteners = await fetchStepFasteners(detail.stepDbId);
    setDetail({ ...detail, parts, fasteners });
  };

  return (
    <div style={{ ...sty.card, position: 'sticky', top: 80 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6', marginBottom: 12 }}>📋 {detail.stepName}</div>

      {/* Parts */}
      <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Parts ({detail.parts.length})</div>
      {detail.parts.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 11 }}>
          <span style={{ fontFamily: mono, color: '#0ea5e9', fontWeight: 600, minWidth: 80 }}>{p.pn}</span>
          <span style={{ color: t.text, flex: 1 }}>{p.name}</span>
          <span style={{ color: t.textMuted, fontFamily: mono }}>×{p.qty}</span>
          <button onClick={async () => { if (await deletePart(p.id)) { showToast('Part removed'); refresh(); } }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10, cursor: 'pointer', opacity: 0.5 }}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <input placeholder="P/N" value={newPn} onChange={(e) => setNewPn(e.target.value)} style={{ ...sty.input, width: 80 }} />
        <input placeholder="Name" value={newPname} onChange={(e) => setNewPname(e.target.value)} style={{ ...sty.input, flex: 1 }} />
        <button onClick={async () => {
          if (!newPn.trim()) return;
          if (await createPart(detail.stepDbId, newPn.trim(), newPname.trim(), 1, detail.parts.length + 1)) { showToast('Part added'); setNewPn(''); setNewPname(''); refresh(); }
        }} style={sty.btn('#0ea5e9', '#fff')}>+</button>
      </div>

      {/* Fasteners */}
      <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 }}>Fasteners ({detail.fasteners.length})</div>
      {detail.fasteners.map((f) => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 11 }}>
          <span style={{ fontFamily: mono, color: '#f59e0b', fontWeight: 600 }}>{f.code}</span>
          <span style={{ color: t.textMuted, flex: 1 }}>{f.torque || ''} {f.loctite ? `L${f.loctite}` : ''}</span>
          <span style={{ color: t.textMuted, fontFamily: mono }}>×{f.qty}</span>
          <button onClick={async () => { if (await deleteFastener(f.id)) { showToast('Fastener removed'); refresh(); } }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10, cursor: 'pointer', opacity: 0.5 }}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <input placeholder="Code" value={newFcode} onChange={(e) => setNewFcode(e.target.value)} style={{ ...sty.input, width: 80 }} />
        <input placeholder="Torque" value={newFtorque} onChange={(e) => setNewFtorque(e.target.value)} style={{ ...sty.input, flex: 1 }} />
        <button onClick={async () => {
          if (!newFcode.trim()) return;
          if (await createFastener(detail.stepDbId, newFcode.trim(), newFtorque.trim(), null, 1, detail.fasteners.length + 1)) { showToast('Fastener added'); setNewFcode(''); setNewFtorque(''); refresh(); }
        }} style={sty.btn('#f59e0b', '#000')}>+</button>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2: VERSIONS
// ============================================================
function VersionsTab({ dark, assembly, assemblies, setAssemblies, showToast, sty }) {
  const t = getTheme(dark);
  const [editId, setEditId] = useState(null);
  const [editVer, setEditVer] = useState('');

  const handleSave = async (id) => {
    if (!editVer.trim()) return;
    if (await updateAssemblyVersion(id, editVer.trim())) {
      showToast(`Version updated to ${editVer.trim()}`);
      setAssemblies(assemblies.map((a) => a.id === id ? { ...a, version: editVer.trim() } : a));
      setEditId(null);
    } else showToast('Failed to update', 'error');
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12 }}>Define the current version for each assembly type. When you bump a version, units on older versions will show as "outdated".</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {assemblies.map((a) => {
          const d = a.display || {};
          const isEditing = editId === a.id;
          return (
            <div key={a.id} style={{ ...sty.card, borderLeft: `3px solid ${d.color || '#888'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{d.name || a.tag}</div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontFamily: mono }}>{a.tag}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10, color: t.textMuted }}>Current version:</div>
                {isEditing ? (
                  <>
                    <input value={editVer} onChange={(e) => setEditVer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave(a.id)} style={{ ...sty.input, width: 80 }} autoFocus />
                    <button onClick={() => handleSave(a.id)} style={sty.btn('#22c55e', '#000')}>Save</button>
                    <button onClick={() => setEditId(null)} style={sty.btnOutline}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16, fontWeight: 800, color: d.color || '#8b5cf6', fontFamily: mono }}>v{a.version}</span>
                    <button onClick={() => { setEditId(a.id); setEditVer(a.version); }} style={sty.btn(`${d.color || '#8b5cf6'}20`, d.color || '#8b5cf6')}>Edit</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TAB 3: UNIT VERSION ASSIGNMENT
// ============================================================
function UnitsTab({ dark, assembly, showToast, sty }) {
  const t = getTheme(dark);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [targetVersion, setTargetVersion] = useState('');
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  // Find sheet name for this assembly
  const sheetEntry = Object.entries(SHEET_CONFIG).find(([_, cfg]) => cfg.tag === assembly.tag);
  const sheetName = sheetEntry ? sheetEntry[0] : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (sheetName) {
        const data = await fetchUnitsFromSheet(sheetName);
        setUnits(data);
      }
      setLoading(false);
    })();
  }, [sheetName]);

  const filtered = units.filter((u) => {
    if (filter === 'pending') return u.pendingEcns > 0;
    if (filter === 'clear') return u.pendingEcns === 0;
    return true;
  });

  const toggle = (sn) => { const n = new Set(selected); n.has(sn) ? n.delete(sn) : n.add(sn); setSelected(n); };
  const selectAll = () => { const n = new Set(selected); filtered.forEach((u) => n.add(u.sn)); setSelected(n); };

  const handleBulkAssign = async () => {
    if (!targetVersion.trim() || selected.size === 0) return;
    setSaving(true);
    const result = await bulkUpdateUnitVersions([...selected], targetVersion.trim(), 'current');
    setSaving(false);
    if (result.success > 0) showToast(`✓ ${result.success} units updated to v${targetVersion.trim()}`);
    if (result.failed > 0) showToast(`${result.failed} units failed`, 'error');
    setSelected(new Set());
  };

  if (loading) return <div style={{ padding: 20, color: t.textMuted }}>Loading units from Google Sheets...</div>;
  if (!sheetName) return <div style={{ ...sty.card, color: t.textMuted }}>No Google Sheets tab configured for {assembly.tag}</div>;

  return (
    <div>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12 }}>
        Select units from <span style={{ color: '#22c55e', fontFamily: mono }}>{sheetName}</span> and assign a version. Data is live from Google Sheets.
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'pending', 'clear'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...sty.btnOutline, background: filter === f ? `rgba(139,92,246,0.1)` : 'transparent', color: filter === f ? '#8b5cf6' : t.textMuted, borderColor: filter === f ? '#8b5cf6' : t.border }}>
            {f === 'all' ? `All (${units.length})` : f === 'pending' ? `Pending ECN` : 'ECN Clear'}
          </button>
        ))}
        <button onClick={selectAll} style={{ ...sty.btnOutline, marginLeft: 'auto' }}>Select all ({filtered.length})</button>
        <button onClick={() => setSelected(new Set())} style={sty.btnOutline}>Clear selection</button>
      </div>

      {/* Unit grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 4, maxHeight: 350, overflowY: 'auto', padding: 2, marginBottom: 12 }}>
        {filtered.map((u) => {
          const sel = selected.has(u.sn);
          return (
            <div key={u.sn} onClick={() => toggle(u.sn)} style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer', border: sel ? '2px solid #8b5cf6' : `1px solid ${t.border}`, background: sel ? 'rgba(139,92,246,0.08)' : t.bgCard, transition: 'all 0.1s' }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: mono, color: t.text }}>{u.sn}</div>
              <div style={{ fontSize: 9, color: u.pendingEcns > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                {u.pendingEcns > 0 ? `⏳ ${u.pendingEcns} pending` : '✓ clear'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign bar */}
      {selected.size > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{selected.size} units selected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>Assign version:</span>
            <input value={targetVersion} onChange={(e) => setTargetVersion(e.target.value)} placeholder="e.g. 2.0" style={{ ...sty.input, width: 80 }} />
            <button onClick={handleBulkAssign} disabled={saving || !targetVersion.trim()} style={{ ...sty.btn('#8b5cf6', '#fff'), opacity: saving || !targetVersion.trim() ? 0.5 : 1 }}>
              {saving ? 'Saving...' : `Assign v${targetVersion || '?'} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 4: ECN → VERSION MAP
// ============================================================
function EcnTab({ dark, assembly, showToast, sty }) {
  const t = getTheme(dark);
  const [ecnLog, setEcnLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchEcnLog(assembly.id);
      setEcnLog(data);
      setLoading(false);
    })();
  }, [assembly.id]);

  const handleAdd = async () => {
    if (!newCode.trim() || !newTo.trim()) { showToast('ECN code and target version required', 'error'); return; }
    const r = await createEcnEntry(assembly.id, newCode.trim(), newDesc.trim(), newFrom.trim() || assembly.version, newTo.trim());
    if (r) {
      showToast(`ECN ${newCode} linked: v${newFrom || assembly.version} → v${newTo}`);
      setNewCode(''); setNewDesc(''); setNewFrom(''); setNewTo('');
      const data = await fetchEcnLog(assembly.id);
      setEcnLog(data);
    } else showToast('Failed to create ECN entry', 'error');
  };

  if (loading) return <div style={{ padding: 20, color: t.textMuted }}>Loading ECN log...</div>;

  return (
    <div>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
        Map ECN changes to version bumps for <span style={{ color: assembly.display?.color, fontWeight: 700 }}>{assembly.display?.name}</span>.
        When an ECN is applied, units should be upgraded to the target version.
      </div>

      {/* Existing ECN entries */}
      {ecnLog.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          {ecnLog.map((ecn) => (
            <div key={ecn.id} style={{ ...sty.card, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ecn.status === 'approved' ? '#22c55e' : '#f59e0b' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: mono }}>{ecn.ecn_code}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{ecn.description || 'No description'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontFamily: mono }}>
                  <span style={{ color: '#ef4444' }}>v{ecn.from_version}</span>
                  <span style={{ color: t.textMuted }}> → </span>
                  <span style={{ color: '#22c55e' }}>v{ecn.to_version}</span>
                </div>
                <div style={{ fontSize: 9, color: t.textMuted }}>{ecn.status}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...sty.card, textAlign: 'center', padding: 30, color: t.textMuted, fontSize: 12, marginBottom: 16 }}>
          No ECN entries yet for this assembly
        </div>
      )}

      {/* Add new ECN */}
      <div style={{ ...sty.card, borderLeft: '3px solid #8b5cf6' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 10 }}>+ New ECN → Version Link</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>ECN Code*</div>
            <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="GP-ECN-001" style={sty.input} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>Description</div>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What changed..." style={sty.input} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>From Version</div>
            <input value={newFrom} onChange={(e) => setNewFrom(e.target.value)} placeholder={assembly.version} style={sty.input} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 3 }}>To Version*</div>
            <input value={newTo} onChange={(e) => setNewTo(e.target.value)} placeholder="2.0" style={sty.input} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          </div>
          <button onClick={handleAdd} style={{ ...sty.btn('#8b5cf6', '#fff'), padding: '10px 20px' }}>Create ECN Link</button>
        </div>
      </div>
    </div>
  );
}
