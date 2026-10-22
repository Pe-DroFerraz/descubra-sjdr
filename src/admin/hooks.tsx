import { ZodError } from 'zod';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/context';
import { AdminError, listContent } from './api';
import type { Entity, Row } from './schema';
export function title(row: Row) {
  return String(row.name ?? row.title ?? '');
}
export function useContent(entity: Entity) {
  const auth = useAuth();
  return useQuery({
    queryKey: ['admin', auth.user?.id, entity],
    queryFn: ({ signal }) => listContent(entity, signal),
    retry: false,
    staleTime: 0,
  });
}
export function useAction() {
  const { t } = useTranslation();
  const query = useQueryClient();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false);
  async function run(task: () => Promise<unknown>, success = 'saved') {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      const result = await task();
      await Promise.all([
        query.invalidateQueries({ queryKey: ['admin'] }),
        query.invalidateQueries({ queryKey: ['public'] }),
      ]);
      setMessage(t(`admin.${success}`));
      return result ?? true;
    } catch (error) {
      setFailed(true);
      const key =
        error instanceof AdminError
          ? error.key
          : error instanceof ZodError &&
              error.issues.some(
                (issue) => issue.message === 'publicationIncomplete',
              )
            ? 'publicationIncomplete'
            : 'invalid';
      setMessage(
        t(`admin.${key}`) +
          (error instanceof AdminError && error.cleanupPath
            ? ' ' + error.cleanupPath
            : ''),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    run,
    clear: () => setMessage(''),
    feedback: message ? (
      <div
        role={failed ? 'alert' : 'status'}
        className={`admin-feedback ${failed ? 'border-clay/30 bg-clay/5' : 'border-emerald-800/20 bg-emerald-50'}`}
      >
        {message}
      </div>
    ) : null,
  };
}
