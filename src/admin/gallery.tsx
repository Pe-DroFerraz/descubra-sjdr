import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { useAuth } from '../auth/context';
import { Notice, Photo, State } from '../components/tourism/common';
import { Button } from '../components/ui/button';
import { AdminError } from './api';
import type { Row } from './schema';
import {
  deleteMedia,
  listPhotos,
  photoDetails,
  updatePhoto,
  uploadMedia,
  type PhotoRow,
  type Rights,
} from './media';
import { title, useContent, useAction } from './hooks';
export function MediaManager() {
  const { t } = useTranslation();
  const places = useContent('places'),
    events = useContent('events');
  const [bucket, setBucket] = useState<'place-photos' | 'event-images'>(
      'place-photos',
    ),
    [id, setId] = useState('');
  const list = bucket === 'place-photos' ? places : events;
  const target = list.data?.find((row) => row.id === id);
  return (
    <div className="mt-7">
      <h2 className="section-title mb-5">{t('admin.media')}</h2>
      <div className="mb-6 flex flex-wrap gap-4">
        <label className="filter-label">
          {t('admin.media')}
          <select
            value={bucket}
            onChange={(e) => {
              setBucket(e.target.value as typeof bucket);
              setId('');
            }}
          >
            <option value="place-photos">{t('admin.entities.places')}</option>
            <option value="event-images">{t('admin.entities.events')}</option>
          </select>
        </label>
        <label className="filter-label grow">
          {t(
            bucket === 'place-photos'
              ? 'admin.selectPlace'
              : 'admin.selectEvent',
          )}
          <select value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">{t('admin.select')}</option>
            {list.data?.map((row) => (
              <option key={row.id} value={row.id}>
                {title(row)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <State
        pending={list.isPending}
        error={list.error}
        retry={() => void list.refetch()}
      >
        {target && (
          <Gallery
            key={`${bucket}-${target.id}`}
            target={target}
            bucket={bucket}
          />
        )}
      </State>
    </div>
  );
}
function Gallery({
  target,
  bucket,
}: {
  target: Row;
  bucket: 'place-photos' | 'event-images';
}) {
  const { t } = useTranslation(),
    auth = useAuth();
  const action = useAction();
  const query = useQuery({
    queryKey: ['admin', auth.user?.id, 'photos', target.id],
    queryFn: () => listPhotos(target.id),
    enabled: bucket === 'place-photos',
    retry: false,
  });
  const [editing, setEditing] = useState<PhotoRow | null>(null),
    [alt, setAlt] = useState(''),
    [position, setPosition] = useState('0'),
    [file, setFile] = useState<File | null>(null),
    [fileVersion, setFileVersion] = useState(0),
    [license, setLicense] = useState<Rights['license']>('own-authorized'),
    [author, setAuthor] = useState(''),
    [source, setSource] = useState(''),
    [confirmed, setConfirmed] = useState(false),
    [warning, setWarning] = useState(''),
    [deleting, setDeleting] = useState<PhotoRow | Row | null>(null);
  const details = useQuery({
    queryKey: ['admin', auth.user?.id, 'rights', editing?.storage_path],
    queryFn: () => photoDetails(editing!),
    enabled: !!editing,
    retry: false,
  });
  async function save(e: FormEvent) {
    e.preventDefault();
    setWarning('');
    const result = await action.run(async () => {
      if (editing) {
        await updatePhoto(editing, alt, Number(position));
        return null;
      }
      if (!file) throw new AdminError('imageSize');
      const extra = await uploadMedia(
        target,
        bucket,
        file,
        { license, author, source, confirmed: confirmed as true },
        alt,
        Number(position),
      );
      if (extra) setWarning(`${t(`admin.${extra.warning}`)} ${extra.path}`);
    });
    if (result) {
      setEditing(null);
      setAlt('');
      setPosition('0');
      setFile(null);
      setFileVersion((value) => value + 1);
      setConfirmed(false);
    }
  }
  return (
    <div className="space-y-6">
      <Notice>{t('admin.mediaIntro')}</Notice>
      <p className="text-sm leading-relaxed">{t('admin.licenseNote')}</p>
      <form onSubmit={(e) => void save(e)} className="admin-editor">
        <h3 className="mb-5 flex items-center gap-3 font-display text-2xl">
          <ImagePlus size={24} />
          {t(editing ? 'admin.editPhoto' : 'admin.upload')}
        </h3>
        <fieldset disabled={action.busy} className="admin-form-grid">
          <label className="filter-label sm:col-span-2">
            {t('admin.alt')}
            <input
              required
              maxLength={1000}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>
          {bucket === 'place-photos' && (
            <label className="filter-label">
              {t('admin.position')}
              <input
                type="number"
                required
                min={0}
                max={10000}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </label>
          )}
          {!editing && (
            <>
              <label className="filter-label">
                {t('admin.file')}
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  key={fileVersion}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="filter-label">
                {t('admin.license')}
                <select
                  value={license}
                  onChange={(e) =>
                    setLicense(e.target.value as Rights['license'])
                  }
                >
                  <option value="own-authorized">{t('admin.own')}</option>
                  <option value="cc0">CC0</option>
                  <option value="public-domain">{t('admin.domain')}</option>
                </select>
              </label>
              <label className="filter-label">
                {t('admin.author')}
                <input
                  required
                  maxLength={200}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </label>
              <label className="filter-label sm:col-span-2">
                {t('admin.source')}
                <input
                  type="url"
                  required={license !== 'own-authorized'}
                  maxLength={2000}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </label>
            </>
          )}
        </fieldset>
        {!editing && (
          <label className="my-5 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={action.busy}
            />
            {t('admin.rights')}
          </label>
        )}
        {editing && (
          <div className="my-4 text-sm">
            <p>{t('admin.rightsDetails')}</p>
            {details.isPending ? (
              t('loading')
            ) : details.error ? (
              t('admin.mediaMetadata')
            ) : details.data?.success ? (
              <p>
                {details.data.data.author} · {details.data.data.license} ·{' '}
                {details.data.data.source}
              </p>
            ) : (
              <Notice>{t('admin.noRights')}</Notice>
            )}
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <Button type="submit" disabled={action.busy}>
            {t(
              action.busy
                ? 'admin.uploading'
                : editing
                  ? 'admin.save'
                  : 'admin.upload',
            )}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="outline"
              disabled={action.busy}
              onClick={() => {
                setEditing(null);
                setAlt('');
                setPosition('0');
              }}
            >
              {t('admin.cancel')}
            </Button>
          )}
        </div>
      </form>
      {action.feedback}
      {warning && <Notice>{warning}</Notice>}
      {bucket === 'place-photos' ? (
        <State
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        >
          {!query.data?.length ? (
            <Notice>{t('admin.noImages')}</Notice>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {query.data.map((photo) => (
                <article key={photo.id} className="place-card">
                  <div className="h-44">
                    <Photo path={photo.storage_path} alt={photo.alt_text} />
                  </div>
                  <div className="space-y-3 p-4">
                    <p>{photo.alt_text}</p>
                    <p className="text-xs">
                      {t('admin.position')}: {photo.position}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        disabled={action.busy}
                        onClick={() => {
                          setEditing(photo);
                          setAlt(photo.alt_text);
                          setPosition(String(photo.position));
                        }}
                      >
                        {t('admin.editPhoto')}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={action.busy}
                        onClick={() => setDeleting(photo)}
                      >
                        {t('admin.deleteImage')}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </State>
      ) : target.image_path ? (
        <div className="max-w-lg">
          <div className="h-52 overflow-hidden rounded-2xl">
            <Photo
              bucket="event-images"
              path={String(target.image_path)}
              alt={title(target)}
            />
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setDeleting(target)}
          >
            {t('admin.deleteImage')}
          </Button>
        </div>
      ) : (
        <Notice>{t('admin.noImages')}</Notice>
      )}
      {deleting && (
        <div
          className="admin-editor"
          role="group"
          aria-label={t('admin.deleteQuestion')}
        >
          <p>{t('admin.deleteText')}</p>
          <div className="mt-4 flex gap-3">
            <Button
              disabled={action.busy}
              onClick={() =>
                void action
                  .run(async () => {
                    const extra = await deleteMedia(deleting, bucket);
                    if (extra)
                      setWarning(
                        `${t(`admin.${extra.warning}`)} ${extra.path}`,
                      );
                  }, 'deleted')
                  .then((result) => {
                    if (result) setDeleting(null);
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
    </div>
  );
}
