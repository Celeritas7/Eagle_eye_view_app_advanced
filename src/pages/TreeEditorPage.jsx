import { useState, useEffect, useCallback } from 'react';
import { getTheme, mono } from '../theme';
import {
  supabase, fetchAllAssemblies, fetchTreeForVersion, updateAssemblyVersion,
  createGroup, updateGroup, deleteGroup,
  createStep, updateStep, deleteStep,
  fetchStepParts, createPart, deletePart,
  fetchStepFasteners, createFastener, deleteFastener,
  fetchEcnLog, createEcnEntry, bulkUpdateUnitVersions,
  fetchVersionHistory, createNewVersion,
  ASSEMBLY_DISPLAY,
} from '../data/supabase';
import { fetchUnitsFromSheet, SHEET_CONFIG } from '../data/googleSheets';

const TABS = [
  { key: 'versions', label: '📋 Versions', desc: 'Create versions & auto-clone trees' },
  { key: 'tree', label: '🌲 Assembly Tree', desc: 'Edit groups, steps, parts per version' },
  { key: 'units', label: '🔧 Unit Versions', desc: 'View & assign versions to S/N' },
  { key: 'ecn', label: '📌 ECN Map', desc: 'Link ECNs to version bumps' },
];

export default function TreeEditorPage({ dark, onBack }) {
  const t = getTheme(dark);
  const [tab, setTab] = useState('versions');
  const [assemblies, setAssemblies] = useState([]);
  const [selectedAssy, setSelectedAssy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const reload = async () => {
    const data = await fetchAllAssemblies();
    setAssemblies(data);
    if (selectedAssy) {
      const updated = data.find((a) => a.id === selectedAssy.id);
      if (updated) setSelectedAssy(updated);
    }
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
    input: { padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontSize: 12, fontFamily: mono, outline: 'none', width: '100%', boxSizing: 'border-box' },
    btn: (bg, color) => ({ padding: '7px 14px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: mono }),
    btnOutline: { padding: '7px 14px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontSize: 11, cursor: 'pointer' },
    badge: (bg, color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: mono, background: bg, color }),
  };

  if (loading) return <div style={{ ...sty.page, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div style={{ color: t.textMuted }}>Loading...</div></div>;

  return (
    <div style={sty.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={sty.btnOutline}>← Home</button>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6', fontFamily: mono }}>🔧 Admin Console</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={selectedAssy?.id || ''} onChange={(e) => setSelectedAssy(assemblies.find((a) => a.id === parseInt(e.target.value)))}
            style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgCard, color: t.text, fontSize: 12, fontFamily: mono, cursor: 'pointer' }}>
            {assemblies.map((a) => <option key={a.id} value={a.id}>{a.display?.icon} {a.display?.name || a.tag}</option>)}
          </select>
          {selectedAssy && (
            <span style={sty.badge(selectedAssy.display?.color + '20', selectedAssy.display?.color)}>
              v{selectedAssy.version}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `1px solid ${t.border}`, paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: '10px 18px', border: 'none', borderBottom: tab === tb.key ? '2px solid #8b5cf6' : '2px solid transparent', background: tab === tb.key ? `rgba(139,92,246,0.06)` : 'transparent', color: tab === tb.key ? t.text : t.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: '8px 8px 0 0' }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {selectedAssy && tab === 'versions' && <VersionsTab dark={dark} assembly={selectedAssy} reload={reload} showToast={showToast} sty={sty} />}
      {selectedAssy && tab === 'tree' && <TreeTab dark={dark} assembly={selectedAssy} showToast={showToast} sty={sty} />}
      {selectedAssy && tab === 'units' && <UnitsTab dark={dark} assembly={selectedAssy} showToast={showToast} sty={sty} />}
      {selectedAssy && tab === 'ecn' && <EcnTab dark={dark} assembly={selectedAssy} showToast={showToast} sty={sty} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: toast.type === 'error' ? '#1e1214' : '#121e16', border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`, color: toast.type === 'error' ? '#f87171' : '#34d399' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 1: VERSIONS — Create, Clone, Track
// ============================================================
function VersionsTab({ dark, assembly, reload, showToast, sty }) {
  const t = getTheme(dark);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newVer, setNewVer] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const h = await fetchVersionHistory(assembly.id);
      setHistory(h);
      setLoading(false);
    })();
  }, [assembly.id, assembly.version]);

  const handleCreate = async () => {
    if (!newVer.trim()) { showToast('Enter a version number', 'error'); return; }
    if (newVer.trim() === assembly.version) { showToast('Version already exists', 'error'); return; }

    setCreating(true);
    const result = await createNewVersion(assembly.id, newVer.trim(), newNotes.trim(), 'admin');
    setCreating(false);

    if (result.ok) {
      showToast(`✓ Version ${newVer} created! Cloned ${result.clonedGroups} groups from v${result.oldVersion}. All units marked outdated.`);
      setNewVer(''); setNewNotes('');
      await reload();
      const h = await fetchVersionHistory(assembly.id);
      setHistory(h);
    } else {
      showToast(`Failed: ${result.error}`, 'error');
    }
  };

  return (
    <div>
      {/* Current version hero */}
      <div style={{ ...sty.card, borderLeft: `4px solid ${assembly.display?.color || '#8b5cf6'}`, display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
        <span style={{ fontSize: 36 }}>{assembly.display?.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{assembly.display?.name || assembly.tag}</div>
          <div style={{ fontSize: 11, color: t.textMuted, fontFamily: mono, marginTop: 2 }}>{assembly.tag}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 4 }}>CURRENT VERSION</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: assembly.display?.color || '#8b5cf6', fontFamily: mono }}>v{assembly.version}</div>
        </div>
      </div>

      {/* Create new version */}
      <div style={{ ...sty.card, borderLeft: '4px solid #22c55e' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>⬆ Create New Version</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          This will: ① Clone the current <span style={{ fontWeight: 700, color: t.text }}>v{assembly.version}</span> tree (groups → steps → parts → fasteners) into the new version
          ② Set the new version as current
          ③ Mark <span style={{ fontWeight: 700, color: '#ef4444' }}>ALL existing units as outdated</span> (they remain on their old version until upgraded)
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 100 }}>
            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 4 }}>New Version*</div>
            <input value={newVer} onChange={(e) => setNewVer(e.target.value)} placeholder={suggestNextVersion(assembly.version)} style={sty.input} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 4 }}>Notes (optional)</div>
            <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="What changed in this version..." style={sty.input} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          </div>
          <button onClick={handleCreate} disabled={creating || !newVer.trim()} style={{ ...sty.btn('#22c55e', '#000'), padding: '10px 24px', fontSize: 13, opacity: creating || !newVer.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            {creating ? 'Cloning tree...' : `Create v${newVer || '?'}`}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 10, color: t.textMuted }}>Quick:</span>
          {getQuickVersions(assembly.version).map((v) => (
            <button key={v} onClick={() => setNewVer(v)} style={{ ...sty.btnOutline, padding: '3px 10px', fontSize: 10, color: newVer === v ? '#22c55e' : t.textMuted, borderColor: newVer === v ? '#22c55e' : t.border }}>v{v}</button>
          ))}
        </div>
      </div>

      {/* Version history timeline */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 8 }}>VERSION HISTORY</div>
        {loading ? (
          <div style={{ color: t.textMuted, fontSize: 12 }}>Loading...</div>
        ) : history.length === 0 ? (
          <div style={{ ...sty.card, textAlign: 'center', color: t.textMuted, fontSize: 12 }}>
            No version history yet. Current version: v{assembly.version}
          </div>
        ) : (
          history.map((h, idx) => (
            <div key={h.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 2 }}>
              {/* Timeline line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: idx === 0 ? '#22c55e' : t.border, flexShrink: 0, marginTop: 6 }} />
                {idx < history.length - 1 && <div style={{ width: 1, flex: 1, background: t.border, minHeight: 30 }} />}
              </div>
              {/* Content */}
              <div style={{ ...sty.card, flex: 1, padding: '10px 14px', borderLeft: idx === 0 ? '3px solid #22c55e' : `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: mono, color: idx === 0 ? '#22c55e' : t.text }}>v{h.version}</span>
                  {idx === 0 && <span style={sty.badge('#22c55e20', '#22c55e')}>CURRENT</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: t.textMuted }}>{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
                {h.notes && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{h.notes}</div>}
                {h.created_by && <div style={{ fontSize: 10, color: t.textDim || t.textMuted, marginTop: 2 }}>by {h.created_by}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function suggestNextVersion(current) {
  const parts = current.split('.');
  const minor = parseInt(parts[1] || '0') + 1;
  return `${parts[0]}.${minor}`;
}

function getQuickVersions(current) {
  const [major, minor] = current.split('.').map(Number);
  return [`${major}.${(minor || 0) + 1}`, `${major + 1}.0`];
}

// ============================================================
// TAB 2: ASSEMBLY TREE (version-aware)
// ============================================================
function TreeTab({ dark, assembly, showToast, sty }) {
  const t = getTheme(dark);
  const [versions, setVersions] = useState([]);
  const [selectedVer, setSelectedVer] = useState(assembly.version);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [stepDetail, setStepDetail] = useState(null);
  const [addGroupName, setAddGroupName] = useState('');
  const [addStepGroup, setAddStepGroup] = useState(null);
  const [addStepLabel, setAddStepLabel] = useState('');
  const [addStepTag, setAddStepTag] = useState('');

  useEffect(() => {
    (async () => {
      const h = await fetchVersionHistory(assembly.id);
      const vers = h.map((v) => v.version);
      if (!vers.includes(assembly.version)) vers.unshift(assembly.version);
      setVersions(vers);
      setSelectedVer(assembly.version);
    })();
  }, [assembly.id, assembly.version]);

  const loadTree = useCallback(async () => {
    setLoading(true);
    const data = await fetchTreeForVersion(assembly.id, selectedVer);
    setTree(data);
    setExpanded(new Set(data.map((g) => g.id)));
    setLoading(false);
  }, [assembly.id, selectedVer]);

  useEffect(() => { loadTree(); }, [loadTree]);

  const isCurrent = selectedVer === assembly.version;

  const handleAddGroup = async () => {
    if (!addGroupName.trim() || !isCurrent) return;
    const r = await createGroup(assembly.id, addGroupName.trim(), '📦', '#8b8fa3', tree.length + 1);
    if (r) { showToast(`Group created`); setAddGroupName(''); loadTree(); }
  };

  const handleDeleteGroup = async (dbId, name) => {
    if (!isCurrent || !confirm(`Delete group "${name}" and all its steps?`)) return;
    if (await deleteGroup(dbId)) { showToast('Deleted'); loadTree(); }
  };

  const handleAddStep = async (groupDbId) => {
    if (!addStepLabel.trim() || !isCurrent) return;
    const group = tree.find((g) => g.dbId === groupDbId);
    const r = await createStep(groupDbId, addStepLabel.trim(), addStepTag.trim() || null, (group?.steps.length || 0) + 1, 'step');
    if (r) { showToast('Step added'); setAddStepLabel(''); setAddStepTag(''); setAddStepGroup(null); loadTree(); }
  };

  const handleDeleteStep = async (dbId, name) => {
    if (!isCurrent || !confirm(`Delete step "${name}"?`)) return;
    if (await deleteStep(dbId)) { showToast('Deleted'); loadTree(); if (stepDetail?.stepDbId === dbId) setStepDetail(null); }
  };

  const handleStepClick = async (step) => {
    if (stepDetail?.stepDbId === step.dbId) { setStepDetail(null); return; }
    const parts = await fetchStepParts(step.dbId);
    const fasteners = await fetchStepFasteners(step.dbId);
    setStepDetail({ stepDbId: step.dbId, stepName: step.name, parts, fasteners });
  };

  if (loading) return <div style={{ padding: 20, color: t.textMuted }}>Loading tree for v{selectedVer}...</div>;

  return (
    <div>
      {/* Version selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: t.textMuted }}>Viewing tree for:</span>
        {versions.map((v) => (
          <button key={v} onClick={() => { setSelectedVer(v); setStepDetail(null); }} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: mono, cursor: 'pointer',
            border: v === selectedVer ? '2px solid #8b5cf6' : `1px solid ${t.border}`,
            background: v === selectedVer ? 'rgba(139,92,246,0.1)' : 'transparent',
            color: v === selectedVer ? '#8b5cf6' : t.textMuted,
          }}>
            v{v} {v === assembly.version && '●'}
          </button>
        ))}
        {!isCurrent && (
          <span style={sty.badge('#f59e0b20', '#f59e0b')}>⚠ Read-only (old version)</span>
        )}
      </div>

      {tree.length === 0 ? (
        <div style={{ ...sty.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, color: t.textMuted, marginBottom: 8 }}>No tree defined for <span style={{ color: '#8b5cf6', fontFamily: mono }}>{assembly.tag} v{selectedVer}</span></div>
          {isCurrent && <div style={{ fontSize: 12, color: t.textDim || t.textMuted }}>Add a group below to start</div>}
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
                    {isCurrent && <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.dbId, group.name); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: '2px 6px', opacity: 0.4 }}>✕</button>}
                  </div>
                  {isExp && (
                    <div style={{ borderTop: `1px solid ${t.border}` }}>
                      {group.steps.map((step) => (
                        <div key={step.id} onClick={() => handleStepClick(step)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px 7px 28px', cursor: 'pointer', background: stepDetail?.stepDbId === step.dbId ? 'rgba(139,92,246,0.08)' : 'transparent', borderLeft: stepDetail?.stepDbId === step.dbId ? '2px solid #8b5cf6' : '2px solid transparent' }}
                          onMouseEnter={(e) => { if (stepDetail?.stepDbId !== step.dbId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={(e) => { if (stepDetail?.stepDbId !== step.dbId) e.currentTarget.style.background = 'transparent'; }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', fontFamily: mono, minWidth: 28 }}>{step.sn}</span>
                          <span style={{ fontSize: 12, color: t.text, flex: 1 }}>{step.name}</span>
                          <span style={{ fontSize: 9, color: t.textMuted, fontFamily: mono }}>{step.parts}P {step.fasteners}F</span>
                          {isCurrent && <button onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.dbId, step.name); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10, cursor: 'pointer', opacity: 0.4 }}>✕</button>}
                        </div>
                      ))}
                      {isCurrent && (addStepGroup === group.dbId ? (
                        <div style={{ display: 'flex', gap: 6, padding: '8px 14px 8px 28px', alignItems: 'center' }}>
                          <input placeholder="Tag" value={addStepTag} onChange={(e) => setAddStepTag(e.target.value)} style={{ ...sty.input, width: 50 }} />
                          <input placeholder="Step name" value={addStepLabel} onChange={(e) => setAddStepLabel(e.target.value)} style={{ ...sty.input, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleAddStep(group.dbId)} />
                          <button onClick={() => handleAddStep(group.dbId)} style={sty.btn('#8b5cf6', '#fff')}>+</button>
                          <button onClick={() => setAddStepGroup(null)} style={sty.btnOutline}>✕</button>
                        </div>
                      ) : (
                        <div onClick={() => setAddStepGroup(group.dbId)} style={{ padding: '6px 14px 6px 28px', cursor: 'pointer', color: t.textMuted, fontSize: 11, opacity: 0.6 }}>+ Add step</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Detail */}
          {stepDetail && (
            <div style={{ width: 340, flexShrink: 0 }}>
              <StepDetailPanel dark={dark} detail={stepDetail} setDetail={setStepDetail} showToast={showToast} sty={sty} readOnly={!isCurrent} />
            </div>
          )}
        </div>
      )}

      {/* Add group */}
      {isCurrent && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <input placeholder="New group name..." value={addGroupName} onChange={(e) => setAddGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()} style={{ ...sty.input, width: 250 }} />
          <button onClick={handleAddGroup} style={sty.btn('#8b5cf6', '#fff')}>+ Add Group</button>
        </div>
      )}
    </div>
  );
}

// ---- Step Detail Panel ----
function StepDetailPanel({ dark, detail, setDetail, showToast, sty, readOnly }) {
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
          {!readOnly && <button onClick={async () => { if (await deletePart(p.id)) { showToast('Removed'); refresh(); } }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10, cursor: 'pointer', opacity: 0.5 }}>✕</button>}
        </div>
      ))}
      {!readOnly && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <input placeholder="P/N" value={newPn} onChange={(e) => setNewPn(e.target.value)} style={{ ...sty.input, width: 80 }} />
          <input placeholder="Name" value={newPname} onChange={(e) => setNewPname(e.target.value)} style={{ ...sty.input, flex: 1 }} />
          <button onClick={async () => {
            if (!newPn.trim()) return;
            if (await createPart(detail.stepDbId, newPn.trim(), newPname.trim(), 1, detail.parts.length + 1)) { showToast('Added'); setNewPn(''); setNewPname(''); refresh(); }
          }} style={sty.btn('#0ea5e9', '#fff')}>+</button>
        </div>
      )}

      {/* Fasteners */}
      <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 }}>Fasteners ({detail.fasteners.length})</div>
      {detail.fasteners.map((f) => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 11 }}>
          <span style={{ fontFamily: mono, color: '#f59e0b', fontWeight: 600 }}>{f.code}</span>
          <span style={{ color: t.textMuted, flex: 1 }}>{f.torque || ''}</span>
          <span style={{ color: t.textMuted, fontFamily: mono }}>×{f.qty}</span>
          {!readOnly && <button onClick={async () => { if (await deleteFastener(f.id)) { showToast('Removed'); refresh(); } }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10, cursor: 'pointer', opacity: 0.5 }}>✕</button>}
        </div>
      ))}
      {!readOnly && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <input placeholder="Code" value={newFcode} onChange={(e) => setNewFcode(e.target.value)} style={{ ...sty.input, width: 80 }} />
          <input placeholder="Torque" value={newFtorque} onChange={(e) => setNewFtorque(e.target.value)} style={{ ...sty.input, flex: 1 }} />
          <button onClick={async () => {
            if (!newFcode.trim()) return;
            if (await createFastener(detail.stepDbId, newFcode.trim(), newFtorque.trim(), null, 1, detail.fasteners.length + 1)) { showToast('Added'); setNewFcode(''); setNewFtorque(''); refresh(); }
          }} style={sty.btn('#f59e0b', '#000')}>+</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 3: UNIT VERSIONS
// ============================================================
function UnitsTab({ dark, assembly, showToast, sty }) {
  const t = getTheme(dark);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [targetVersion, setTargetVersion] = useState(assembly.version);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);

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
    if (filter === 'outdated') return u.status === 'outdated' || u.pendingEcns > 0;
    if (filter === 'current') return u.status === 'current' && u.pendingEcns === 0;
    return true;
  });

  const toggle = (sn) => { const n = new Set(selected); n.has(sn) ? n.delete(sn) : n.add(sn); setSelected(n); };
  const selectAll = () => { const n = new Set(); filtered.forEach((u) => n.add(u.sn)); setSelected(n); };

  const handleBulkAssign = async () => {
    if (!targetVersion.trim() || selected.size === 0) return;
    setSaving(true);
    const result = await bulkUpdateUnitVersions([...selected], targetVersion.trim(), 'current');
    setSaving(false);
    showToast(`✓ ${result.success} units upgraded to v${targetVersion.trim()}`);
    setSelected(new Set());
  };

  if (loading) return <div style={{ padding: 20, color: t.textMuted }}>Loading units...</div>;
  if (!sheetName) return <div style={{ ...sty.card, color: t.textMuted }}>No sheet configured for {assembly.tag}</div>;

  const outdatedCount = units.filter((u) => u.pendingEcns > 0 || u.status === 'outdated').length;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ ...sty.card, flex: 1, minWidth: 120, textAlign: 'center', padding: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.text, fontFamily: mono }}>{units.length}</div>
          <div style={{ fontSize: 10, color: t.textMuted }}>Total Units</div>
        </div>
        <div style={{ ...sty.card, flex: 1, minWidth: 120, textAlign: 'center', padding: 14, borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#22c55e', fontFamily: mono }}>{units.length - outdatedCount}</div>
          <div style={{ fontSize: 10, color: t.textMuted }}>Current (v{assembly.version})</div>
        </div>
        <div style={{ ...sty.card, flex: 1, minWidth: 120, textAlign: 'center', padding: 14, borderLeft: '3px solid #ef4444' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', fontFamily: mono }}>{outdatedCount}</div>
          <div style={{ fontSize: 10, color: t.textMuted }}>Outdated / Pending ECN</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ k: 'all', l: `All (${units.length})` }, { k: 'outdated', l: `Outdated (${outdatedCount})` }, { k: 'current', l: `Current` }].map(({ k, l }) => (
          <button key={k} onClick={() => setFilter(k)} style={{ ...sty.btnOutline, background: filter === k ? 'rgba(139,92,246,0.1)' : 'transparent', color: filter === k ? '#8b5cf6' : t.textMuted, borderColor: filter === k ? '#8b5cf6' : t.border }}>{l}</button>
        ))}
        <button onClick={selectAll} style={{ ...sty.btnOutline, marginLeft: 'auto' }}>Select all ({filtered.length})</button>
        {selected.size > 0 && <button onClick={() => setSelected(new Set())} style={sty.btnOutline}>Clear</button>}
      </div>

      {/* Unit grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 4, maxHeight: 380, overflowY: 'auto', padding: 2, marginBottom: 12 }}>
        {filtered.map((u) => {
          const sel = selected.has(u.sn);
          const isOutdated = u.pendingEcns > 0;
          return (
            <div key={u.sn} onClick={() => toggle(u.sn)} style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: sel ? '2px solid #8b5cf6' : `1px solid ${t.border}`, background: sel ? 'rgba(139,92,246,0.08)' : t.bgCard }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: mono, color: t.text, flex: 1 }}>{u.sn}</span>
                <span style={{ ...sty.badge(isOutdated ? '#ef444420' : '#22c55e20', isOutdated ? '#ef4444' : '#22c55e'), fontSize: 9 }}>
                  v{u.version || '1.0'}
                </span>
              </div>
              <div style={{ fontSize: 9, color: isOutdated ? '#f59e0b' : t.textMuted, marginTop: 3 }}>
                {isOutdated ? `⏳ ${u.pendingEcns} pending ECN` : '✓ current'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk assign bar */}
      {selected.size > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{selected.size} units selected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>Upgrade to:</span>
            <input value={targetVersion} onChange={(e) => setTargetVersion(e.target.value)} style={{ ...sty.input, width: 80 }} />
            <button onClick={handleBulkAssign} disabled={saving} style={{ ...sty.btn('#22c55e', '#000'), padding: '10px 20px', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving...' : `Upgrade → v${targetVersion}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 4: ECN MAP
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
      showToast(`ECN ${newCode} → v${newTo} created`);
      setNewCode(''); setNewDesc(''); setNewFrom(''); setNewTo('');
      const data = await fetchEcnLog(assembly.id);
      setEcnLog(data);
    } else showToast('Failed — run 04_version_schema_update.sql first', 'error');
  };

  if (loading) return <div style={{ padding: 20, color: t.textMuted }}>Loading...</div>;

  return (
    <div>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
        Link ECN codes to version transitions for <span style={{ color: assembly.display?.color, fontWeight: 700 }}>{assembly.display?.name}</span>.
      </div>

      {ecnLog.length > 0 ? (
        ecnLog.map((ecn) => (
          <div key={ecn.id} style={{ ...sty.card, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono, color: t.text }}>{ecn.ecn_code}</div>
              {ecn.description && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{ecn.description}</div>}
            </div>
            <div style={{ fontSize: 13, fontFamily: mono }}>
              <span style={{ color: '#ef4444' }}>v{ecn.from_version}</span>
              <span style={{ color: t.textMuted }}> → </span>
              <span style={{ color: '#22c55e' }}>v{ecn.to_version}</span>
            </div>
          </div>
        ))
      ) : (
        <div style={{ ...sty.card, textAlign: 'center', padding: 30, color: t.textMuted, fontSize: 12, marginBottom: 16 }}>
          No ECN entries yet. Create one below or use the Versions tab to bump the version.
        </div>
      )}

      {/* Add form */}
      <div style={{ ...sty.card, borderLeft: '4px solid #8b5cf6' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', marginBottom: 10 }}>+ Link ECN to Version</div>
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
          <button onClick={handleAdd} style={{ ...sty.btn('#8b5cf6', '#fff'), padding: '10px 20px' }}>Create</button>
        </div>
      </div>
    </div>
  );
}
