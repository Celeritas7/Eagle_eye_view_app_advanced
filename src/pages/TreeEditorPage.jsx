import { getTheme } from '../theme';

export default function TreeEditorPage({ dark, onBack }) {
  const t = getTheme(dark);
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <button onClick={onBack} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 14px', color: t.textMuted, cursor: 'pointer', fontSize: 13, marginBottom: 24 }}>← Back to Home</button>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>🔧 Tree Editor</div>
      <div style={{ fontSize: 13, color: t.textMuted, marginTop: 8 }}>Side-by-side version comparison editor — coming soon</div>
    </div>
  );
}
