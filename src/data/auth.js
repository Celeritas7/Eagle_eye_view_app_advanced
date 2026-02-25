// ============================================================
// Auth — Supabase Google OAuth
// Replaces the old Google Sheets OAuth flow
// ============================================================
import { supabase } from './supabaseClient';

// ---- State ----
let _session = null;
let _role = null;
let _listeners = [];

// ---- Initialize: check existing session + listen for changes ----
export async function initAuth() {
  // Get existing session (e.g. returning from OAuth redirect)
  const { data: { session } } = await supabase.auth.getSession();
  _session = session;
  if (session) await _fetchRole(session.user.email);
  _notify();

  // Listen for future auth changes (login/logout/token refresh)
  supabase.auth.onAuthStateChange(async (_event, session) => {
    _session = session;
    if (session) {
      await _fetchRole(session.user.email);
    } else {
      _role = null;
    }
    _notify();
  });
}

// ---- Fetch user's role from app_user_roles table ----
async function _fetchRole(email) {
  const { data, error } = await supabase
    .from('authentication_mode_user_roles')
    .select('role')
    .eq('email', email)
    .single();

  if (error || !data) {
    _role = 'viewer'; // safe default — read only
  } else {
    _role = data.role; // 'admin', 'operator', or 'viewer'
  }
}

// ---- Public API (matches your existing function signatures) ----

export function isAuthenticated() {
  return !!_session;
}

export function getUser() {
  if (!_session) return null;
  const u = _session.user;
  return {
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || u.email,
    avatar: u.user_metadata?.avatar_url || null,
    isAdmin: _role === 'admin',
    role: _role || 'viewer',
  };
}

export function getRole() {
  return _role || 'viewer';
}

export async function signIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });
  if (error) console.error('Sign in error:', error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
  _session = null;
  _role = null;
  _notify();
}

// ---- Listeners (same pattern as your onAuthChange) ----
export function onAuthChange(callback) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter(l => l !== callback);
  };
}

function _notify() {
  _listeners.forEach(fn => fn(_session));
}
