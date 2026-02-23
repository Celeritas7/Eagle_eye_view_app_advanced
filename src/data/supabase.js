// ============================================================
// Supabase Client — Connected to Eagle_eye_ database
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wylxvmkcrexwfpjpbhyy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHh2bWtjcmV4d2ZwanBiaHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzkxMDYsImV4cCI6MjA4NDIxNTEwNn0.6Bxo42hx4jwlJGWnfjiTpiDUsYfc1QLTN3YtrU1efak';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// Table names (all prefixed with eagle_eye_app_)
// ============================================================
const T = {
  assemblies: 'eagle_eye_app_assemblies',
  groups: 'eagle_eye_app_groups',
  steps: 'eagle_eye_app_steps',
  parts: 'eagle_eye_app_parts',
  fasteners: 'eagle_eye_app_fasteners',
  stepLinks: 'eagle_eye_app_step_links',
  ecnLog: 'eagle_eye_app_ecn_log',
  units: 'eagle_eye_app_production_units',
  ecnApplications: 'eagle_eye_app_ecn_applications',
  ecnChangeRecords: 'eagle_eye_app_ecn_change_records',
  ecnRemovedParts: 'eagle_eye_app_ecn_removed_parts',
  masterParts: 'master_parts_list_all',
};

// Map assembly tag → display info
const ASSEMBLY_DISPLAY = {
  GST_assy: { id: 'GST', name: 'Ghost (Full Robot)', icon: '🤖', description: 'Complete robot assembly', color: '#f59e0b' },
  LAC_assy: { id: 'LAC', name: 'L-Motor', icon: '⚙️', description: 'L-motor unit', color: '#6366f1' },
  A12_assy: { id: 'A12', name: 'A12 Motor', icon: '⚙️', description: 'A12 motor unit', color: '#0ea5e9' },
  A35_assy: { id: 'A35', name: 'A35 Motor', icon: '⚙️', description: 'A35 motor unit', color: '#14b8a6' },
  A4A_assy: { id: 'A4A', name: 'A4 Motor', icon: '⚙️', description: 'A4 motor unit', color: '#a855f7' },
  MBB_assy: { id: 'MBB', name: 'Mobile Base', icon: '🔩', description: 'Mobile base platform', color: '#8b5cf6' },
  PLR_assy: { id: 'PLR', name: 'Pillar', icon: '🏗️', description: 'Pillar assembly', color: '#ec4899' },
  HBD_assy: { id: 'HBD', name: 'Head & Body', icon: '🤖', description: 'Head and Body assembly', color: '#f59e0b' },
  GPR_assy: { id: 'GPR', name: 'Gripper', icon: '🦾', description: 'Gripper mechanism', color: '#22c55e' },
  ARM_assy: { id: 'ARM', name: 'Arm', icon: '💪', description: 'Robot arm assembly', color: '#3b82f6' },
  DPK_assy: { id: 'DPK', name: 'Deploy Kit', icon: '📦', description: 'Deployment kit', color: '#f97316' },
};

// ============================================================
// Assembly Types
// ============================================================

export async function fetchAssemblyTypes() {
  const { data, error } = await supabase
    .from(T.assemblies)
    .select('*')
    .order('id');

  if (error) { console.error('fetchAssemblyTypes:', error); return []; }

  const enriched = await Promise.all(data.map(async (assy) => {
    const display = ASSEMBLY_DISPLAY[assy.tag] || {
      id: assy.tag.replace('_assy', '').toUpperCase(),
      name: assy.tag.replace('_assy', ''),
      icon: '📦',
      description: assy.tag,
      color: '#8b8fa3',
    };

    const { count: totalCount } = await supabase
      .from(T.units)
      .select('*', { count: 'exact', head: true })
      .eq('assembly_id', assy.id);

    const { count: outdatedCount } = await supabase
      .from(T.units)
      .select('*', { count: 'exact', head: true })
      .eq('assembly_id', assy.id)
      .eq('status', 'outdated');

    return {
      ...display,
      dbId: assy.id,
      tag: assy.tag,
      version: assy.version,
      unitCount: totalCount || 0,
      outdatedCount: outdatedCount || 0,
    };
  }));

  return enriched;
}

// ============================================================
// Units (Serial Numbers)
// ============================================================

export async function fetchUnits(assemblyDbId) {
  const { data, error } = await supabase
    .from(T.units)
    .select('*')
    .eq('assembly_id', assemblyDbId)
    .order('sn');

  if (error) { console.error('fetchUnits:', error); return []; }

  return data.map((u) => ({
    sn: u.sn,
    version: u.version,
    latestVersion: u.latest_version,
    status: u.status,
    assignedTo: u.assigned_to,
    notes: u.notes,
    dbId: u.id,
  }));
}

// ============================================================
// Assembly Tree (Groups → Steps → Parts + Fasteners)
// ============================================================

