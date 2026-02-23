// ============================================================
// Google Sheets — OAuth2 authenticated (same as Ghost Tracker)
// ============================================================

const SPREADSHEET_ID = '1mUhNDzucbHpS2y-IYu3A5ML1x5I_opUeNnqqyOtg95M';
const CLIENT_ID = '1088099187141-ut0dn0scqt3h99htf3rg8gsrg2oo1ad8.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.email';
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values`;

// ---- Auth state ----
let accessToken = localStorage.getItem('ee_gat') || null;
let tokenClient = null;
let currentUser = JSON.parse(localStorage.getItem('ee_user') || 'null');
let _listeners = [];

const APPROVED_USERS = {
  'anikettelexistence@gmail.com': { name: 'Aniket', team: 'production', isAdmin: true },
  'igarashi@tx-inc.com': { name: 'Igarashi', team: 'production', isAdmin: false },
  'niidome@tx-inc.com': { name: 'Niidome', team: 'production', isAdmin: false },
};

function notify() { _listeners.forEach((fn) => fn()); }
export function onAuthChange(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter((f) => f !== fn); }; }
export function getUser() { return currentUser; }
export function isAuthenticated() { return !!accessToken && !!currentUser; }

// Load Google Identity Services script + init token client
export function initGoogleAuth() {
  if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    document.head.appendChild(s);
  }
  (function poll() {
    if (typeof google !== 'undefined' && google.accounts) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (r) => {
          if (r.access_token) {
            accessToken = r.access_token;
            localStorage.setItem('ee_gat', accessToken);
            try { await fetchUserInfo(); } catch (e) { console.error(e); }
            notify();
          }
        },
      });
      // Validate stored token
      if (accessToken) validateToken();
      else notify();
    } else setTimeout(poll, 250);
  })();
}

export function signIn() {
  if (tokenClient) tokenClient.requestAccessToken({ prompt: 'consent' });
}

export function signOut() {
  accessToken = null; currentUser = null;
  localStorage.removeItem('ee_gat');
  localStorage.removeItem('ee_user');
  notify();
}

async function fetchUserInfo() {
  const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error('User info fetch failed');
  const info = await r.json();
  const approved = APPROVED_USERS[info.email];
  if (!approved) {
    signOut();
    throw new Error(`Access denied: ${info.email} is not an approved user`);
  }
  currentUser = { name: approved.name, email: info.email, team: approved.team, isAdmin: approved.isAdmin };
  localStorage.setItem('ee_user', JSON.stringify(currentUser));
}

async function validateToken() {
  try {
    const r = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
    if (!r.ok) signOut();
    else notify();
  } catch { signOut(); }
}

// Try silent re-auth on 401
async function refreshToken() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('No token client'));
    const orig = tokenClient.callback;
    let done = false;
    tokenClient.callback = (r) => {
      if (done) return; done = true; tokenClient.callback = orig;
      if (r.access_token) {
        accessToken = r.access_token;
        localStorage.setItem('ee_gat', accessToken);
        resolve();
      } else reject(new Error('Re-auth failed'));
    };
    tokenClient.requestAccessToken({ prompt: '' });
    setTimeout(() => { if (!done) { done = true; tokenClient.callback = orig; reject(new Error('Timeout')); } }, 10000);
  });
}

// ---- Cache ----
const cache = { data: {}, ts: {}, TTL: 5 * 60 * 1000 };
function cacheOk(k) { return cache.data[k] && (Date.now() - cache.ts[k] < cache.TTL); }

// ---- Fetch sheet with auth ----
async function fetchSheet(sheetName) {
  if (cacheOk(sheetName)) return cache.data[sheetName];
  if (!accessToken) return null;

  const url = `${BASE_URL}/${encodeURIComponent(sheetName)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;
  let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

  if (res.status === 401) {
    try { await refreshToken(); } catch { signOut(); return null; }
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  }
  if (!res.ok) { console.error(`Sheets ${res.status} for ${sheetName}`); return null; }

  const rows = (await res.json()).values || [];
  cache.data[sheetName] = rows;
  cache.ts[sheetName] = Date.now();
  return rows;
}

