import { useState } from 'react';
import { ROLES } from './data/constants';
import { getTheme, mono, sans } from './theme';
import HomePage from './pages/HomePage';
import UnitSelectionPage from './pages/UnitSelectionPage';
import AssemblyViewPage from './pages/AssemblyViewPage';
import TreeEditorPage from './pages/TreeEditorPage';

export default function App() {
  const [dark, setDark] = useState(true);
  const [role, setRole] = useState('admin');
  const [page, setPage] = useState('home');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const t = getTheme(dark);

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: sans, transition: 'background 0.2s, color 0.2s' }}>

      {/* Global controls */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 50, display: 'flex', gap: 6 }}>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ background: t.bgCard, color: ROLES[role].color, border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: mono }}>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <button onClick={() => setDark(!dark)} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: t.text, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Pages */}
      {page === 'home' && (
        <HomePage
          dark={dark}
          role={role}
          onSelectType={(type) => { setSelectedType(type); setPage('units'); }}
          onGoAdmin={() => setPage('admin')}
        />
      )}

      {page === 'units' && selectedType && (
        <UnitSelectionPage
          dark={dark}
          assemblyType={selectedType}
          onBack={() => setPage('home')}
          onProceed={(units) => { setSelectedUnits(units); setPage('assembly'); }}
        />
      )}

      {page === 'assembly' && (
        <AssemblyViewPage
          dark={dark}
          role={role}
          assemblyType={selectedType}
          selectedUnits={selectedUnits}
          onBack={() => setPage('units')}
        />
      )}

      {page === 'admin' && (
        <TreeEditorPage
          dark={dark}
          onBack={() => setPage('home')}
        />
      )}
    </div>
  );
}
