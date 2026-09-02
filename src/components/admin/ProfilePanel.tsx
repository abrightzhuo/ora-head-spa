import { useState, type FormEvent } from 'react'
import { KeyRound, Save, UserRound } from 'lucide-react'
import { supabase, type StaffProfile } from '../../lib/supabase'

type Props = {
  locale: 'zh' | 'en'
  profile: StaffProfile
  email: string
  roleLabel: string
  onProfileUpdated: (profile: StaffProfile) => void
}

export function ProfilePanel({
  locale,
  profile,
  email,
  roleLabel,
  onProfileUpdated,
}: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [color, setColor] = useState(profile.color)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const t =
    locale === 'zh'
      ? {
          title: '个人资料',
          note: '管理基本个人信息和登录密码。',
          name: '姓名',
          email: '登录邮箱',
          role: '账号角色',
          phone: '联系电话',
          color: '日历展示色',
          save: '保存个人资料',
          saved: '个人资料已更新。',
          profileFailed: '个人资料保存失败，请重试。',
          passwordTitle: '修改密码',
          passwordNote: '新密码至少需要 8 位。',
          newPassword: '新密码',
          confirmPassword: '确认新密码',
          updatePassword: '更新密码',
          passwordSaved: '密码已更新。',
          passwordMismatch: '两次输入的密码不一致。',
          passwordShort: '密码至少需要 8 位。',
          passwordFailed: '密码更新失败，请重试。',
        }
      : {
          title: 'My Profile',
          note: 'Manage your basic information and login password.',
          name: 'Name',
          email: 'Login email',
          role: 'Account role',
          phone: 'Phone',
          color: 'Calendar color',
          save: 'Save profile',
          saved: 'Profile updated.',
          profileFailed: 'Unable to save profile. Please try again.',
          passwordTitle: 'Change Password',
          passwordNote: 'Your new password must contain at least 8 characters.',
          newPassword: 'New password',
          confirmPassword: 'Confirm new password',
          updatePassword: 'Update password',
          passwordSaved: 'Password updated.',
          passwordMismatch: 'The passwords do not match.',
          passwordShort: 'Password must contain at least 8 characters.',
          passwordFailed: 'Unable to update password. Please try again.',
        }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase || !displayName.trim()) return
    setSavingProfile(true)
    setProfileMessage('')
    const { data: sessionData } = await supabase.auth.getSession()
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: displayName.trim(),
        phone,
        color,
      }),
    })
    const data = (await response.json()) as {
      profile?: StaffProfile
    }

    if (!response.ok || !data.profile) {
      setProfileMessage(t.profileFailed)
    } else {
      onProfileUpdated(data.profile)
      setProfileMessage(t.saved)
    }
    setSavingProfile(false)
  }

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordMessage('')
    if (newPassword.length < 8) {
      setPasswordMessage(t.passwordShort)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage(t.passwordMismatch)
      return
    }
    if (!supabase) return

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) {
      setPasswordMessage(t.passwordFailed)
    } else {
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage(t.passwordSaved)
    }
    setSavingPassword(false)
  }

  return (
    <section className="admin-panel profile-panel">
      <header>
        <UserRound size={21} />
        <div>
          <h2>{t.title}</h2>
          <p>{t.note}</p>
        </div>
      </header>

      <div className="profile-layout">
        <form onSubmit={saveProfile}>
          <h3>{t.title}</h3>
          <div className="profile-grid">
            <label>
              <span>{t.name}</span>
              <input
                value={displayName}
                maxLength={80}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </label>
            <label>
              <span>{t.email}</span>
              <input value={email} readOnly />
            </label>
            <label>
              <span>{t.role}</span>
              <input value={roleLabel} readOnly />
            </label>
            <label>
              <span>{t.phone}</span>
              <input
                type="tel"
                value={phone}
                maxLength={40}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label>
              <span>{t.color}</span>
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
          </div>
          {profileMessage && <p className="profile-message">{profileMessage}</p>}
          <button type="submit" disabled={savingProfile}>
            <Save size={16} />
            {t.save}
          </button>
        </form>

        <form onSubmit={updatePassword}>
          <h3>
            <KeyRound size={18} />
            {t.passwordTitle}
          </h3>
          <p>{t.passwordNote}</p>
          <label>
            <span>{t.newPassword}</span>
            <input
              type="password"
              value={newPassword}
              minLength={8}
              autoComplete="new-password"
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <label>
            <span>{t.confirmPassword}</span>
            <input
              type="password"
              value={confirmPassword}
              minLength={8}
              autoComplete="new-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          {passwordMessage && (
            <p className="profile-message">{passwordMessage}</p>
          )}
          <button type="submit" disabled={savingPassword}>
            <KeyRound size={16} />
            {t.updatePassword}
          </button>
        </form>
      </div>
    </section>
  )
}
