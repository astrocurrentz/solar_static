import { useEffect, useState, type SubmitEvent } from 'react';
import {
  freewillApi,
  freewillCopy as copy,
  type Album,
} from '../../data/freewill';
import { Dashboard } from './Dashboard';
import { useAlbumEdits } from './useAlbumEdits';

type View = 'loading' | 'login' | 'password' | 'album' | 'error';

function readInvite() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  if (!fragment.has('access_token') && !fragment.has('error')) return null;
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  );
  return fragment;
}

async function loadAlbum(signal?: AbortSignal) {
  const response = await fetch(`${freewillApi}album`, { signal });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error();
  return (await response.json()) as Album;
}

export default function FreewillApp() {
  const [view, setView] = useState<View>('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const edits = useAlbumEdits(expire);
  const setSaved = edits.setSaved;

  function expire() {
    setError(copy.signedOut);
    setView('login');
  }

  useEffect(() => {
    const controller = new AbortController();
    const invite = readInvite();
    if (invite) {
      const access_token = invite.get('access_token');
      const refresh_token = invite.get('refresh_token');
      if (
        (invite.get('type') !== 'invite' &&
          invite.get('type') !== 'recovery') ||
        !access_token ||
        !refresh_token
      ) {
        setError(copy.inviteError);
        setView('login');
      } else {
        void fetch(`${freewillApi}invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
        })
          .then((response) => {
            if (!response.ok) throw new Error();
            if (!controller.signal.aborted) setView('password');
          })
          .catch(() => {
            if (controller.signal.aborted) return;
            setError(copy.inviteError);
            setView('login');
          });
      }
      return () => controller.abort();
    }
    void loadAlbum(controller.signal)
      .then((album) => {
        if (controller.signal.aborted) return;
        setSaved(album);
        setView(album ? 'album' : 'login');
      })
      .catch(() => {
        if (!controller.signal.aborted) setView('error');
      });
    return () => controller.abort();
  }, [loadAttempt, setSaved]);

  async function login(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${freewillApi}login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      if (!response.ok) {
        setError(response.status === 503 ? copy.loadError : copy.signInError);
        return;
      }
      setView('loading');
      setLoadAttempt((attempt) => attempt + 1);
    } catch {
      setError(copy.loadError);
    } finally {
      setBusy(false);
    }
  }

  async function setPassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get('password');
    setError('');
    if (password !== form.get('confirmation')) {
      setError(copy.passwordMismatch);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${freewillApi}password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.status === 401 || response.status === 403) {
        setError(copy.inviteError);
        setView('login');
        return;
      }
      if (!response.ok) throw new Error();
      setView('loading');
      setLoadAttempt((attempt) => attempt + 1);
    } catch {
      setError(copy.passwordError);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${freewillApi}logout`, { method: 'POST' });
      if (!response.ok) throw new Error();
      setSaved(null);
      setView('login');
    } catch {
      setError(copy.loadError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="freewill-shell">
      <header className="freewill-header">
        <a href="/work/">{copy.work}</a>
        {view === 'album' && (
          <button
            type="button"
            disabled={edits.saving || edits.failed || busy}
            onClick={() => void logout()}
          >
            {copy.signOut}
          </button>
        )}
      </header>
      <div className="freewill-title">
        <h1>{copy.album}</h1>
        <p>{copy.subtitle}</p>
      </div>
      {error && (
        <p className="freewill-error" role="alert">
          {error}
        </p>
      )}
      {view === 'loading' && <p role="status">{copy.loading}</p>}
      {view === 'error' && (
        <div className="freewill-panel">
          <p role="alert">{copy.loadError}</p>
          <button
            type="button"
            onClick={() => {
              setView('loading');
              setLoadAttempt((attempt) => attempt + 1);
            }}
          >
            {copy.retry}
          </button>
        </div>
      )}
      {view === 'login' && (
        <form
          className="freewill-panel freewill-signin"
          onSubmit={(event) => void login(event)}
        >
          <h2>{copy.signIn}</h2>
          <label>
            {copy.email}
            <input
              name="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
            />
          </label>
          <label>
            {copy.password}
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? copy.signingIn : copy.signIn}
          </button>
        </form>
      )}
      {view === 'password' && (
        <form
          className="freewill-panel freewill-signin"
          onSubmit={(event) => void setPassword(event)}
        >
          <h2>{copy.setPassword}</h2>
          <p>{copy.passwordRequirements}</p>
          <label>
            {copy.password}
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
            />
          </label>
          <label>
            {copy.confirmPassword}
            <input
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {copy.setPassword}
          </button>
        </form>
      )}
      {view === 'album' && edits.album && (
        <Dashboard
          album={edits.album}
          update={edits.update}
          retry={edits.retry}
          saving={edits.saving}
          failed={edits.failed}
          onExpired={expire}
        />
      )}
    </div>
  );
}
