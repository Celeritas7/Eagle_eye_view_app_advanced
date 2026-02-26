// ============================================================
// Mock Data — Replace with Supabase queries
// ============================================================

export const UNITS = {
  HBD: [
    { sn: 'HBD-001', version: '0.9', latestVersion: '1.0', status: 'outdated', assignedTo: 'Line A' },
    { sn: 'HBD-002', version: '1.0', latestVersion: '1.0', status: 'current', assignedTo: 'Line A' },
    { sn: 'HBD-003', version: '0.9', latestVersion: '1.0', status: 'outdated', assignedTo: 'Line B' },
    { sn: 'HBD-004', version: '1.0', latestVersion: '1.0', status: 'current', assignedTo: 'Line B' },
    { sn: 'HBD-005', version: '0.9', latestVersion: '1.0', status: 'outdated', assignedTo: 'Line A' },
    { sn: 'HBD-006', version: '1.0', latestVersion: '1.0', status: 'current', assignedTo: 'Line C' },
    { sn: 'HBD-007', version: '0.8', latestVersion: '1.0', status: 'outdated', assignedTo: 'Line C' },
    ...Array.from({ length: 30 }, (_, i) => ({
      sn: `HBD-${String(i + 8).padStart(3, '0')}`,
      version: i % 3 === 0 ? '0.9' : '1.0',
      latestVersion: '1.0',
      status: i % 3 === 0 ? 'outdated' : 'current',
      assignedTo: ['Line A', 'Line B', 'Line C'][i % 3],
    })),
  ],
};

// ECN change records between versions
// removedParts disposition: default "scrap" for ECN-changed parts, "reuse" for everything else
// Admin can manually set "rework" (e.g., motors)
export const VERSION_CHANGES = {
  '0.9→1.0': [
    {
      step: '1c', stepName: 'Middle frame 組立', changeType: 'part_changed',
      field: 'Part Number', old: 'FRM-MID-01', new: 'FRM-MID-02',
      reason: 'Frame redesigned for rigidity', group: '完了: Body',
      removedParts: [{ pn: 'FRM-MID-01', name: 'Middle frame v1', disposition: 'scrap' }],
    },
    {
      step: '1f', stepName: 'Galina 組立', changeType: 'fastener_changed',
      field: 'Fastener', old: 'CSH-M3-5 (1.14Nm)', new: 'CSH-M4-8 (2.70Nm)',
      reason: 'Higher torque required', group: '完了: Body',
      removedParts: [{ pn: 'CSH-M3-5', name: 'Socket head cap screw M3×5', disposition: 'reuse' }],
    },
    {
      step: '2d', stepName: 'Gearbox cover 組立', changeType: 'part_changed',
      field: 'Gasket', old: 'GK-200-A', new: 'GK-200-B',
      reason: 'Heat-resistant material upgrade', group: '完了: Motor & Gear housing',
      removedParts: [{ pn: 'GK-200-A', name: 'Gearbox gasket A', disposition: 'scrap' }],
    },
    {
      step: '3b', stepName: 'Attaching the ring holder', changeType: 'step_modified',
      field: 'Torque spec', old: '1.14 Nm', new: '1.50 Nm',
      reason: 'Updated per stress analysis', group: '完了: Head',
      removedParts: [],
    },
  ],
  '0.8→1.0': [
    {
      step: '1c', stepName: 'Middle frame 組立', changeType: 'part_changed',
      field: 'Part Number', old: 'FRM-MID-01', new: 'FRM-MID-02',
      reason: 'Frame redesigned for rigidity', group: '完了: Body',
      removedParts: [{ pn: 'FRM-MID-01', name: 'Middle frame v1', disposition: 'scrap' }],
    },
    {
      step: '1e', stepName: 'Arm joint plate', changeType: 'part_changed',
      field: 'Part Number', old: 'GPMP-0500020-0-0', new: 'GPMP-0500020-1-0',
      reason: 'Redesigned for better fit', group: '完了: Body',
      removedParts: [{ pn: 'GPMP-0500020-0-0', name: 'Arm joint plate v1 (3D printed)', disposition: 'scrap' }],
    },
    {
      step: '1f', stepName: 'Galina 組立', changeType: 'fastener_changed',
      field: 'Fastener', old: 'CSH-M3-5 (1.14Nm)', new: 'CSH-M4-8 (2.70Nm)',
      reason: 'Higher torque required', group: '完了: Body',
      removedParts: [{ pn: 'CSH-M3-5', name: 'Socket head cap screw M3×5', disposition: 'reuse' }],
    },
    {
      step: '2d', stepName: 'Gearbox cover 組立', changeType: 'part_changed',
      field: 'Gasket', old: 'GK-200-A', new: 'GK-200-B',
      reason: 'Heat-resistant material upgrade', group: '完了: Motor & Gear housing',
      removedParts: [{ pn: 'GK-200-A', name: 'Gearbox gasket A', disposition: 'scrap' }],
    },
    {
      step: '3b', stepName: 'Attaching the ring holder', changeType: 'step_modified',
      field: 'Torque spec', old: '1.14 Nm', new: '1.50 Nm',
      reason: 'Updated per stress analysis', group: '完了: Head',
      removedParts: [],
    },
  ],
};

