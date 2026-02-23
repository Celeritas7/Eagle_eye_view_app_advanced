// ============================================================
// Theme — Dark / Light mode color tokens
// ============================================================

export const DARK = {
  bg: '#0f1117',
  bgCard: '#1a1d27',
  bgHover: '#242836',
  bgModal: '#1e2130',
  border: '#2a2e3d',
  borderLight: '#353a4d',
  text: '#e2e4eb',
  textMuted: '#8b8fa3',
  textDim: '#5c6078',
  accent: '#f59e0b',
  headerBg: '#161822',
  shadow: '0 8px 32px rgba(0,0,0,0.5)',
};

export const LIGHT = {
  bg: '#f3f4f6',
  bgCard: '#ffffff',
  bgHover: '#f9fafb',
  bgModal: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#d1d5db',
  text: '#111827',
  textMuted: '#6b7280',
  textDim: '#9ca3af',
  accent: '#d97706',
  headerBg: '#ffffff',
  shadow: '0 8px 32px rgba(0,0,0,0.1)',
};

export function getTheme(dark) {
  return dark ? DARK : LIGHT;
}

// Font stacks
export const mono = "'JetBrains Mono', 'Fira Code', monospace";
export const sans = "'Noto Sans', 'Segoe UI', sans-serif";
