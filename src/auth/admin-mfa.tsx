import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from './context';
import { Page, Notice } from '../components/tourism/common';
import { Button } from '../components/ui/button';

type Enrollment = {
  id: string;
  qr: string;
  secret: string;
};

const strings = {
  pt: {
    title: 'Confirmação de segurança',
    intro: 'Para acessar o painel administrativo, confirme sua identidade com um aplicativo autenticador.',
    prepare: 'Ative o segundo fator para proteger sua conta de administrador.',
    enroll: 'Configurar autenticação em duas etapas',
    scan: 'Escaneie o QR Code em um aplicativo autenticador. Se necessário, use a chave manual:',
    verify: 'Digite o código de 6 números do aplicativo',
    confirm: 'Confirmar código',
    error: 'Não foi possível confirmar o código. Confira o aplicativo e tente novamente.',
    loadError: 'Não foi possível carregar a configuração de autenticação.',
    invalid: 'Informe um código de seis números.',
    loading: 'Verificando...',
  },
  en: {
    title: 'Security verification',
    intro: 'Verify your identity with an authenticator app before accessing the admin panel.',
    prepare: 'Enable a second factor to protect your administrator account.',
    enroll: 'Set up two-factor authentication',
    scan: 'Scan this QR code with an authenticator app, or enter the setup key:',
    verify: 'Enter the 6-digit code from your authenticator app',
    confirm: 'Verify code',
    error: 'Could not verify the code. Check your authenticator app and try again.',
    loadError: 'Could not load authentication settings.',
    invalid: 'Enter a six-digit code.',
    loading: 'Verifying...',
  },
  es: {
    title: 'Verificación de seguridad',
    intro: 'Confirma tu identidad con una aplicación de autenticación para acceder a la administración.',
    prepare: 'Activa el segundo factor para proteger tu cuenta de administrador.',
    enroll: 'Configurar autenticación en dos pasos',
    scan: 'Escanea el código QR con una aplicación de autenticación o introduce la clave:',
    verify: 'Introduce el código de seis dígitos de la aplicación',
    confirm: 'Confirmar código',
    error: 'No se pudo verificar el código. Compruébalo y vuelve a intentarlo.',
    loadError: 'No se pudo cargar la configuración de autenticación.',
    invalid: 'Introduce un código de seis dígitos.',
    loading: 'Verificando...',
  },
} as const;

export function AdminMFA() {
  const { i18n } = useTranslation();
  const t = strings[i18n.language.startsWith('en') ? 'en' : i18n.language.startsWith('es') ? 'es' : 'pt'];
  const auth = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    void client.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(t.loadError);
      else setFactorId(data.totp.find((factor) => factor.status === 'verified')?.id ?? null);
      setLoading(false);
    }).catch(() => {
      if (active) { setMessage(t.loadError); setLoading(false); }
    });
    return () => { active = false; };
  }, [auth.user?.id, t.loadError]);

  async function enroll() {
    if (!supabase || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Descubra SJDR Admin',
      });
      if (error || !data.totp) throw new Error('Enrollment rejected');
      setEnrollment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      setMessage(t.loadError);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    if (!/^[0-9]{6}$/.test(code)) { setMessage(t.invalid); return; }
    const currentFactor = factorId ?? enrollment?.id;
    if (!currentFactor) return;
    setBusy(true);
    setMessage('');
    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: currentFactor });
      if (challengeError || !challenge) throw new Error('Challenge rejected');
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: currentFactor,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw new Error('Invalid verification code');
      setCode('');
      setEnrollment(null);
      // The server-side has_role(admin) check is the authorization boundary.
      // Verifying TOTP upgrades the Supabase session to aal2 before rechecking roles.
      auth.refresh();
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title={t.title} description={t.intro}>
      <section className="mx-auto max-w-lg rounded-2xl border border-colonial/15 bg-white p-6 sm:p-8">
        {loading ? <p aria-live="polite">{t.loading}</p> : (
          <>
            {message && <div role="alert" className="mb-5"><Notice>{message}</Notice></div>}
            {!factorId && !enrollment && (
              <>
                <p className="mb-5 text-sm">{t.prepare}</p>
                <Button type="button" disabled={busy} onClick={() => void enroll()}>{t.enroll}</Button>
              </>
            )}
            {enrollment && (
              <div className="mb-6 space-y-3">
                <p>{t.scan}</p>
                {enrollment.qr.startsWith('data:image/svg+xml') && (
                  <img src={enrollment.qr} alt="TOTP setup QR code" className="mx-auto h-44 w-44" />
                )}
                <code className="block break-all rounded-lg bg-ivory p-3 text-sm" aria-label="TOTP secret">{enrollment.secret}</code>
              </div>
            )}
            {(factorId || enrollment) && (
              <form onSubmit={(event) => void confirm(event)} className="space-y-4">
                <label className="filter-label">
                  {t.verify}
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </label>
                <Button type="submit" disabled={busy}>{busy ? t.loading : t.confirm}</Button>
              </form>
            )}
          </>
        )}
      </section>
    </Page>
  );
}
