// ============================================================
// Google Auth — OAuth via Google Identity Services (GSI)
// Uses same client ID as Ghost Tracker app
// ============================================================

const CLIENT_ID = '1088099187141-ut0dn0scqt3h99htf3rg8gsrg2oo1ad8.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

let accessToken = localStorage.getItem('eagle_eye_gat') || null;
let userInfo = null;
let tokenClient = null;
let onAuthChange = null; // callback

/**
 * Initialize GSI token client
 */
export function initAuth(callback) {
  onAuthChange = callback;

  // Check if we have a stored token
  if (accessToken) {
    // Verify it's still valid
    verifyToken().then((valid) => {
      if (valid) {
        onAuthChange?.({ loggedIn: true, token: accessToken, user: userInfo });
      } else {
        accessToken = null;
        localStorage.removeItem('eagle_eye_gat');
        onAuthChange?.({ loggedIn: false });
      }
    });
  }

  // Wait for GSI to load
  const interval = setInterval(() => {
    if (window.google?.accounts?.oauth2) {
      clearInterval(interval);
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            accessToken = response.access_token;
            localStorage.setItem('eagle_eye_gat', accessToken);
            fetchUserInfo().then(() => {
              onAuthChange?.({ loggedIn: true, token: accessToken, user: userInfo });
            });
          }
        },
      });
    }
  }, 100);
}

/**
 * Trigger Google Sign-In popup
 */
export function signIn() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    console.error('Google Sign-In not initialized yet');
  }
}

/**
 * Sign out
 */
export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken);
  }
  accessToken = null;
  userInfo = null;
  localStorage.removeItem('eagle_eye_gat');
  onAuthChange?.({ loggedIn: false });
}

/**
 * Get current access token
 */
export function getToken() {
  return accessToken;
}

/**
 * Get user info
 */
export function getUser() {
  return userInfo;
}

/**
 * Check if logged in
 */
export function isLoggedIn() {
  return !!accessToken;
}

/**
 * Verify token is still valid
 */
async function verifyToken() {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
    if (res.ok) {
      await fetchUserInfo();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Fetch user info from Google
 */
async function fetchUserInfo() {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      userInfo = await res.json();
    }
  } catch (e) {
    console.error('fetchUserInfo error:', e);
  }
}
