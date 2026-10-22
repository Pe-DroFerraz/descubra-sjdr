import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Notice, Page, State } from '../components/tourism/common';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/context';
import {
  authCallbackUrl,
  emailRequestState,
  emailSchema,
  loginSchema,
  passwordSchema,
  safeAuthNext,
} from '../auth/security';
import { exchangeCodeOnce } from '../auth/callback';
export default function SignIn() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'password' | 'magic'>('password'),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || pending) return;
    setMessage('');
    if (
      !emailSchema.safeParse(email).success ||
      (mode === 'password' &&
        !loginSchema.safeParse({ email, password }).success)
    ) {
      setMessage('auth.invalid');
      return;
    }
    setPending(true);
    try {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) setMessage('auth.loginError');
        else navigate(safeAuthNext(params.get('next')), { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: false,
            emailRedirectTo: authCallbackUrl(
              window.location.origin,
              safeAuthNext(params.get('next')),
            ),
          },
        });
        setMessage(`auth.${emailRequestState(error)}`);
      }
    } catch {
      setMessage('auth.requestError');
    } finally {
      setPassword('');
      setPending(false);
    }
  }
  return (
    <Page title={t('auth.signIn')} description={t('auth.signInIntro')}>
      <div className="mx-auto max-w-lg rounded-2xl border border-colonial/15 bg-white p-6 sm:p-8">
        {!auth.configured ? (
          <Notice>{t('auth.unavailable')}</Notice>
        ) : (
          <>
            <div
              className="mb-7 flex flex-wrap gap-3"
              role="group"
              aria-label={t('auth.method')}
            >
              <Button
                variant={mode === 'password' ? 'default' : 'outline'}
                aria-pressed={mode === 'password'}
                onClick={() => {
                  setMode('password');
                  setMessage('');
                }}
              >
                {t('auth.password')}
              </Button>
              <Button
                variant={mode === 'magic' ? 'default' : 'outline'}
                aria-pressed={mode === 'magic'}
                onClick={() => {
                  setMode('magic');
                  setMessage('');
                }}
              >
                {t('auth.magic')}
              </Button>
            </div>
            <form
              onSubmit={(event) => void submit(event)}
              className="space-y-5"
            >
              <label className="filter-label">
                {t('auth.email')}
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {mode === 'password' && (
                <label className="filter-label">
                  {t('auth.password')}
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              <Button type="submit" disabled={pending} className="w-full">
                {t(
                  pending
                    ? 'loading'
                    : mode === 'password'
                      ? 'auth.signIn'
                      : 'auth.sendLink',
                )}
              </Button>
            </form>
            {message && (
              <div className="mt-5" role="status">
                <Notice>{t(message)}</Notice>
              </div>
            )}
            <p className="mt-5 text-xs leading-relaxed text-colonial/80">
              {t('auth.noSignup')}
            </p>
            <Link className="text-link mt-5" to="/recuperar-senha">
              {t('auth.forgot')}
            </Link>
          </>
        )}
      </div>
    </Page>
  );
}
export function Recover() {
  const { t } = useTranslation(),
    auth = useAuth();
  const [email, setEmail] = useState(''),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || pending) return;
    if (!emailSchema.safeParse(email).success) {
      setMessage('auth.invalid');
      return;
    }
    setPending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: authCallbackUrl(window.location.origin) },
      );
      setMessage(`auth.${emailRequestState(error)}`);
    } catch {
      setMessage('auth.requestError');
    } finally {
      setPending(false);
    }
  }
  return (
    <Page title={t('auth.recover')}>
      <div className="mx-auto max-w-lg rounded-2xl border border-colonial/15 bg-white p-7">
        {!auth.configured ? (
          <Notice>{t('auth.unavailable')}</Notice>
        ) : (
          <>
            <form
              onSubmit={(event) => void submit(event)}
              className="space-y-5"
            >
              <label className="filter-label">
                {t('auth.email')}
                <input
                  required
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <Button type="submit" disabled={pending}>
                {t(pending ? 'loading' : 'auth.sendLink')}
              </Button>
            </form>
            {message && (
              <div role="status" className="mt-5">
                <Notice>{t(message)}</Notice>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
export function AuthCallback() {
  const { t } = useTranslation(),
    auth = useAuth(),
    navigate = useNavigate();
  const [callback] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return { code: params.get('code'), next: safeAuthNext(params.get('next')) };
  });
  const [failed, setFailed] = useState(false);
  const allowRecovery = auth.allowRecovery;
  useEffect(() => {
    // Remove codes/errors/fragments before making requests or rendering any external resources.
    window.history.replaceState(null, '', '/auth/confirmar');
    let active = true;
    if (!callback.code || callback.code.length > 4096) {
      setFailed(true);
      return;
    }
    void exchangeCodeOnce(callback.code)
      .then((result) => {
        if (!active) return;
        if (result.recovery) allowRecovery();
        navigate(result.recovery ? '/auth/nova-senha' : callback.next, {
          replace: true,
        });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
    // The code exchange is deduplicated across React StrictMode effect replay.
  }, [callback, navigate, allowRecovery]);
  return (
    <Page title={t('auth.confirm')}>
      <State pending={!failed} />
      {failed && (
        <Notice>
          {t('auth.callbackError')}{' '}
          <Link className="text-link" to="/entrar">
            {t('auth.signIn')}
          </Link>
        </Notice>
      )}
    </Page>
  );
}
export function NewPassword() {
  const { t } = useTranslation(),
    auth = useAuth(),
    navigate = useNavigate();
  const [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || pending || !auth.recovery || !auth.user) return;
    if (
      !passwordSchema.safeParse(password).success ||
      password !== confirmation
    ) {
      setMessage('auth.passwordPolicy');
      return;
    }
    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage('auth.requestError');
      else {
        auth.finishRecovery();
        navigate('/conta', { replace: true });
      }
    } catch {
      setMessage('auth.requestError');
    } finally {
      setPassword('');
      setConfirmation('');
      setPending(false);
    }
  }
  return (
    <Page title={t('auth.newPassword')}>
      {auth.pending ? (
        <State pending />
      ) : !auth.recovery || !auth.user ? (
        <Notice>
          {t('auth.recoveryRequired')}{' '}
          <Link className="text-link" to="/recuperar-senha">
            {t('auth.recover')}
          </Link>
        </Notice>
      ) : (
        <form
          onSubmit={(event) => void submit(event)}
          className="mx-auto max-w-lg space-y-5 rounded-2xl border border-colonial/15 bg-white p-7"
        >
          <p className="text-sm">{t('auth.passwordPolicy')}</p>
          <label className="filter-label">
            {t('auth.newPassword')}
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="filter-label">
            {t('auth.confirmPassword')}
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={pending}>
            {t(pending ? 'loading' : 'auth.savePassword')}
          </Button>
          {message && <Notice>{t(message)}</Notice>}
        </form>
      )}
    </Page>
  );
}
export function Account() {
  const { t } = useTranslation(),
    auth = useAuth();
  const [failed, setFailed] = useState(false);
  if (auth.pending)
    return (
      <Page title={t('auth.account')}>
        <State pending />
      </Page>
    );
  if (auth.error)
    return (
      <Page title={t('auth.account')}>
        <Notice>{t('auth.verifyError')}</Notice>
        <div className="mt-5 flex gap-3">
          <Button onClick={auth.refresh}>{t('retry')}</Button>
          <Button
            variant="outline"
            onClick={() => void auth.signOut().then((ok) => setFailed(!ok))}
          >
            {t('auth.signOut')}
          </Button>
        </div>
        {failed && <Notice>{t('auth.requestError')}</Notice>}
      </Page>
    );
  if (!auth.user) return <Navigate to="/entrar?next=%2Fconta" replace />;
  return (
    <Page title={t('auth.account')}>
      <div className="max-w-2xl space-y-5 rounded-2xl border border-colonial/15 bg-white p-7">
        <p>{auth.user.email}</p>
        <p>
          {t('auth.roles')}:{' '}
          {auth.roles.length
            ? auth.roles.map((role) => t(`auth.${role}`)).join(', ')
            : t('auth.visitor')}
        </p>
        <Notice>{t('auth.panelsPending')}</Notice>
        {auth.roles.includes('admin') && <Notice>{t('auth.adminMfa')}</Notice>}
        <Button
          variant="outline"
          onClick={() => void auth.signOut().then((ok) => setFailed(!ok))}
        >
          {t('auth.signOut')}
        </Button>
        {failed && <Notice>{t('auth.requestError')}</Notice>}
      </div>
    </Page>
  );
}
