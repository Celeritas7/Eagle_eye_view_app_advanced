// ============================================================
// Constants
// ============================================================

export const ROLES = {
  admin: { label: 'Admin', color: '#f59e0b', icon: '🔧' },
  operator: { label: 'Operator', color: '#3b82f6', icon: '🔨' },
  viewer: { label: 'Viewer', color: '#8b8fa3', icon: '👁' },
};

// Disposition: what to do with removed parts during ECN
// Default for ECN-changed parts = scrap, everything else = reuse
// Admin can override to rework manually
export const DISPOSITION = {
  reuse: { label: 'REUSE', color: '#3b82f6', icon: '♻️', bg: 'rgba(59,130,246,0.12)' },
  scrap: { label: 'SCRAP', color: '#ef4444', icon: '🗑️', bg: 'rgba(239,68,68,0.12)' },
  rework: { label: 'REWORK', color: '#f59e0b', icon: '🔧', bg: 'rgba(245,158,11,0.12)' },
};

// Assembly types are now fetched from Supabase (eagle_eye_app_assemblies table)
// Display mapping is in supabase.js ASSEMBLY_DISPLAY

export const TABS = [
  { id: 'list', label: 'List View', icon: '☰' },
  { id: 'graph', label: 'Graph', icon: '◈' },
  { id: 'kanban', label: 'Kanban', icon: '▦' },
];
