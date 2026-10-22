import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, MapPin } from 'lucide-react';
import { useTips } from '../data/queries';
import { directions, normalize } from '../lib/tourism';
import { ExternalLink, Page, State } from '../components/tourism/common';
export default function Tips() {
  const { t } = useTranslation();
  const tips = useTips();
  const [category, setCategory] = useState(''),
    [search, setSearch] = useState('');
  const categories = Array.from(
    new Set(tips.data?.map((t) => t.category)),
  ).sort();
  const filtered =
    tips.data?.filter(
      (t) =>
        (!category || t.category === category) &&
        normalize(`${t.title} ${t.description}`).includes(normalize(search)),
    ) ?? [];
  return (
    <Page
      title={t('tips')}
      eyebrow="SÃO JOÃO DEL-REI"
      description={t('footerNote')}
    >
      <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
        <label className="search-field">
          <Compass size={18} />
          <span className="sr-only">{t('search')}</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <label className="filter-label">
          {t('category')}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t('all')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(c, { defaultValue: c })}
              </option>
            ))}
          </select>
        </label>
      </form>
      <State
        resource="tips"
        pending={tips.isPending}
        error={tips.error}
        retry={() => void tips.refetch()}
        filtered={!!tips.data?.length && !!(search || category)}
        empty={!filtered.length}
      >
        <div className="card-grid">
          {filtered.map((tip) => (
            <article className="tip-card" key={tip.id}>
              <Compass className="text-clay" size={28} strokeWidth={1.2} />
              <p className="eyebrow mt-7">
                {t(tip.category, { defaultValue: tip.category })}
              </p>
              <h2 className="mt-3 font-display text-2xl">{tip.title}</h2>
              <p className="my-4 whitespace-pre-line text-sm leading-relaxed text-colonial/75">
                {tip.description}
              </p>
              <ExternalLink href={directions({ ...tip, address: null })}>
                <MapPin size={15} />
                {t('directions')}
              </ExternalLink>
            </article>
          ))}
        </div>
      </State>
    </Page>
  );
}
