import { getTheme, mono } from '../theme';

export default function KanbanPlaceholder({ dark }) {
  const t = getTheme(dark);
  const columns = [
    { title: 'Not Started', color: t.textDim, count: 12, icon: '○' },
    { title: 'In Progress', color: '#3b82f6', count: 8, icon: '◐' },
    { title: 'Review', color: '#f59e0b', count: 3, icon: '◑' },
    { title: 'Complete', color: '#22c55e', count: 18, icon: '●' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, padding: 40 }}>
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 600 }}>
        {columns.map((col) => (
          <div key={col.title} style={{ flex: 1, background: t.bgCard, borderRadius: 10, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: col.color, fontSize: 10 }}>{col.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: col.color }}>{col.title}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: `${col.color}15`, color: col.color, fontFamily: mono }}>{col.count}</span>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: Math.min(col.count, 3) }, (_, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 6, background: t.bg, border: `1px solid ${t.border}`, opacity: 0.5 }}>
                  <div style={{ width: `${50 + Math.random() * 40}%`, height: 8, borderRadius: 4, background: `${col.color}20` }} />
                  <div style={{ width: `${30 + Math.random() * 30}%`, height: 6, borderRadius: 3, background: t.border, marginTop: 6 }} />
                </div>
              ))}
              {col.count > 3 && <div style={{ textAlign: 'center', fontSize: 9, color: t.textDim, padding: 4 }}>+{col.count - 3} more</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 6 }}>▦ Kanban Board</div>
        <div style={{ fontSize: 13, color: t.textMuted, maxWidth: 400, lineHeight: 1.6 }}>
          Track assembly progress per unit with drag-and-drop status columns, ECN alerts, and operator assignment.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Drag & drop cards', 'Per-unit tracking', 'ECN status flags', 'Operator filters'].map((f) => (
            <span key={f} style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: `${t.accent}10`, color: t.accent, fontFamily: mono, border: `1px solid ${t.accent}20` }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
