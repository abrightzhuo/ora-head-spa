import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ExternalLink, ImageUp, Save, UserRoundCog } from 'lucide-react'
import { supabase, type StaffProfile } from '../../lib/supabase'

type Props = {
  locale: 'zh' | 'en'
  staff: StaffProfile[]
  onProfileUpdated: (profile: StaffProfile) => void
}

function list(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function ProviderProfilesManager({
  locale,
  staff,
  onProfileUpdated,
}: Props) {
  const providers = useMemo(
    () => staff.filter((profile) => profile.active && profile.role === 'staff'),
    [staff],
  )
  const [providerId, setProviderId] = useState('')
  const provider = providers.find((item) => item.id === providerId)
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [languages, setLanguages] = useState('')
  const [experience, setExperience] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const t =
    locale === 'zh'
      ? {
          title: '技师公开资料',
          note: '由店主或经理统一维护顾客可见的照片和专业资料。',
          select: '选择技师',
          photo: '技师照片',
          upload: '上传照片',
          photoHint: 'JPG、PNG 或 WebP，最大 3MB。',
          headline: '专业头衔',
          headlineHint: '例如：头皮护理与深度放松技师',
          bio: '技师介绍',
          bioHint: '介绍专业经验、服务风格和擅长方向。',
          specialties: '擅长技术',
          specialtiesHint: '用逗号分隔，例如：头皮分析，深层清洁，肩颈放松',
          languages: '服务语言',
          languagesHint: '用逗号分隔，例如：中文，English',
          experience: '从业年限',
          save: '保存技师资料',
          view: '查看公开页面',
          saved: '技师资料已更新。',
          photoSaved: '技师照片已更新。',
          failed: '保存失败，请重试。',
          noProviders: '尚未创建技师账号。',
        }
      : {
          title: 'Provider Public Profiles',
          note: 'Owners and managers maintain customer-facing photos and professional details.',
          select: 'Select provider',
          photo: 'Provider photo',
          upload: 'Upload photo',
          photoHint: 'JPG, PNG or WebP, up to 3MB.',
          headline: 'Professional title',
          headlineHint: 'For example: Scalp Care & Deep Relaxation Provider',
          bio: 'Provider bio',
          bioHint: 'Describe experience, service style and areas of expertise.',
          specialties: 'Specialties',
          specialtiesHint: 'Comma separated, e.g. scalp analysis, deep cleansing',
          languages: 'Languages',
          languagesHint: 'Comma separated, e.g. English, Mandarin',
          experience: 'Years of experience',
          save: 'Save provider profile',
          view: 'View public page',
          saved: 'Provider profile updated.',
          photoSaved: 'Provider photo updated.',
          failed: 'Unable to save. Please try again.',
          noProviders: 'No provider accounts yet.',
        }

  useEffect(() => {
    if (!providerId && providers[0]) setProviderId(providers[0].id)
  }, [providerId, providers])

  useEffect(() => {
    if (!provider) return
    setHeadline(provider.profile_headline ?? '')
    setBio(provider.bio ?? '')
    setSpecialties((provider.specialties ?? []).join(', '))
    setLanguages((provider.languages ?? []).join(', '))
    setExperience(provider.experience_years?.toString() ?? '')
    setMessage('')
  }, [provider])

  const token = async () => {
    const { data } = await supabase!.auth.getSession()
    return data.session?.access_token ?? ''
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase || !provider) return
    setSaving(true)
    setMessage('')
    const response = await fetch('/api/provider-profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerId: provider.id,
        profileHeadline: headline,
        bio,
        specialties: list(specialties),
        languages: list(languages),
        experienceYears: experience ? Number(experience) : null,
      }),
    })
    const result = (await response.json()) as { profile?: StaffProfile }
    if (!response.ok || !result.profile) {
      setMessage(t.failed)
    } else {
      onProfileUpdated(result.profile)
      setMessage(t.saved)
    }
    setSaving(false)
  }

  const upload = async (file: File) => {
    if (!supabase || !provider) return
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      setMessage(t.failed)
      return
    }
    setUploading(true)
    setMessage('')
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    }).catch(() => '')
    const response = await fetch('/api/profile-photo', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ providerId: provider.id, image }),
    })
    const result = (await response.json()) as { profile?: StaffProfile }
    if (!response.ok || !result.profile) {
      setMessage(t.failed)
    } else {
      onProfileUpdated(result.profile)
      setMessage(t.photoSaved)
    }
    setUploading(false)
  }

  return (
    <section className="provider-profile-manager">
      <header>
        <UserRoundCog size={20} />
        <div>
          <h2>{t.title}</h2>
          <p>{t.note}</p>
        </div>
      </header>
      {providers.length === 0 ? (
        <p>{t.noProviders}</p>
      ) : (
        <>
          <label className="provider-manager-select">
            <span>{t.select}</span>
            <select
              value={providerId}
              onChange={(event) => setProviderId(event.target.value)}
            >
              {providers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.display_name}
                </option>
              ))}
            </select>
          </label>
          {provider && (
            <form onSubmit={save}>
              <div className="provider-manager-photo">
                {provider.photo_url ? (
                  <img src={provider.photo_url} alt={provider.display_name} />
                ) : (
                  <span style={{ backgroundColor: provider.color }}>
                    {provider.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <strong>{t.photo}</strong>
                  <small>{t.photoHint}</small>
                  <label>
                    <ImageUp size={15} />
                    {uploading ? '...' : t.upload}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void upload(file)
                        event.target.value = ''
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="provider-manager-grid">
                <label>
                  <span>{t.headline}</span>
                  <input
                    value={headline}
                    maxLength={120}
                    placeholder={t.headlineHint}
                    onChange={(event) => setHeadline(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t.experience}</span>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                  />
                </label>
                <label className="is-wide">
                  <span>{t.bio}</span>
                  <textarea
                    rows={5}
                    value={bio}
                    maxLength={600}
                    placeholder={t.bioHint}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </label>
                <label className="is-wide">
                  <span>{t.specialties}</span>
                  <input
                    value={specialties}
                    placeholder={t.specialtiesHint}
                    onChange={(event) => setSpecialties(event.target.value)}
                  />
                </label>
                <label className="is-wide">
                  <span>{t.languages}</span>
                  <input
                    value={languages}
                    placeholder={t.languagesHint}
                    onChange={(event) => setLanguages(event.target.value)}
                  />
                </label>
              </div>
              {message && <p className="provider-manager-message">{message}</p>}
              <div className="provider-manager-actions">
                <a
                  href={`/providers/${provider.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} />
                  {t.view}
                </a>
                <button type="submit" disabled={saving}>
                  <Save size={15} />
                  {t.save}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  )
}