// Assembly tree — full H&B structure
export const MOCK_TREE = [
  {
    id: 'g1', name: 'Prep (Loctite)', icon: '🧪', color: '#a855f7', level: null,
    steps: [
      { id: 's1', sn: '1', name: 'Motor assy', type: 'STEP', parts: 2, fasteners: 1 },
      { id: 's2', sn: '2', name: 'Loctite 648 parts', type: 'PREP', parts: 7, fasteners: 0 },
      { id: 's3', sn: '3', name: 'Ball bearing in Dovel pin', type: 'STEP', parts: 2, fasteners: 0 },
      { id: 's4', sn: '4', name: 'Loctite 425 parts', type: 'PREP', parts: 1, fasteners: 0 },
    ],
  },
  {
    id: 'g2', name: '完了: Body', icon: '🏗', color: '#22c55e', level: 1,
    steps: [
      { id: 's5', sn: '1a', name: 'Frame galina plate 組立', type: 'STEP', parts: 1, fasteners: 3 },
      { id: 's6', sn: '1b', name: 'Frame side plate 組立', type: 'STEP', parts: 0, fasteners: 1 },
      { id: 's7', sn: '1c', name: 'Middle frame 組立', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's8', sn: '1d', name: 'Body 組立', type: 'STEP', parts: 0, fasteners: 1 },
      { id: 's9', sn: '1e', name: 'Arm joint plate', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's10', sn: '1da', name: 'Hook arm 組立', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's11', sn: "1e'", name: 'Galina bot cover', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's12', sn: '1f', name: 'Galina 組立', type: 'STEP', parts: 0, fasteners: 2 },
      { id: 's13', sn: '1g', name: 'Wifi plate 組立', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's14', sn: '1h', name: 'Galina back cover', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's15', sn: '1i', name: 'Body', type: 'STEP', parts: 1, fasteners: 0 },
    ],
  },
  {
    id: 'g3', name: '完了: Motor & Gear housing', icon: '⚙️', color: '#f97316', level: 2,
    steps: [
      { id: 's16', sn: '2a', name: 'Encoder shaft 組立', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's17', sn: '2b', name: 'White gears 組立', type: 'STEP', parts: 4, fasteners: 0 },
      { id: 's18', sn: '2c', name: 'Hex and round pins 組立', type: 'STEP', parts: 2, fasteners: 0 },
      { id: 's19', sn: '2d', name: 'Gearbox cover 組立', type: 'STEP', parts: 1, fasteners: 2 },
      { id: 's20', sn: '2e', name: 'PCB holder 組立', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's21', sn: '2f', name: 'PCB 組立', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's22', sn: '2g', name: 'Motor & Gear housing', type: 'STEP', parts: 0, fasteners: 0 },
    ],
  },
  {
    id: 'g4', name: '完了: Head', icon: '🦴', color: '#ef4444', level: 3,
    steps: [
      { id: 's23', sn: '3a', name: 'Attach the base ring sheet metal', type: 'STEP', parts: 2, fasteners: 2 },
      { id: 's24', sn: '3b', name: 'Attaching the ring holder', type: 'STEP', parts: 4, fasteners: 1 },
      { id: 's25', sn: '3c', name: 'Mounting the CAM follower', type: 'STEP', parts: 2, fasteners: 1 },
      { id: 's26', sn: '3d', name: 'Mount the head on body', type: 'STEP', parts: 0, fasteners: 2 },
      { id: 's27', sn: '3e', name: 'Attach the motor to head', type: 'STEP', parts: 0, fasteners: 1 },
      { id: 's28', sn: '3f', name: 'Sandwich ring gear / Mesh / Test / Fix', type: 'STEP', parts: 0, fasteners: 0 },
      { id: 's29', sn: '3g', name: 'Attach ring gear top spring clasp', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's30', sn: '3h', name: 'Head', type: 'STEP', parts: 0, fasteners: 0 },
    ],
  },
  {
    id: 'g5', name: '完了: Camera', icon: '📷', color: '#3b82f6', level: 4,
    steps: [
      { id: 's31', sn: '4a', name: 'Cable carrier bracket assy', type: 'STEP', parts: 4, fasteners: 3 },
      { id: 's32', sn: '4b', name: 'Camera assy', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's33', sn: '4c', name: 'LED mounting', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's34', sn: '4d', name: 'Camera cable pusher plate mounting', type: 'STEP', parts: 1, fasteners: 1 },
      { id: 's35', sn: '4e', name: 'Wire strap', type: 'STEP', parts: 0, fasteners: 0 },
      { id: 's36', sn: '4f', name: 'Mount the wires on camera assy', type: 'STEP', parts: 2, fasteners: 0 },
      { id: 's37', sn: '4g', name: 'Head camera harness sleeve 500mm', type: 'STEP', parts: 0, fasteners: 0 },
      { id: 's38', sn: '4h', name: '10 mm rubber and apply the Nitto tape', type: 'STEP', parts: 0, fasteners: 0 },
      { id: 's39', sn: '4i', name: 'Camera', type: 'STEP', parts: 1, fasteners: 1 },
    ],
  },
  {
    id: 'g6', name: 'Final Assembly', icon: '✅', color: '#ec4899', level: 5,
    steps: [
      { id: 's40', sn: '5a', name: 'Mounting the assembly', type: 'STEP', parts: 1, fasteners: 2 },
      { id: 's41', sn: '5b', name: 'Cable guide bracket', type: 'STEP', parts: 1, fasteners: 1 },
    ],
  },
];
