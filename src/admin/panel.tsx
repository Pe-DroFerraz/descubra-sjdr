import { useEffect, useState, type PropsWithChildren } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/context';
import { Page, Notice, State } from '../components/tourism/common';
import { Button } from '../components/ui/button';
import { entities, type Entity } from './schema';
import { CatalogReview } from './review';
import { ContentManager } from './editor';
import { StopsManager } from './stops';
import { MediaManager } from './gallery';
function Guard({ children }: PropsWithChildren) {
  const auth = useAuth(),
    query = useQueryClient();
  const { t } = useTranslation();
  useEffect(
    () => () => {
      void query.cancelQueries({ queryKey: ['admin'] });
      query.removeQueries({ queryKey: ['admin'] });
    },
    [auth.user?.id, query],
  );
  if (auth.pending)
    return (
      <Page title={t('admin.access')}>
        <State pending />
      </Page>
    );
  if (auth.error)
    return (
      <Page title={t('admin.access')}>
        <Notice>{t('auth.verifyError')}</Notice>
        <Button onClick={auth.refresh} className="mt-5">
          {t('retry')}
        </Button>
      </Page>
    );
  if (!auth.user) return <Navigate to="/entrar?next=%2Fadmin" replace />;
  if (!auth.roles.includes('admin'))
    return (
      <Page title={t('admin.restricted')}>
        <Notice>{t('admin.restrictedText')}</Notice>
      </Page>
    );
  return children;
}
export default function Admin() {
  return (
    <Guard>
      <Studio />
    </Guard>
  );
}
function Studio() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [dirty, setDirty] = useState(false);
  const section = params.get('secao') ?? 'places';
  const active = entities.includes(section as Entity)
    ? (section as Entity)
    : section === 'media' || section === 'stops' || section === 'catalog'
      ? section
      : 'places';
  function change(next: string) {
    if (dirty && !window.confirm(t('admin.discard'))) return;
    setDirty(false);
    setParams({ secao: next });
  }
  return (
    <Page
      title={t('admin.title')}
      eyebrow={t('admin.eyebrow')}
      description={t('admin.intro')}
    >
      <div className="admin-banner">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} />
          <span>{t('admin.access')}</span>
        </div>
        <Link
          className="text-link"
          to="/lugares"
          onClick={(e) => {
            if (dirty && !window.confirm(t('admin.discard')))
              e.preventDefault();
          }}
        >
          {t('admin.preview')}
        </Link>
      </div>
      <div className="admin-layout">
        <nav className="admin-nav" aria-label={t('admin.access')}>
          {entities.map((entity) => (
            <button
              key={entity}
              aria-current={active === entity ? 'page' : undefined}
              onClick={() => change(entity)}
            >
              {t(`admin.entities.${entity}`)}
            </button>
          ))}
          {(['media', 'stops', 'catalog'] as const).map((key) => (
            <button
              key={key}
              aria-current={active === key ? 'page' : undefined}
              onClick={() => change(key)}
            >
              {t(`admin.${key}`)}
            </button>
          ))}
        </nav>
        <section className="min-w-0">
          <Notice>{t('admin.draftNote')}</Notice>
          {active === 'media' ? (
            <MediaManager key={active} />
          ) : active === 'stops' ? (
            <StopsManager key={active} onDirty={setDirty} />
          ) : active === 'catalog' ? (
            <CatalogReview />
          ) : (
            <ContentManager key={active} entity={active} onDirty={setDirty} />
          )}
        </section>
      </div>
    </Page>
  );
}
