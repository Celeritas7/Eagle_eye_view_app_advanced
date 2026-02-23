// ============================================================
// Google Sheets Reader — Live data from Ghost Tracker spreadsheet
// ============================================================
// Uses Google Sheets API v4 (requires API key)
// The spreadsheet must be shared as "Anyone with the link can view"

const SPREADSHEET_ID = '1mUhNDzucbHpS2y-IYu3A5ML1x5I_opUeNnqqyOtg95M';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';

const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values`;

// ============================================================
// Sheet name → assembly config
// ============================================================
const SHEET_CONFIG = {
  '00_GHOST': {
    tag: 'GST_assy', name: 'Ghost (Full Robot)', icon: '🤖', color: '#f59e0b',
    dataStart: 2, snCol: 1,
    fields: { assembler: 4, time: 5, completionDate: 6, notes: 7 },
    components: { 17: 'MBB', 19: 'PLR', 21: 'HBD', 23: 'ARM', 25: 'DPK' },
  },
  '01_L-motor': {
    tag: 'LAC_assy', name: 'L-Motor', icon: '⚙️', color: '#6366f1',
    dataStart: 2, snCol: 1,
    fields: { mod: 2, usage: 3, partsDate: 6, assembler: 7, time: 8, completionDate: 9, notes: 10 },
    ecnStart: 17,
  },
  '02_A12-motor': {
    tag: 'A12_assy', name: 'A12 Motor', icon: '⚙️', color: '#0ea5e9',
    dataStart: 2, snCol: 1,
    fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 },
    ecnStart: 15,
  },
  '03_A35-motor': {
    tag: 'A35_assy', name: 'A35 Motor', icon: '⚙️', color: '#14b8a6',
    dataStart: 2, snCol: 1,
    fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 },
    ecnStart: 18,
  },
  '04_A4-motor': {
    tag: 'A4A_assy', name: 'A4 Motor', icon: '⚙️', color: '#a855f7',
    dataStart: 2, snCol: 1,
    fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 },
    ecnStart: 18,
  },
  '05_Mobile Base': {
    tag: 'MBB_assy', name: 'Mobile Base', icon: '🔩', color: '#8b5cf6',
    dataStart: 2, snCol: 1,
    fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 },
    ecnStart: 24,
  },
  '06_Pillar': {
    tag: 'PLR_assy', name: 'Pillar', icon: '🏗️', color: '#ec4899',
    dataStart: 2, snCol: 1,
    fields: { partsDate: 4, assembler: 5, time: 6, completionDate: 7, notes: 8 },
    ecnStart: 18,
  },
  '07_Head & Body': {
    tag: 'HBD_assy', name: 'Head & Body', icon: '🤖', color: '#f59e0b',
    dataStart: 2, snCol: 1,
    fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 },
    ecnStart: 22,
  },
  '08_Gripper': {
    tag: 'GPR_assy', name: 'Gripper', icon: '🦾', color: '#22c55e',
    dataStart: 2, snCol: 1,
    fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 },
    ecnStart: 15,
  },
  '09_Arm': {
    tag: 'ARM_assy', name: 'Arm', icon: '💪', color: '#3b82f6',
    dataStart: 2, snCol: 1,
    fields: { partsDate: 4, assembler: 7, time: 8, completionDate: 9, notes: 10 },
    ecnStart: 31,
    motorCols: { 13: 'A1', 15: 'A2', 17: 'A3', 19: 'A4', 21: 'A5', 23: 'GPR' },
  },
  '10_Deploy Kit': {
    tag: 'DPK_assy', name: 'Deploy Kit', icon: '📦', color: '#f97316',
    dataStart: 2, snCol: 1,
    fields: { partsDate: 4, assembler: 6, time: 7, completionDate: 8, notes: 9 },
    ecnStart: 12,
  },
};

// ============================================================
// In-memory cache (avoid re-fetching on every page change)
// ============================================================
const cache = {
  data: {},       // sheetName → parsed rows
  timestamp: {},  // sheetName → fetch time
  TTL: 5 * 60 * 1000, // 5 min cache
};

function isCacheValid(sheetName) {
  return cache.data[sheetName] && (Date.now() - cache.timestamp[sheetName] < cache.TTL);
}

// ============================================================
// Fetch raw sheet data from Google Sheets API
// ============================================================
async function fetchSheet(sheetName) {
  if (isCacheValid(sheetName)) {
    return cache.data[sheetName];
  }

  if (!API_KEY) {
    console.warn('Google Sheets API key not set. Add VITE_GOOGLE_SHEETS_API_KEY to .env');
    return null;
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(sheetName)}?key=${API_KEY}&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`Google Sheets error for "${sheetName}":`, err);
      return null;
    }

    const json = await res.json();
    const rows = json.values || [];

    cache.data[sheetName] = rows;
    cache.timestamp[sheetName] = Date.now();

    return rows;
  } catch (e) {
    console.error(`Failed to fetch sheet "${sheetName}":`, e);
    return null;
  }
}

// ============================================================
// Parse helpers
// ============================================================
function cell(row, col) {
  if (!row || col >= row.length) return null;
  const v = row[col];
  if (v === '' || v === null || v === undefined) return null;
  return v;
}

function isValidSN(val) {
  if (!val) return false;
  const s = String(val);
  return s.startsWith('GT') || s.startsWith('FX');
}

function parseEcnStatus(val) {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).toLowerCase();
  if (s === 'true' || s === '1') return 'applied';
  if (s === 'false' || s === '0') return 'pending';
  if (s.includes('変更前')) return 'not_required';
  if (s === '不明') return 'unknown';
  return 'partial'; // has value but not true/false
}

// ============================================================
// Public API
// ============================================================

/**
 * Get all assembly types with live unit counts from Google Sheets
 */
export async function fetchAssemblyTypesFromSheets() {
  const results = [];

  for (const [sheetName, config] of Object.entries(SHEET_CONFIG)) {
    const rows = await fetchSheet(sheetName);
    let unitCount = 0;

    if (rows) {
      for (let i = config.dataStart; i < rows.length; i++) {
        if (isValidSN(cell(rows[i], config.snCol))) unitCount++;
      }
    }

    results.push({
      id: config.tag.replace('_assy', ''),
      tag: config.tag,
      name: config.name,
      icon: config.icon,
      color: config.color,
      description: `${sheetName} — ${unitCount} units`,
      unitCount,
      outdatedCount: 0, // will compute from ECN data
      version: '1.0',
      sheetName,
    });
  }

  return results;
}

/**
 * Fetch all units for an assembly (by sheet name)
 */
export async function fetchUnitsFromSheet(sheetName) {
  const config = SHEET_CONFIG[sheetName];
  if (!config) return [];

  const rows = await fetchSheet(sheetName);
  if (!rows) return [];

  // Get ECN column names from header row (row 0)
  const ecnColumns = [];
  if (config.ecnStart) {
    const headerRow = rows[0] || [];
    for (let col = config.ecnStart; col < headerRow.length; col++) {
      const h = cell(headerRow, col);
      if (h && String(h).includes('ECN')) {
        ecnColumns.push({ col, name: String(h).replace(/\n/g, ' ') });
      }
    }
  }

  const units = [];
  for (let i = config.dataStart; i < rows.length; i++) {
    const row = rows[i];
    const sn = cell(row, config.snCol);
    if (!isValidSN(sn)) continue;

    const f = config.fields;

    // Parse ECN statuses
    const ecnStatuses = {};
    let pendingEcns = 0;
    for (const ecnCol of ecnColumns) {
      const status = parseEcnStatus(cell(row, ecnCol.col));
      if (status) {
        ecnStatuses[ecnCol.name] = {
          status,
          rawValue: String(cell(row, ecnCol.col) || ''),
        };
        if (status === 'pending') pendingEcns++;
      }
    }

    // Parse component links (for Ghost and Arm)
    const components = {};
    if (config.components) {
      for (const [col, type] of Object.entries(config.components)) {
        const compSn = cell(row, parseInt(col));
        if (compSn && String(compSn).startsWith('GT')) {
          components[type] = String(compSn);
        }
      }
    }
    if (config.motorCols) {
      for (const [col, type] of Object.entries(config.motorCols)) {
        const compSn = cell(row, parseInt(col));
        if (compSn && String(compSn).startsWith('GT')) {
          components[type] = String(compSn);
        }
      }
    }

    units.push({
      sn: String(sn),
      usage: f.usage ? String(cell(row, f.usage) || '') : '',
      assembler: f.assembler ? String(cell(row, f.assembler) || '') : '',
      assemblyTime: f.time ? cell(row, f.time) : null,
      completionDate: f.completionDate ? cell(row, f.completionDate) : null,
      partsDate: f.partsDate ? cell(row, f.partsDate) : null,
      notes: f.notes ? String(cell(row, f.notes) || '') : '',
      ecnStatuses,
      pendingEcns,
      components,
      // For compatibility with existing app structure
      version: '1.0',
      latestVersion: '1.0',
      status: pendingEcns > 0 ? 'outdated' : 'current',
    });
  }

  return units;
}

/**
 * Fetch ECN column definitions for a sheet
 */
export async function fetchEcnColumnsFromSheet(sheetName) {
  const config = SHEET_CONFIG[sheetName];
  if (!config || !config.ecnStart) return [];

  const rows = await fetchSheet(sheetName);
  if (!rows || rows.length === 0) return [];

  const headerRow = rows[0] || [];
  const ecnColumns = [];
  for (let col = config.ecnStart; col < headerRow.length; col++) {
    const h = cell(headerRow, col);
    if (h) {
      const name = String(h).replace(/\n/g, ' ');
      if (name.includes('ECN') || name.includes('ecn')) {
        ecnColumns.push({ col, name, code: name.split(' ')[0] });
      }
    }
  }

  return ecnColumns;
}

/**
 * Get component traceability for a Ghost robot
 * Returns { MBB: 'GT414-MBB-00001', PLR: 'GT417-PLR-00001', ... }
 */
export async function fetchGhostComponents(ghostSn) {
  const units = await fetchUnitsFromSheet('00_GHOST');
  const ghost = units.find((u) => u.sn === ghostSn);
  return ghost?.components || {};
}

/**
 * Get motor/gripper traceability for an Arm
 */
export async function fetchArmComponents(armSn) {
  const units = await fetchUnitsFromSheet('09_Arm');
  const arm = units.find((u) => u.sn === armSn);
  return arm?.components || {};
}

/**
 * Force refresh cache for a sheet (or all sheets)
 */
export function clearSheetCache(sheetName) {
  if (sheetName) {
    delete cache.data[sheetName];
    delete cache.timestamp[sheetName];
  } else {
    cache.data = {};
    cache.timestamp = {};
  }
}

/**
 * Check if Google Sheets API is configured
 */
export function isSheetsConfigured() {
  return !!API_KEY;
}

/**
 * Get config for a sheet
 */
export function getSheetConfig(sheetName) {
  return SHEET_CONFIG[sheetName] || null;
}

export { SHEET_CONFIG };
