import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  CalendarDays,
  Camera,
  HeartPulse,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import {
  type CustomerCareProfile,
  type CustomerCareRecord,
  type Service,
  type StaffProfile,
} from '../../lib/supabase'
import { easternDateKey, formatDateKey } from '../../lib/dateTime'

type AdminLocale = 'zh' | 'en'

const labels = {
  zh: {
    healthTitle: '健康档案',
    healthNote: '过敏史与健康状况仅内部员工可见，每次到店前请先确认。',
    allergies: '过敏史',
    allergiesPlaceholder: '如：对某些精油、染发剂或花粉过敏',
    healthNotes: '其他健康注意事项',
    healthPlaceholder: '如：孕期、颈椎或肩颈问题、皮肤病史、正在服用的药物',
    scalpBaseline: '头皮基线情况',
    scalpBaselinePlaceholder: '首次记录的头皮与发质状态，便于后续对比',
    edit: '编辑',
    save: '保存',
    saving: '保存中…',
    cancel: '取消',
    saved: '已保存',
    saveFailed: '保存失败，请重试',
    healthEmpty: '尚未记录过敏史与健康注意事项',
    recordsTitle: '护理记录',
    recordsNote: '记录每次护理的日期、项目、头皮检测与前后对比照片。',
    addRecord: '新增护理记录',
    editRecord: '编辑护理记录',
    recordDate: '护理日期',
    services: '护理项目',
    provider: '护理师',
    scalpAssessment: '头皮检测情况',
    scalpPlaceholder: '如：头顶偏油、发际线干燥、局部轻微泛红',
    treatmentNotes: '护理过程与使用产品',
    treatmentPlaceholder: '如：草本净护 + 舒缓手法，使用了舒缓精华',
    followUp: '下次跟进建议',
    followUpPlaceholder: '如：下次重点观察发际线干燥情况',
    beforePhoto: '护理前照片',
    afterPhoto: '护理后照片',
    choosePhoto: '选择照片',
    replacePhoto: '更换照片',
    removePhoto: '移除',
    deleting: '删除中…',
    deleteRecord: '删除',
    confirmDelete: '确定删除这条护理记录吗？删除后无法恢复。',
    noRecords: '暂无护理记录',
    loading: '正在加载档案…',
    loadFailed: '无法加载档案，请确认数据库迁移与登录权限。',
    imageTooLarge: '单张照片不能超过 3MB',
    uploadFailed: '照片上传失败，请重试',
    recordSaved: '护理记录已保存',
    recordSaveFailed: '保存失败，请重试',
    invalidDate: '请选择护理日期',
    noProvider: '未指定护理师',
    optional: '选填',
    recordsCount: '次护理记录',
  },
  en: {
    healthTitle: 'Health profile',
    healthNote: 'Allergies and health notes are visible to staff only. Review before every visit.',
    allergies: 'Allergies',
    allergiesPlaceholder: 'e.g. sensitive to certain essential oils, hair dye or pollen',
    healthNotes: 'Other health notes',
    healthPlaceholder: 'e.g. pregnancy, neck or shoulder issues, skin conditions, medication',
    scalpBaseline: 'Scalp baseline',
    scalpBaselinePlaceholder: 'First recorded scalp and hair condition for later comparison',
    edit: 'Edit',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    saved: 'Saved',
    saveFailed: 'Unable to save. Try again.',
    healthEmpty: 'No allergies or health notes recorded yet',
    recordsTitle: 'Care records',
    recordsNote: 'Track visit dates, services, scalp assessments and before/after photos.',
    addRecord: 'Add care record',
    editRecord: 'Edit care record',
    recordDate: 'Visit date',
    services: 'Services',
    provider: 'Provider',
    scalpAssessment: 'Scalp assessment',
    scalpPlaceholder: 'e.g. oily crown, dry hairline, mild redness',
    treatmentNotes: 'Treatment and products',
    treatmentPlaceholder: 'e.g. botanical cleanse with soothing massage',
    followUp: 'Follow-up notes',
    followUpPlaceholder: 'e.g. check hairline dryness next visit',
    beforePhoto: 'Before photo',
    afterPhoto: 'After photo',
    choosePhoto: 'Choose photo',
    replacePhoto: 'Replace photo',
    removePhoto: 'Remove',
    deleting: 'Deleting…',
    deleteRecord: 'Delete',
    confirmDelete: 'Delete this care record? This cannot be undone.',
    noRecords: 'No care records yet',
    loading: 'Loading profile…',
    loadFailed: 'Unable to load the profile. Check the database migration and access.',
    imageTooLarge: 'Each photo must be under 3MB',
    uploadFailed: 'Photo upload failed. Try again.',
    recordSaved: 'Care record saved',
    recordSaveFailed: 'Unable to save. Try again.',
    invalidDate: 'Select a visit date',
    noProvider: 'No provider',
    optional: 'Optional',
    recordsCount: 'care records',
  },
}

