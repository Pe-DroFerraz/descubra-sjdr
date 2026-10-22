import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type PropsWithChildren,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
type VerifiedAuth = {
  user: User | null;
  roles: Array<'admin' | 'advertiser'>;
  pending: boolean;
  error: boolean;
};
type AuthContextValue = VerifiedAuth & {
  configured: boolean;
  recovery: boolean;
  allowRecovery: () => void;
  finishRecovery: () => void;
  refresh: () => void;
  signOut: () => Promise<boolean>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>(
    supabase ? undefined : null,
  );
  const [state, setState] = useState<VerifiedAuth>({
    user: null,
    roles: [],
    pending: !!supabase,
    error: false,
  });
  const [recovery, setRecovery] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      // Keep callback synchronous: do not await Supabase calls while its auth lock is held.
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setRecovery(false);
      setState({ user: null, roles: [], pending: !!next, error: false });
      setSession(next);
    });
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active)
          setSession((previous) =>
            previous === undefined ? (error ? null : data.session) : previous,
          );
      })
      .catch(() => {
        if (active) setSession(null);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (session === undefined) return;
    if (!session || !supabase) {
      setState({ user: null, roles: [], pending: false, error: false });
      return;
    }
    const db = supabase;
    let active = true;
    setState({ user: null, roles: [], pending: true, error: false });
    void (async () => {
      try {
        const verified = await db.auth.getUser(session.access_token);
        if (verified.error || !verified.data.user)
          throw new Error('Session verification failed');
        const user = verified.data.user;
        const [admin, advertisers] = await Promise.all([
          db.rpc('has_role', { requested: 'admin' }),
          db
            .from('advertisers')
            .select('id')
            .eq('owner_id', user.id)
            .eq('status', 'approved')
            .limit(1),
        ]);
        if (admin.error || advertisers.error)
          throw new Error('Role verification failed');
        const roles: Array<'admin' | 'advertiser'> = [];
        if (admin.data === true) roles.push('admin');
        if (advertisers.data?.length) roles.push('advertiser');
        if (active) setState({ user, roles, pending: false, error: false });
      } catch {
        if (active)
          setState({ user: null, roles: [], pending: false, error: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [session, revision]);
  const allowRecovery = useCallback(() => setRecovery(true), []);
  const finishRecovery = useCallback(() => setRecovery(false), []);
  return (
    <AuthContext.Provider
      value={{
        ...state,
        configured: !!supabase,
        recovery,
        allowRecovery,
        finishRecovery,
        refresh: () => setRevision((value) => value + 1),
        signOut: async () => {
          if (!supabase) return true;
          try {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            if (error) return false;
            setRecovery(false);
            setSession(null);
            setState({ user: null, roles: [], pending: false, error: false });
            return true;
          } catch {
            return false;
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider required');
  return value;
}
