import { TABS, DISPOSITION } from '../data/constants';
import { getTheme, mono, sans } from '../theme';

export default function TabBar({ dark, activeTab, onTabChange, ecnCount, tree }) {
  const t = getTheme(dark);

  const totalParts = tree.reduce((s, g) => s + g.steps.reduce((a, st) => a + st.parts, 0), 0);
  const totalFasteners = tree.reduce((s, g) => s + g.steps.reduce((a, st) => a + st.fasteners, 0), 0);
  const totalSteps = tree.reduce((s, g) => s + g.steps.length, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 20px', borderBottom: `1px solid ${t.border}`, background: t.headerBg }}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', fontSize: 13, fontWeight: active ? 700 : 500,
              color: active ? t.accent : t.textMuted,
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
              transition: 'all 0.15s', fontFamily: sans,
            }}
          >
            <span style={{ fontSize: 14, opacity: active ? 1 : 0.5 }}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'list' && ecnCount > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontFamily: mono, marginLeft: 2 }}>
                {ecnCount}
              </span>
            )}
            {(tab.id === 'graph' || tab.id === 'kanban') && (
              <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: active ? `${t.accent}20` : `${t.textDim}15`, color: active ? t.accent : t.textDim, fontFamily: mono, letterSpacing: 0.5 }}>
                SOON
              </span>
            )}
          </button>
        );
      })}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', fontSize: 11, color: t.textMuted }}>
        <span style={{ fontFamily: mono }}><span style={{ color: '#22c55e', fontWeight: 700 }}>{totalParts}</span> parts</span>
        <span style={{ fontFamily: mono }}><span style={{ color: '#ef4444', fontWeight: 700 }}>{totalFasteners}</span> fasteners</span>
        <span style={{ fontFamily: mono }}><span style={{ fontWeight: 700 }}>{totalSteps}</span> steps</span>
      </div>
    </div>
  );
}
