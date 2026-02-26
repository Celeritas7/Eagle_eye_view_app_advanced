import { getTheme, mono } from '../theme';

export default function GraphPlaceholder({ dark }) {
  const t = getTheme(dark);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 40 }}>
      <div style={{ position: 'relative', width: 360, height: 280 }}>
        {[
          { x: 170, y: 20, label: 'Prep', color: '#a855f7', size: 36 },
          { x: 60, y: 100, label: 'Body', color: '#22c55e', size: 36 },
          { x: 280, y: 100, label: 'Motor', color: '#f97316', size: 36 },
          { x: 60, y: 190, label: 'Head', color: '#ef4444', size: 36 },
          { x: 280, y: 190, label: 'Camera', color: '#3b82f6', size: 36 },
          { x: 170, y: 250, label: 'Final', color: '#ec4899', size: 36 },
        ].map((node, i) => (
          <div key={i} style={{ position: 'absolute', left: node.x - node.size / 2, top: node.y - node.size / 2, width: node.size, height: node.size, borderRadius: '50%', background: `${node.color}20`, border: `2px solid ${node.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 7, fontWeight: 700, color: node.color, fontFamily: mono, textAlign: 'center' }}>{node.label}</span>
          </div>
        ))}
        <svg width="360" height="280" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {[[170,38,60,82],[170,38,280,82],[60,118,60,172],[280,118,280,172],[60,208,170,232],[280,208,170,232]].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={t.border} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
          ))}
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 6 }}>◈ Graph View</div>
        <div style={{ fontSize: 13, color: t.textMuted, maxWidth: 400, lineHeight: 1.6 }}>
          Interactive dependency graph showing assembly step flow, group connections, and ECN impact visualization.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Drag & zoom nodes', 'ECN cascade paths', 'Group clustering', 'Dependency arrows'].map((f) => (
            <span key={f} style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: `${t.accent}10`, color: t.accent, fontFamily: mono, border: `1px solid ${t.accent}20` }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