const maxPhotoSize = 3 * 1024 * 1024

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}

function formatRecordDate(dateKey: string, locale: AdminLocale) {
  return formatDateKey(dateKey, locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function CustomerCareRecords({
  locale,
  customerId,
  session,
  services,
  staff,
  canDelete,
}: {
  locale: AdminLocale
  customerId: string
  session: Session
  services: Service[]
  staff: StaffProfile[]
  canDelete: boolean
}) {
  const t = labels[locale]
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profile, setProfile] = useState<CustomerCareProfile | null>(null)
  const [records, setRecords] = useState<CustomerCareRecord[]>([])
  const [healthOpen, setHealthOpen] = useState(false)
  const [health, setHealth] = useState({
    allergies: '',
    healthNotes: '',
    scalpBaseline: '',
  })
  const [healthBusy, setHealthBusy] = useState(false)
  const [healthMessage, setHealthMessage] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formId, setFormId] = useState<string | null>(null)
  const [recordDate, setRecordDate] = useState(() => easternDateKey())
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [providerId, setProviderId] = useState('')
  const [scalpAssessment, setScalpAssessment] = useState('')
  const [treatmentNotes, setTreatmentNotes] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState('')
  const [afterPreview, setAfterPreview] = useState('')
  const [beforePath, setBeforePath] = useState<string | null>(null)
  const [afterPath, setAfterPath] = useState<string | null>(null)
  const [beforeUrl, setBeforeUrl] = useState('')
  const [afterUrl, setAfterUrl] = useState('')
  const [removeBefore, setRemoveBefore] = useState(false)
  const [removeAfter, setRemoveAfter] = useState(false)
  const [formBusy, setFormBusy] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const providers = useMemo(() => staff.filter((item) => item.active), [staff])
  const staffById = useMemo(
    () => new Map(staff.map((item) => [item.id, item])),
    [staff],
  )
  const serviceById = useMemo(
    () => new Map(services.map((item) => [item.id, item])),
    [services],
  )

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }),
    [session.access_token],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch(
        `/api/customer-records?customerId=${customerId}`,
        { headers: authHeaders },
      )
      const result = (await response.json()) as {
        profile?: CustomerCareProfile | null
        records?: CustomerCareRecord[]
        error?: string
      }
      if (!response.ok) throw new Error(result.error ?? 'load_failed')

      setProfile(result.profile ?? null)
      setRecords(result.records ?? [])
      setHealth({
        allergies: result.profile?.allergies ?? '',
        healthNotes: result.profile?.health_notes ?? '',
        scalpBaseline: result.profile?.scalp_baseline ?? '',
      })
    } catch {
      setLoadError(t.loadFailed)
    } finally {
      setLoading(false)
    }
  }, [authHeaders, customerId, t.loadFailed])

  useEffect(() => {
    void load()
  }, [load])

  const resetForm = () => {
    setFormOpen(false)
    setFormId(null)
    setRecordDate(easternDateKey())
    setServiceIds([])
    setProviderId('')
    setScalpAssessment('')
    setTreatmentNotes('')
    setFollowUp('')
    setBeforeFile(null)
    setAfterFile(null)
    setBeforePreview('')
    setAfterPreview('')
    setBeforePath(null)
    setAfterPath(null)
    setBeforeUrl('')
    setAfterUrl('')
    setRemoveBefore(false)
    setRemoveAfter(false)
    setFormMessage('')
  }

  const startEdit = (record: CustomerCareRecord) => {
    setFormOpen(true)
    setFormId(record.id)
    setRecordDate(record.record_date)
    setServiceIds(record.service_ids ?? [])
    setProviderId(record.provider_id ?? '')
    setScalpAssessment(record.scalp_assessment)
    setTreatmentNotes(record.treatment_notes)
    setFollowUp(record.follow_up)
    setBeforeFile(null)
    setAfterFile(null)
    setBeforePreview('')
    setAfterPreview('')
    setBeforePath(record.before_photo_path)
    setAfterPath(record.after_photo_path)
    setBeforeUrl(record.beforePhotoUrl ?? '')
    setAfterUrl(record.afterPhotoUrl ?? '')
    setRemoveBefore(false)
    setRemoveAfter(false)
    setFormMessage('')
  }

  const pickPhoto = async (
    file: File | undefined,
    kind: 'before' | 'after',
  ) => {
    if (!file) return
    if (file.size > maxPhotoSize) {
      setFormMessage(t.imageTooLarge)
      return
    }

    const preview = await readFileAsDataUrl(file)
    if (kind === 'before') {
      setBeforeFile(file)
      setBeforePreview(preview)
      setRemoveBefore(false)
    } else {
      setAfterFile(file)
      setAfterPreview(preview)
      setRemoveAfter(false)
    }
    setFormMessage('')
  }

  const uploadPhoto = async (file: File, kind: 'before' | 'after') => {
    const image = await readFileAsDataUrl(file)
    const response = await fetch('/api/customer-record-photo', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ customerId, kind, image }),
    })
    const result = (await response.json()) as { path?: string; error?: string }
    if (!response.ok || !result.path) {
      throw new Error(result.error ?? 'upload_failed')
    }
    return result.path
  }

  const deletePhoto = async (path: string | null) => {
    if (!path) return
    try {
      await fetch('/api/customer-record-photo', {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify({ customerId, path }),
      })
    } catch {
      /* 旧照片清理失败不影响主流程 */
    }
  }

  const saveHealth = async () => {
    setHealthBusy(true)
    setHealthMessage('')
    try {
      const response = await fetch('/api/customer-records', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action: 'save-profile',
          customerId,
          ...health,
        }),
      })
      const result = (await response.json()) as {
        profile?: CustomerCareProfile
        error?: string
      }
      if (!response.ok || !result.profile) throw new Error('save_failed')

      setProfile(result.profile)
      setHealthOpen(false)
      setHealthMessage(t.saved)
    } catch {
      setHealthMessage(t.saveFailed)
    } finally {
      setHealthBusy(false)
    }
  }

  const saveRecord = async () => {
    if (!recordDate) {
      setFormMessage(t.invalidDate)
      return
    }

    setFormBusy(true)
    setFormMessage('')
    const uploadedPaths: string[] = []
    try {
      let nextBefore = removeBefore ? null : beforePath
      let nextAfter = removeAfter ? null : afterPath

      if (beforeFile) {
        nextBefore = await uploadPhoto(beforeFile, 'before')
        uploadedPaths.push(nextBefore)
      }
      if (afterFile) {
        nextAfter = await uploadPhoto(afterFile, 'after')
        uploadedPaths.push(nextAfter)
      }

      const serviceNames = serviceIds
        .map((id) => serviceById.get(id))
        .filter((service): service is Service => Boolean(service))
        .map((service) =>
          locale === 'zh' ? service.name_zh || service.name : service.name,
        )

      const response = await fetch('/api/customer-records', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action: 'save-record',
          customerId,
          recordId: formId,
          recordDate,
          serviceIds,
          serviceNames,
          providerId: providerId || null,
          scalpAssessment,
          treatmentNotes,
          followUp,
          beforePhotoPath: nextBefore,
          afterPhotoPath: nextAfter,
        }),
      })
      const result = (await response.json()) as {
        record?: CustomerCareRecord
        error?: string
      }
      if (!response.ok || !result.record) throw new Error('save_failed')

      const previousBefore = formId
        ? records.find((item) => item.id === formId)?.before_photo_path
        : null
      const previousAfter = formId
        ? records.find((item) => item.id === formId)?.after_photo_path
        : null
      if (previousBefore && previousBefore !== nextBefore) {
        void deletePhoto(previousBefore)
      }
      if (previousAfter && previousAfter !== nextAfter) {
        void deletePhoto(previousAfter)
      }

      resetForm()
      await load()
    } catch (error) {
      uploadedPaths.forEach((path) => void deletePhoto(path))
      setFormMessage(
        error instanceof Error && error.message === 'image_too_large'
          ? t.imageTooLarge
          : error instanceof Error && error.message === 'upload_failed'
            ? t.uploadFailed
            : t.recordSaveFailed,
      )
    } finally {
      setFormBusy(false)
    }
  }

  const deleteRecord = async (record: CustomerCareRecord) => {
    if (!window.confirm(t.confirmDelete)) return
    setDeletingId(record.id)
    try {
      const response = await fetch(`/api/customer-records?id=${record.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!response.ok) throw new Error('delete_failed')
      await load()
    } catch {
      setFormMessage(t.recordSaveFailed)
    } finally {
      setDeletingId('')
    }
  }

  const renderPhotoField = (
    kind: 'before' | 'after',
    label: string,
    preview: string,
    url: string,
    existingPath: string | null,
    removed: boolean,
    setRemoved: (value: boolean) => void,
  ) => {
    const src = preview || (removed ? '' : url)
    return (
      <div className={`care-records__photo${src ? ' has-image' : ''}`}>
        <span>{label}</span>
        {src ? (
          <a href={src} target="_blank" rel="noreferrer">
            <img src={src} alt={label} />
          </a>
        ) : (
          <div className="care-records__photo-empty">
            <Camera size={18} />
          </div>
        )}
        <div className="care-records__photo-actions">
          <label>
            {src ? t.replacePhoto : t.choosePhoto}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                void pickPhoto(event.target.files?.[0], kind)
                event.target.value = ''
              }}
            />
          </label>
          {src && (
            <button
              type="button"
              onClick={() => {
                setRemoved(true)
                if (kind === 'before') {
                  setBeforeFile(null)
                  setBeforePreview('')
                } else {
                  setAfterFile(null)
                  setAfterPreview('')
                }
              }}
            >
              {t.removePhoto}
            </button>
          )}
          {removed && existingPath && (
            <button type="button" onClick={() => setRemoved(false)}>
              {t.cancel}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="care-records">
      <header className="care-records__head">
        <div>
          <HeartPulse size={17} />
          <h3>{t.healthTitle}</h3>
        </div>
        {!healthOpen && (
          <button type="button" onClick={() => setHealthOpen(true)}>
            <Pencil size={14} />
            {t.edit}
          </button>
        )}
      </header>

      {loading ? (
        <p className="care-records__hint">
          <Loader2 size={15} className="care-records__spin" />
          {t.loading}
        </p>
      ) : loadError ? (
        <p className="care-records__hint is-error">{loadError}</p>
      ) : (
        <>
          {healthOpen ? (
            <form
              className="care-records__health"
              onSubmit={(event) => {
                event.preventDefault()
                void saveHealth()
              }}
            >
              <label>
                <span>{t.allergies}</span>
                <textarea
                  rows={2}
                  maxLength={2000}
                  placeholder={t.allergiesPlaceholder}
                  value={health.allergies}
                  onChange={(event) =>
                    setHealth((current) => ({
                      ...current,
                      allergies: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>{t.healthNotes}</span>
                <textarea
                  rows={3}
                  maxLength={4000}
                  placeholder={t.healthPlaceholder}
                  value={health.healthNotes}
                  onChange={(event) =>
                    setHealth((current) => ({
                      ...current,
                      healthNotes: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>{t.scalpBaseline}</span>
                <textarea
                  rows={2}
                  maxLength={4000}
                  placeholder={t.scalpBaselinePlaceholder}
                  value={health.scalpBaseline}
                  onChange={(event) =>
                    setHealth((current) => ({
                      ...current,
                      scalpBaseline: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="care-records__actions">
                <button
                  type="button"
                  onClick={() => {
                    setHealthOpen(false)
                    setHealth({
                      allergies: profile?.allergies ?? '',
                      healthNotes: profile?.health_notes ?? '',
                      scalpBaseline: profile?.scalp_baseline ?? '',
                    })
                  }}
                >
                  {t.cancel}
                </button>
                <button type="submit" disabled={healthBusy}>
                  <Save size={14} />
                  {healthBusy ? t.saving : t.save}
                </button>
              </div>
            </form>
          ) : (
            <div className="care-records__health-view">
              {profile?.allergies ? (
                <p className="care-records__alert">
                  <ShieldAlert size={16} />
                  <span>
                    <strong>{t.allergies}</strong>
                    {profile.allergies}
                  </span>
                </p>
              ) : null}
              <dl>
                <div>
                  <dt>{t.allergies}</dt>
                  <dd>{profile?.allergies || '—'}</dd>
                </div>
                <div>
                  <dt>{t.healthNotes}</dt>
                  <dd>{profile?.health_notes || '—'}</dd>
                </div>
                <div>
                  <dt>{t.scalpBaseline}</dt>
                  <dd>{profile?.scalp_baseline || '—'}</dd>
                </div>
              </dl>
              {!profile?.allergies &&
                !profile?.health_notes &&
                !profile?.scalp_baseline && (
                  <p className="care-records__hint">{t.healthEmpty}</p>
                )}
            </div>
          )}
          {healthMessage && (
            <p className="care-records__message" role="status">
              {healthMessage}
            </p>
          )}

          <header className="care-records__head care-records__head--records">
            <div>
              <CalendarDays size={17} />
              <h3>{t.recordsTitle}</h3>
              <small>
                {records.length} {t.recordsCount}
              </small>
            </div>
            {!formOpen && (
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setFormOpen(true)
                }}
              >
                <Plus size={14} />
                {t.addRecord}
              </button>
            )}
          </header>

          {formOpen && (
            <form
              className="care-records__form"
              onSubmit={(event) => {
                event.preventDefault()
                void saveRecord()
              }}
            >
              <div className="care-records__form-head">
                <h4>{formId ? t.editRecord : t.addRecord}</h4>
                <button type="button" onClick={resetForm} aria-label={t.cancel}>
                  <X size={16} />
                </button>
              </div>

              <div className="care-records__grid">
                <label>
                  <span>{t.recordDate}</span>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(event) => setRecordDate(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t.provider}</span>
                  <select
                    value={providerId}
                    onChange={(event) => setProviderId(event.target.value)}
                  >
                    <option value="">{t.noProvider}</option>
                    {providers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.display_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="care-records__services">
                <legend>{t.services}</legend>
                {services.map((service) => (
                  <label key={service.id}>
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(service.id)}
                      onChange={(event) =>
                        setServiceIds((current) =>
                          event.target.checked
                            ? [...current, service.id]
                            : current.filter((id) => id !== service.id),
                        )
                      }
                    />
                    <span>
                      {locale === 'zh'
                        ? service.name_zh || service.name
                        : service.name}
                    </span>
                  </label>
                ))}
              </fieldset>

              <label className="care-records__field">
                <span>{t.scalpAssessment}</span>
                <textarea
                  rows={3}
                  maxLength={6000}
                  placeholder={t.scalpPlaceholder}
                  value={scalpAssessment}
                  onChange={(event) => setScalpAssessment(event.target.value)}
                />
              </label>
              <label className="care-records__field">
                <span>{t.treatmentNotes}</span>
                <textarea
                  rows={3}
                  maxLength={6000}
                  placeholder={t.treatmentPlaceholder}
                  value={treatmentNotes}
                  onChange={(event) => setTreatmentNotes(event.target.value)}
                />
              </label>
              <label className="care-records__field">
                <span>
                  {t.followUp} · {t.optional}
                </span>
                <textarea
                  rows={2}
                  maxLength={2000}
                  placeholder={t.followUpPlaceholder}
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                />
              </label>

              <div className="care-records__photos">
                {renderPhotoField(
                  'before',
                  t.beforePhoto,
                  beforePreview,
                  beforeUrl,
                  beforePath,
                  removeBefore,
                  setRemoveBefore,
                )}
                {renderPhotoField(
                  'after',
                  t.afterPhoto,
                  afterPreview,
                  afterUrl,
                  afterPath,
                  removeAfter,
                  setRemoveAfter,
                )}
              </div>

              {formMessage && (
                <p className="care-records__message" role="status">
                  {formMessage}
                </p>
              )}

              <div className="care-records__actions">
                <button type="button" onClick={resetForm}>
                  {t.cancel}
                </button>
                <button type="submit" disabled={formBusy}>
                  <Save size={14} />
                  {formBusy ? t.saving : t.save}
                </button>
              </div>
            </form>
          )}

          {records.length === 0 ? (
            <p className="care-records__hint">{t.noRecords}</p>
          ) : (
            <div className="care-records__list">
              {records.map((record) => {
                const provider = record.provider_id
                  ? staffById.get(record.provider_id)
                  : null
                const serviceNames =
                  record.service_ids
                    ?.map((id) => serviceById.get(id))
                    .filter((service): service is Service => Boolean(service))
                    .map((service) =>
                      locale === 'zh'
                        ? service.name_zh || service.name
                        : service.name,
                    ) ?? []

                return (
                  <article key={record.id} className="care-records__item">
                    <div className="care-records__item-head">
                      <div>
                        <CalendarDays size={15} />
                        <time>{formatRecordDate(record.record_date, locale)}</time>
                        {provider && (
                          <span className="care-records__provider">
                            <UserRound size={13} />
                            {provider.display_name}
                          </span>
                        )}
                      </div>
                      <div className="care-records__item-actions">
                        <button type="button" onClick={() => startEdit(record)}>
                          <Pencil size={13} />
                          {t.edit}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className="is-danger"
                            disabled={deletingId === record.id}
                            onClick={() => void deleteRecord(record)}
                          >
                            <Trash2 size={13} />
                            {deletingId === record.id ? t.deleting : t.deleteRecord}
                          </button>
                        )}
                      </div>
                    </div>

                    {(serviceNames.length > 0 ||
                      (record.service_names?.length ?? 0) > 0) && (
                      <ul className="care-records__tags">
                        {(serviceNames.length > 0
                          ? serviceNames
                          : record.service_names
                        ).map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    )}

                    {record.scalp_assessment && (
                      <div className="care-records__block">
                        <strong>{t.scalpAssessment}</strong>
                        <p>{record.scalp_assessment}</p>
                      </div>
                    )}
                    {record.treatment_notes && (
                      <div className="care-records__block">
                        <strong>{t.treatmentNotes}</strong>
                        <p>{record.treatment_notes}</p>
                      </div>
                    )}
                    {record.follow_up && (
                      <div className="care-records__block">
                        <strong>{t.followUp}</strong>
                        <p>{record.follow_up}</p>
                      </div>
                    )}

                    {(record.beforePhotoUrl || record.afterPhotoUrl) && (
                      <div className="care-records__compare">
                        {record.beforePhotoUrl && (
                          <a
                            href={record.beforePhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img src={record.beforePhotoUrl} alt={t.beforePhoto} />
                            <span>{t.beforePhoto}</span>
                          </a>
                        )}
                        {record.afterPhotoUrl && (
                          <a
                            href={record.afterPhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img src={record.afterPhotoUrl} alt={t.afterPhoto} />
                            <span>{t.afterPhoto}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
