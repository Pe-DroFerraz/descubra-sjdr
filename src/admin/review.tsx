import { useTranslation } from 'react-i18next';
import proposal from '../../content/catalogo-inicial.json';
import { Notice } from '../components/tourism/common';
export function CatalogReview() {
  const { t } = useTranslation();
  return (
    <div className="mt-7">
      <h2 className="section-title mb-5">{t('admin.catalog')}</h2>
      <Notice>{t('admin.catalogIntro')}</Notice>
      <p className="my-5 text-sm">
        {proposal.places.length} · {t('admin.entities.places')} ·{' '}
        {proposal.routes.length} · {t('admin.entities.routes')}
      </p>
      <div className="space-y-4">
        {proposal.places.map((place) => (
          <article key={place.id} className="admin-record block">
            <h3 className="font-display text-xl">{place.name}</h3>
            <p className="my-3 text-sm">{place.address ?? t('admin.none')}</p>
            <span className="pill bg-ochre/10 text-clay">
              {t('admin.sourcePending')}
            </span>
            <ul className="mt-4 space-y-2 text-sm text-colonial/80">
              {place.editorial.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              {proposal.sources
                .filter((source) =>
                  place.editorial.source_ids.includes(source.id),
                )
                .map((source) => (
                  <a
                    className="text-link break-all"
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.title}
                  </a>
                ))}
            </div>
          </article>
        ))}
      </div>
      <h3 className="section-title my-7">{t('admin.entities.routes')}</h3>
      <div className="space-y-5">
        {proposal.routes.map((route) => (
          <article key={route.id} className="admin-editor">
            <h4 className="font-display text-2xl">{route.name}</h4>
            <ol className="my-4 list-inside list-decimal space-y-2 text-sm">
              {route.stops.map((stop) => (
                <li key={stop.place_id}>
                  {
                    proposal.places.find((place) => place.id === stop.place_id)
                      ?.name
                  }
                </li>
              ))}
            </ol>
            {route.editorial.notes.map((note) => (
              <p key={note} className="mt-2 text-sm text-colonial/80">
                {note}
              </p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
