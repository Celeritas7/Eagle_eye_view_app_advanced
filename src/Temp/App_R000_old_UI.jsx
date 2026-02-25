import { useState, useEffect } from 'react';
import { ROLES } from './data/constants';
import { getTheme, mono, sans } from './theme';
import { initGoogleAuth, onAuthChange, isAuthenticated, getUser, signIn, signOut } from './data/googleSheets';
import HomePage from './pages/HomePage';
import UnitSelectionPage from './pages/UnitSelectionPage';
import AssemblyViewPage from './pages/AssemblyViewPage';
import TreeEditorPage from './pages/TreeEditorPage';

export default function App() {
  const [dark, setDark] = useState(true);
  const [page, setPage] = useState('home');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [authed, setAuthed] = useState(isAuthenticated());
  const [authLoading, setAuthLoading] = useState(true);
  const t = getTheme(dark);
  const user = getUser();
  const role = user?.isAdmin ? 'admin' : 'operator';

  useEffect(() => {
    initGoogleAuth();
    const unsub = onAuthChange(() => {
      setAuthed(isAuthenticated());
      setAuthLoading(false);
    });
    // Fallback if auth resolves quickly
    setTimeout(() => setAuthLoading(false), 2000);
    return unsub;
  }, []);

  // ---- Login screen ----
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, boxShadow: '0 12px 48px rgba(245,158,11,0.3)' }}>
            ⬡
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: -0.5, fontFamily: mono }}>EagleEye V2</div>
          <div style={{ color: t.textMuted, fontSize: 14, margin: '8px 0 32px', lineHeight: 1.5 }}>
            Assembly version tracking & ECN management
          </div>

          {authLoading ? (
            <div style={{ color: t.textMuted, fontSize: 13 }}>Checking authentication...</div>
          ) : (
            <>
              <button onClick={signIn} style={{
                width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none',
                background: '#4285f4', color: '#fff', fontSize: 16, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: sans, boxShadow: '0 4px 20px rgba(66,133,244,0.3)',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#3367d6'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4285f4'}
              >
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Sign in with Google
              </button>

              <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: `${t.textMuted}08`, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.6 }}>
                  Authorized users only. Uses the same Google account as Ghost Tracker.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Authenticated app ----
  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: sans, transition: 'background 0.2s, color 0.2s' }}>

      {/* Top bar */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 50, display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ padding: '5px 10px', borderRadius: 8, background: t.bgCard, border: `1px solid ${t.border}`, fontSize: 11, color: role === 'admin' ? '#f59e0b' : '#22c55e', fontWeight: 700, fontFamily: mono }}>
          {role === 'admin' ? '🔧 Admin' : '🔨 Operator'} · {user?.name}
        </div>
        <button onClick={signOut} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 10, fontWeight: 600 }}>
          Logout
        </button>
        <button onClick={() => setDark(!dark)} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: t.text, fontSize: 14 }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Pages */}
      {page === 'home' && (
        <HomePage dark={dark} role={role}
          onSelectType={(type) => { setSelectedType(type); setPage('units'); }}
          onGoAdmin={() => setPage('admin')}
        />
      )}

      {page === 'units' && selectedType && (
        <UnitSelectionPage dark={dark} assemblyType={selectedType}
          onBack={() => setPage('home')}
          onProceed={(units) => { setSelectedUnits(units); setPage('assembly'); }}
        />
      )}

      {page === 'assembly' && (
        <AssemblyViewPage dark={dark} role={role} assemblyType={selectedType}
          selectedUnits={selectedUnits} onBack={() => setPage('units')}
        />
      )}

      {page === 'admin' && (
        <TreeEditorPage dark={dark} onBack={() => setPage('home')} />
      )}
    </div>
  );
}
