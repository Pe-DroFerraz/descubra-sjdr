import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Notice, State } from '../components/tourism/common';
import { Button } from '../components/ui/button';
import { deleteContent, saveContent } from './api';
import { fields, formValues, parseForm, type Entity, type Row } from './schema';
import { title, useContent, useAction } from './hooks';
export function ContentManager({
  entity,
  onDirty,
}: {
  entity: Entity;
  onDirty: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const query = useContent(entity);
  const action = useAction();
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [selected, setSelected] = useState<Row | null | undefined>(undefined),
    [deleting, setDeleting] = useState<Row | null>(null),
    [saved, setSaved] = useState(false),
    [dirty, setDirty] = useState(false);
  const rows = (query.data ?? []).filter(
    (row) =>
      (!search ||
        `${title(row)} ${row.slug ?? ''}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())) &&
      (!status ||
        (entity === 'categories'
          ? row.published
            ? 'published'
            : 'draft'
          : row.status) === status),
  );
  function select(row: Row | null | undefined) {
    if (dirty && !window.confirm(t('admin.discard'))) return;
    setDirty(false);
    onDirty(false);
    setSelected(row);
    setDeleting(null);
    setSaved(false);
  }
  return (
    <div className="mt-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="section-title">{t(`admin.entities.${entity}`)}</h2>
        <Button onClick={() => select(null)} className="gap-2">
          <Plus size={16} />
          {t('admin.new')}
        </Button>
      </div>
      {action.feedback}
      {saved && <Notice>{t('admin.saved')}</Notice>}
      {selected !== undefined && (
        <Editor
          key={selected?.id ?? 'new'}
          entity={entity}
          original={selected ?? undefined}
          onDirty={(value) => {
            setDirty(value);
            onDirty(value);
          }}
          onCancel={() => select(undefined)}
          onSaved={(row) => {
            setSelected(row);
            setDirty(false);
            onDirty(false);
            setSaved(true);
          }}
        />
      )}
      <form className="filter-bar mt-7" onSubmit={(e) => e.preventDefault()}>
        <label className="filter-label grow">
          {t('admin.search')}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={120}
          />
        </label>
        <label className="filter-label">
          {t('admin.fields.status')}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('admin.all')}</option>
            {['draft', 'pending', 'published', 'suspended'].map((value) => (
              <option key={value} value={value}>
                {t(`admin.${value}`)}
              </option>
            ))}
          </select>
        </label>
      </form>
      <State
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        <p className="mb-4 text-sm text-colonial/80">
          {rows.length} · {t('admin.managed')}
        </p>
        {!rows.length ? (
          <Notice>{t('admin.empty')}</Notice>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <article key={row.id} className="admin-record">
                <div className="min-w-0">
                  <h3 className="font-display text-xl break-words">
                    {title(row)}
                  </h3>
                  <p className="mt-1 text-xs text-colonial/80 break-all">
                    {String(row.slug ?? row.starts_at ?? '')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="pill bg-ivory">
                    {t(
                      `admin.${entity === 'categories' ? (row.published ? 'published' : 'draft') : row.status}`,
                    )}
                  </span>
                  <Button variant="outline" onClick={() => select(row)}>
                    {t('admin.edit')}
                  </Button>
                  <button
                    className="icon-button text-clay"
                    aria-label={`${t('admin.delete')}: ${title(row)}`}
                    onClick={() => setDeleting(row)}
                    disabled={action.busy}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                {deleting?.id === row.id && (
                  <div
                    className="w-full rounded-xl border border-clay/20 bg-clay/5 p-4"
                    role="group"
                    aria-label={t('admin.deleteQuestion')}
                  >
                    <p className="mb-4 text-sm">{t('admin.deleteText')}</p>
                    <div className="flex gap-3">
                      <Button
                        disabled={action.busy}
                        onClick={() =>
                          void action
                            .run(() => deleteContent(entity, row), 'deleted')
                            .then((result) => {
                              if (result) {
                                setDeleting(null);
                                if (selected?.id === row.id) select(undefined);
                              }
                            })
                        }
                      >
                        {t('admin.confirmDelete')}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={action.busy}
                        onClick={() => setDeleting(null)}
                      >
                        {t('admin.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </State>
    </div>
  );
}
function Editor({
  entity,
  original,
  onDirty,
  onCancel,
  onSaved,
}: {
  entity: Entity;
  original?: Row;
  onDirty: (dirty: boolean) => void;
  onCancel: () => void;
  onSaved: (row: Row) => void;
}) {
  const { t } = useTranslation();
  const action = useAction();
  const categories = useContent('categories'),
    places = useContent('places');
  const [values, setValues] = useState(() => formValues(entity, original)),
    [reviewed, setReviewed] = useState(false),
    [validation, setValidation] = useState(false);
  const baseline = JSON.stringify(formValues(entity, original)),
    dirty = JSON.stringify(values) !== baseline;
  useEffect(() => {
    onDirty(dirty);
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, onDirty]);
  const publishing = values.status === 'published' || values.published === true;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setValidation(false);
    if (publishing && !reviewed) {
      setValidation(true);
      return;
    }
    const result = await action.run(async () => {
      const payload = parseForm(entity, values, original);
      return saveContent(entity, payload, original);
    });
    if (result && typeof result === 'object' && 'id' in result) {
      onSaved(result as Row);
      action.clear();
      setValues(formValues(entity, result as Row));
      setReviewed(false);
    }
  }
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="admin-editor"
      aria-label={t(original ? 'admin.edit' : 'admin.new')}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl">
          {t(original ? 'admin.edit' : 'admin.new')}
        </h3>
        {dirty && (
          <span className="text-xs text-clay">{t('admin.unsaved')}</span>
        )}
      </div>
      <p className="my-4 text-xs text-colonial/80">{t('admin.cityTime')}</p>
      <fieldset disabled={action.busy} className="admin-form-grid">
        {fields[entity].map((field) => {
          const key = field.key,
            relation = field.relation === 'categories' ? categories : places;
          const change = (value: string | boolean) => {
            setValues((previous) => ({ ...previous, [key]: value }));
            setReviewed(false);
          };
          return (
            <label
              key={key}
              className={`filter-label ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}
            >
              {t(`admin.fields.${key}`)}
              {field.type === 'textarea' ? (
                <textarea
                  value={String(values[key] ?? '')}
                  onChange={(e) => change(e.target.value)}
                  maxLength={20000}
                  rows={5}
                  required={field.required}
                />
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={values[key] === true}
                  onChange={(e) => change(e.target.checked)}
                />
              ) : field.type === 'select' ? (
                <select
                  value={String(values[key] ?? '')}
                  onChange={(e) => change(e.target.value)}
                  required={field.required}
                >
                  {field.relation && (
                    <option value="">
                      {t(field.required ? 'admin.select' : 'admin.none')}
                    </option>
                  )}
                  {field.options?.map((value) => (
                    <option key={value} value={value}>
                      {t(`admin.${value}`)}
                    </option>
                  ))}
                  {field.relation &&
                    relation.data?.map((row) => (
                      <option key={row.id} value={row.id}>
                        {title(row)}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type={field.type ?? 'text'}
                  value={String(values[key] ?? '')}
                  onChange={(e) => change(e.target.value)}
                  required={field.required}
                  step={field.type === 'number' ? 'any' : undefined}
                  maxLength={field.type === 'url' ? 2000 : 2000}
                />
              )}
              {field.relation && relation.error && (
                <span className="text-clay">{t('admin.requestError')}</span>
              )}
            </label>
          );
        })}
      </fieldset>
      {publishing && (
        <label className="my-5 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
            disabled={action.busy}
          />
          {t('admin.review')}
        </label>
      )}
      {validation && (
        <p role="alert" className="my-4 text-sm text-clay">
          {t('admin.reviewRequired')}
        </p>
      )}
      {action.feedback}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={action.busy} className="gap-2">
          <Check size={16} />
          {t(action.busy ? 'loading' : 'admin.save')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={action.busy}
          onClick={onCancel}
        >
          {t('admin.cancel')}
        </Button>
      </div>
    </form>
  );
}