export async function fetchTree(assemblyDbId) {
  // 1. Groups
  const { data: groups, error: gErr } = await supabase
    .from(T.groups)
    .select('*')
    .eq('assembly_id', assemblyDbId)
    .order('sort_order');

  if (gErr) { console.error('fetchTree groups:', gErr); return []; }

  // 2. Steps for all groups
  const groupIds = groups.map((g) => g.id);
  const { data: steps, error: sErr } = await supabase
    .from(T.steps)
    .select('*')
    .in('group_id', groupIds)
    .order('sort_order');

  if (sErr) { console.error('fetchTree steps:', sErr); return []; }

  // 3. Part counts per step
  const stepIds = steps.map((s) => s.id);

  let parts = [];
  if (stepIds.length > 0) {
    const { data: pData } = await supabase
      .from(T.parts)
      .select('step_id')
      .in('step_id', stepIds);
    parts = pData || [];
  }

  // 4. Fastener counts per step
  let fasteners = [];
  if (stepIds.length > 0) {
    const { data: fData } = await supabase
      .from(T.fasteners)
      .select('step_id')
      .in('step_id', stepIds);
    fasteners = fData || [];
  }

  // Count per step
  const partCount = {};
  parts.forEach((p) => { partCount[p.step_id] = (partCount[p.step_id] || 0) + 1; });

  const fastenerCount = {};
  fasteners.forEach((f) => { fastenerCount[f.step_id] = (fastenerCount[f.step_id] || 0) + 1; });

  // 5. Build tree
  return groups.map((g, idx) => ({
    id: `g${g.id}`,
    dbId: g.id,
    name: g.label,
    icon: g.icon || '📦',
    color: g.color || '#8b8fa3',
    level: idx > 0 ? idx - 1 : null,
    sortOrder: g.sort_order,
    steps: steps
      .filter((s) => s.group_id === g.id)
      .map((s) => ({
        id: `s${s.id}`,
        dbId: s.id,
        sn: s.seq_tag || String(s.sort_order),
        name: s.label,
        type: (s.type || 'step').toUpperCase(),
        parts: partCount[s.id] || 0,
        fasteners: fastenerCount[s.id] || 0,
        sortOrder: s.sort_order,
        pn: s.pn,
        x: s.x,
        y: s.y,
        isLocked: s.is_locked,
        ecnStatus: s.ecn_status,
      })),
  }));
}

// ============================================================
// ECN Changes
// ============================================================

export async function fetchVersionChanges(fromVersion, toVersion) {
  const { data, error } = await supabase
    .from(T.ecnChangeRecords)
    .select(`
      *,
      removed_parts:eagle_eye_app_ecn_removed_parts(*)
    `)
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchVersionChanges:', error); return []; }

  return (data || []).map((c) => ({
    step: c.seq_tag,
    stepDbId: c.step_id,
    stepName: c.step_name,
    changeType: c.change_type,
    field: c.field,
    old: c.old_value,
    new: c.new_value,
    reason: c.reason,
    group: c.group_name,
    disposition: c.disposition,
    removedParts: (c.removed_parts || []).map((rp) => ({
      pn: rp.pn,
      name: rp.name,
      disposition: rp.disposition,
    })),
  }));
}

// ============================================================
// ECN Applications (per unit)
// ============================================================

export async function fetchAppliedChanges(unitSn) {
  const { data, error } = await supabase
    .from(T.ecnApplications)
    .select('unit_sn, seq_tag')
    .eq('unit_sn', unitSn)
    .eq('applied', true);

  if (error) { console.error('fetchAppliedChanges:', error); return new Set(); }

  return new Set((data || []).map((r) => `${r.unit_sn}-${r.seq_tag}`));
}

export async function markChangeApplied(unitSn, stepDbId, seqTag, applied, appliedBy) {
  const { error } = await supabase
    .from(T.ecnApplications)
    .upsert({
      unit_sn: unitSn,
      step_id: stepDbId,
      seq_tag: seqTag,
      applied,
      applied_by: appliedBy || 'operator',
      applied_at: new Date().toISOString(),
    }, { onConflict: 'unit_sn,step_id' });

  if (error) { console.error('markChangeApplied:', error); return false; }
  return true;
}

// ============================================================
// Unit Upgrade
// ============================================================

export async function upgradeUnit(unitSn, newVersion) {
  const { error } = await supabase
    .from(T.units)
    .update({
      version: newVersion,
      latest_version: newVersion,
      status: 'current',
      updated_at: new Date().toISOString(),
    })
    .eq('sn', unitSn);

  if (error) { console.error('upgradeUnit:', error); return false; }
  return true;
}

// ============================================================
// Step Reorder (admin)
// ============================================================

export async function saveStepOrder(steps) {
  const promises = steps.map((s, idx) =>
    supabase.from(T.steps).update({ sort_order: idx + 1 }).eq('id', s.dbId)
  );
  const results = await Promise.all(promises);
  const errors = results.filter((r) => r.error);
  if (errors.length) { console.error('saveStepOrder:', errors); return false; }
  return true;
}

// ============================================================
// Part Name Resolution
// ============================================================

export async function resolvePartName(partNumber) {
  const { data, error } = await supabase
    .from(T.masterParts)
    .select('name')
    .eq('part_number', partNumber)
    .single();

  if (error) return null;
  return data?.name || null;
}

// ============================================================
// Connection Check
// ============================================================

export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from(T.assemblies)
      .select('id, tag')
      .limit(1);

    if (error) return { connected: false, error: error.message };
    return { connected: true, data };
  } catch (e) {
    return { connected: false, error: e.message };
  }
}
