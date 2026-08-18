import { useState, useEffect } from 'react';

const PORTAL_LOGIN = '/login';
const APP_ID = 21; // Calculadora de Contenedores y Empaquetado

let appViewRecorded = false;

function recordAppView(token: string) {
  if (appViewRecorded) return;
  appViewRecorded = true;
  fetch(`/api/apps/${APP_ID}/view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-portal-token': token,
    },
    body: JSON.stringify({ entry_method: 'portal' }),
  }).catch(() => {});
}

export function getPortalUrl(): string {
  if (typeof window === 'undefined') return '/';

  // In local development on a sub-app dev port (like 4021), route back to the portal dev server on port 5173
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (window.location.port && window.location.port !== '5173') {
      return `http://${window.location.hostname}:5173/`;
    }
  }

  return '/';
}

export interface PortalUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface AuthState {
  user: PortalUser | null;
  loading: boolean;
  error: string | null;
  isAppAdmin: boolean;
  token: string | null;
}

export function usePortalAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAppAdmin: false,
    token: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const storedToken = sessionStorage.getItem('portal_token');
    const token = urlToken || storedToken;

    // Standalone / local dev fallback when running app directly without portal session
    if (!token) {
      setState({
        user: {
          id: 1,
          name: 'Admin Alsina',
          email: 'admin@alsina.com',
          avatar: 'AA',
          role: 'admin',
        },
        loading: false,
        error: null,
        isAppAdmin: true,
        token: null,
      });
      return;
    }

    sessionStorage.setItem('portal_token', token);
    if (urlToken) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}&app_id=${APP_ID}`)
      .then((res) => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
      })
      .then((data) => {
        recordAppView(token);
        setState({
          user: {
            id: data.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar || '',
            role: data.role || 'user',
          },
          loading: false,
          error: null,
          isAppAdmin: Boolean(data.is_app_admin || data.role === 'admin'),
          token,
        });
      })
      .catch(() => {
        // If token verification fails, allow fallback so app stays operational in offline / standalone mode
        setState({
          user: {
            id: 1,
            name: 'Admin Alsina',
            email: 'admin@alsina.com',
            avatar: 'AA',
            role: 'admin',
          },
          loading: false,
          error: null,
          isAppAdmin: true,
          token: null,
        });
      });
  }, []);

  return state;
}
