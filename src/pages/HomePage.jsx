import { useState, useEffect } from 'react';
import { fetchAssemblyTypesFromSheets } from '../data/googleSheets';
import { getTheme, mono } from '../theme';

export default function HomePage({ dark, role, onSelectType, onGoAdmin }) {
  const t = getTheme(dark);
  const [assemblyTypes, setAssemblyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const types = await fetchAssemblyTypesFromSheets();
        setAssemblyTypes(types);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: '48px 24px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: t.accent, fontFamily: mono, letterSpacing: -1 }}>⬡ EagleEye</div>
        <div style={{ fontSize: 14, color: t.textMuted, marginTop: 6 }}>Assembly version tracking & ECN management</div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 36 }}>
        <div style={{ padding: '14px 28px', borderRadius: 12, background: `${t.accent}15`, border: `2px solid ${t.accent}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>🔨 Unit Tracking</div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Live from Google Sheets</div>
        </div>
        {role === 'admin' && (
          <div onClick={onGoAdmin} style={{ padding: '14px 28px', borderRadius: 12, background: t.bgCard, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6' }}>🔧 Tree Editor</div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Manage assembly steps</div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: t.textMuted }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 13 }}>Loading from Google Sheets...</div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 20, color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.15)', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>⚠ Error loading data</div>
          <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{error}</div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Category groups */}
          <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Full Robot</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 24 }}>
            {assemblyTypes.filter(a => a.tag === 'GST_assy').map(renderCard)}
          </div>

          <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Major Assemblies</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 10, marginBottom: 24 }}>
            {assemblyTypes.filter(a => ['MBB_assy','PLR_assy','HBD_assy','ARM_assy','GPR_assy','DPK_assy'].includes(a.tag)).map(renderCard)}
          </div>

          <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Motors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 10, marginBottom: 24 }}>
            {assemblyTypes.filter(a => ['LAC_assy','A12_assy','A35_assy','A4A_assy'].includes(a.tag)).map(renderCard)}
          </div>
        </>
      )}
    </div>
  );

  function renderCard(a) {
    return (
      <div key={a.tag} onClick={() => onSelectType(a)} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18, cursor: 'pointer', borderLeft: `4px solid ${a.color}`, transition: 'all 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${a.color}15`; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{a.name}</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: `${a.color}15`, color: a.color, fontFamily: mono }}>{a.unitCount} units</span>
          {a.outdatedCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontFamily: mono }}>{a.outdatedCount} pending</span>}
        </div>
      </div>
    );
  }
}
