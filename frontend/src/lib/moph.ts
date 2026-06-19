// MOPH Provider ID OAuth helpers (frontend side).
// Because the app uses HashRouter, the OAuth redirect_uri must be the origin root
// (providers reject fragments), so the authorization code arrives in window.location.search
// on initial load and is picked up by MophCallbackWatcher.

const STATE_KEY = 'moph_oauth_state';
export const MOPH_REG_TOKEN_KEY = 'moph_reg_token';
export const MOPH_REG_PREFILL_KEY = 'moph_reg_prefill';
export const MOPH_ERROR_KEY = 'moph_error';

export interface MophOrg {
  hcode: string;
  hname: string;
  position: string;
  positionId: string;
}
export interface MophPrefill {
  name: string;
  organizations: MophOrg[];
  cid: string | null;
  email: string | null;
}

export function isMophConfigured(): boolean {
  return Boolean(import.meta.env.VITE_MOPH_URL && import.meta.env.VITE_MOPH_CLIENT_ID);
}

/** Build the MOPH authorize URL and stash a fresh CSRF state in sessionStorage. */
export function buildMophAuthUrl(): string {
  const base = import.meta.env.VITE_MOPH_URL;
  const clientId = import.meta.env.VITE_MOPH_CLIENT_ID;
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${window.location.origin}/`,
    scope: 'ProviderID',
    state,
  });
  return `${base}/oauth/redirect?${params.toString()}`;
}

/** Read ?code & ?state from the current URL (returns null when not a callback). */
export function readMophCallback(): { code: string; state: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return null;
  return { code, state: params.get('state') ?? '' };
}

/** Validate the returned state against the stored one (single-use). */
export function verifyAndClearState(state: string): boolean {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return Boolean(saved) && saved === state;
}

/** Strip the ?code/?state query from the address bar, keeping the hash route. */
export function clearCallbackQuery(): void {
  window.history.replaceState({}, '', `${window.location.origin}/${window.location.hash || '#/'}`);
}