// ---- Config ----
const SHEET_CONFIG = {
  '00_GHOST': { tag: 'GST_assy', name: 'Ghost (Full Robot)', icon: '🤖', color: '#f59e0b', dataStart: 2, snCol: 1, fields: { assembler: 4, time: 5, completionDate: 6, notes: 7 }, components: { 17: 'MBB', 19: 'PLR', 21: 'HBD', 23: 'ARM', 25: 'DPK' } },
  '01_L-motor': { tag: 'LAC_assy', name: 'L-Motor', icon: '⚙️', color: '#6366f1', dataStart: 2, snCol: 1, fields: { mod: 2, usage: 3, partsDate: 6, assembler: 7, time: 8, completionDate: 9, notes: 10 }, ecnStart: 17 },
  '02_A12-motor': { tag: 'A12_assy', name: 'A12 Motor', icon: '⚙️', color: '#0ea5e9', dataStart: 2, snCol: 1, fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 }, ecnStart: 15 },
  '03_A35-motor': { tag: 'A35_assy', name: 'A35 Motor', icon: '⚙️', color: '#14b8a6', dataStart: 2, snCol: 1, fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 }, ecnStart: 18 },
  '04_A4-motor': { tag: 'A4A_assy', name: 'A4 Motor', icon: '⚙️', color: '#a855f7', dataStart: 2, snCol: 1, fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 }, ecnStart: 18 },
  '05_Mobile Base': { tag: 'MBB_assy', name: 'Mobile Base', icon: '🔩', color: '#8b5cf6', dataStart: 2, snCol: 1, fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 }, ecnStart: 24 },
  '06_Pillar': { tag: 'PLR_assy', name: 'Pillar', icon: '🏗️', color: '#ec4899', dataStart: 2, snCol: 1, fields: { partsDate: 4, assembler: 5, time: 6, completionDate: 7, notes: 8 }, ecnStart: 18 },
  '07_Head & Body': { tag: 'HBD_assy', name: 'Head & Body', icon: '🤖', color: '#f59e0b', dataStart: 2, snCol: 1, fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 }, ecnStart: 22 },
  '08_Gripper': { tag: 'GPR_assy', name: 'Gripper', icon: '🦾', color: '#22c55e', dataStart: 2, snCol: 1, fields: { usage: 2, partsDate: 5, assembler: 6, time: 7, completionDate: 8, notes: 9 }, ecnStart: 15 },
  '09_Arm': { tag: 'ARM_assy', name: 'Arm', icon: '💪', color: '#3b82f6', dataStart: 2, snCol: 1, fields: { partsDate: 4, assembler: 7, time: 8, completionDate: 9, notes: 10 }, ecnStart: 31, motorCols: { 13: 'A1', 15: 'A2', 17: 'A3', 19: 'A4', 21: 'A5', 23: 'GPR' } },
  '10_Deploy Kit': { tag: 'DPK_assy', name: 'Deploy Kit', icon: '📦', color: '#f97316', dataStart: 2, snCol: 1, fields: { partsDate: 4, assembler: 6, time: 7, completionDate: 8, notes: 9 }, ecnStart: 12 },
};

// ---- Helpers ----
function cell(row, col) {
  if (!row || col >= row.length) return null;
  const v = row[col];
  return (v === '' || v === null || v === undefined) ? null : v;
}
function isValidSN(val) { return val && (String(val).startsWith('GT') || String(val).startsWith('FX')); }
function parseEcnStatus(val) {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).toLowerCase();
  if (s === 'true' || s === '1') return 'applied';
  if (s === 'false' || s === '0') return 'pending';
  if (s.includes('変更前')) return 'not_required';
  if (s === '不明') return 'unknown';
  return 'partial';
}

// ---- Public API ----

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
      id: config.tag.replace('_assy', ''), tag: config.tag, name: config.name,
      icon: config.icon, color: config.color, description: `${sheetName} — ${unitCount} units`,
      unitCount, outdatedCount: 0, version: '1.0', sheetName,
    });
  }
  return results;
}

export async function fetchUnitsFromSheet(sheetName) {
  const config = SHEET_CONFIG[sheetName];
  if (!config) return [];
  const rows = await fetchSheet(sheetName);
  if (!rows) return [];

  const ecnColumns = [];
  if (config.ecnStart) {
    const hdr = rows[0] || [];
    for (let col = config.ecnStart; col < hdr.length; col++) {
      const h = cell(hdr, col);
      if (h && String(h).includes('ECN')) ecnColumns.push({ col, name: String(h).replace(/\n/g, ' ') });
    }
  }

  const units = [];
  for (let i = config.dataStart; i < rows.length; i++) {
    const row = rows[i];
    const sn = cell(row, config.snCol);
    if (!isValidSN(sn)) continue;
    const f = config.fields;

    const ecnStatuses = {};
    let pendingEcns = 0;
    for (const ec of ecnColumns) {
      const st = parseEcnStatus(cell(row, ec.col));
      if (st) { ecnStatuses[ec.name] = { status: st, rawValue: String(cell(row, ec.col) || '') }; if (st === 'pending') pendingEcns++; }
    }

    const components = {};
    for (const [col, type] of Object.entries(config.components || {})) {
      const v = cell(row, parseInt(col)); if (v && String(v).startsWith('GT')) components[type] = String(v);
    }
    for (const [col, type] of Object.entries(config.motorCols || {})) {
      const v = cell(row, parseInt(col)); if (v && String(v).startsWith('GT')) components[type] = String(v);
    }

    units.push({
      sn: String(sn), usage: f.usage ? String(cell(row, f.usage) || '') : '',
      assembler: f.assembler ? String(cell(row, f.assembler) || '') : '',
      assemblyTime: f.time ? cell(row, f.time) : null,
      completionDate: f.completionDate ? cell(row, f.completionDate) : null,
      notes: f.notes ? String(cell(row, f.notes) || '') : '',
      ecnStatuses, pendingEcns, components,
      version: null, latestVersion: null, // will be filled by mergeWithSupabase
      status: null,
    });
  }
  return units;
}

export async function fetchEcnColumnsFromSheet(sheetName) {
  const config = SHEET_CONFIG[sheetName];
  if (!config || !config.ecnStart) return [];
  const rows = await fetchSheet(sheetName);
  if (!rows || !rows.length) return [];
  const hdr = rows[0] || [];
  const cols = [];
  for (let col = config.ecnStart; col < hdr.length; col++) {
    const h = cell(hdr, col);
    if (h) { const name = String(h).replace(/\n/g, ' '); if (name.includes('ECN')) cols.push({ col, name, code: name.split(' ')[0] }); }
  }
  return cols;
}

export function clearSheetCache(sheetName) {
  if (sheetName) { delete cache.data[sheetName]; delete cache.ts[sheetName]; }
  else { cache.data = {}; cache.ts = {}; }
}

export function isSheetsConfigured() { return !!accessToken; }

export { SHEET_CONFIG, APPROVED_USERS };
