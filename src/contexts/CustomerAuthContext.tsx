import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { LockKeyhole, Mail, Phone, UserRound, X } from 'lucide-react'
import { customerCopy } from '../customerCopy'
import { supabase, type Membership } from '../lib/supabase'
import { useSiteStore } from '../store/useSiteStore'
import {
  CustomerAuthContext,
  type AuthDefaults,
  type AuthMode,
  type CustomerAuthValue,
} from './customerAuth'

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [defaults, setDefaults] = useState<AuthDefaults>({})

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const refreshMembership = useCallback(async () => {
    if (!supabase || !session) {
      setMembership(null)
      setMembershipLoading(false)
      return
    }

    setMembershipLoading(true)
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setMembership(error ? null : (data as Membership | null))
    setMembershipLoading(false)
  }, [session])

  useEffect(() => {
    void refreshMembership()
  }, [refreshMembership])

  const value = useMemo<CustomerAuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      membership,
      membershipLoading,
      loading,
      refreshMembership,
      openAuth: (nextMode = 'sign-in', nextDefaults = {}) => {
        setMode(nextMode)
        setDefaults(nextDefaults)
        setAuthOpen(true)
      },
      closeAuth: () => setAuthOpen(false),
      signOut: async () => {
        await supabase?.auth.signOut()
      },
    }),
    [loading, membership, membershipLoading, refreshMembership, session],
  )

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
      {authOpen && (
        <CustomerAuthModal
          defaults={defaults}
          mode={mode}
          onClose={() => setAuthOpen(false)}
          onModeChange={setMode}
        />
      )}
    </CustomerAuthContext.Provider>
  )
}

function CustomerAuthModal({
  defaults,
  mode,
  onClose,
  onModeChange,
}: {
  defaults: AuthDefaults
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
}) {
  const locale = useSiteStore((state) => state.locale)
  const t = customerCopy[locale]
  const [name, setName] = useState(defaults.name ?? '')
  const [phone, setPhone] = useState(defaults.phone ?? '')
  const [email, setEmail] = useState(defaults.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [messageIsSuccess, setMessageIsSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const [canResendConfirmation, setCanResendConfirmation] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('auth-modal-open')
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('auth-modal-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const changeMode = (nextMode: AuthMode) => {
    setMessage('')
    setMessageIsSuccess(false)
    setCanResendConfirmation(false)
    setPassword('')
    setConfirmation('')
    onModeChange(nextMode)
  }

  const resendConfirmation = async () => {
    if (!supabase || !email.trim()) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/account?lang=${locale}`,
      },
    })
    setBusy(false)
    setMessage(error ? t.authFailed : t.confirmationResent)
    setMessageIsSuccess(!error)
    setCanResendConfirmation(Boolean(error))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) {
      setMessage(t.authFailed)
      setMessageIsSuccess(false)
      return
    }
    if (password.length < 8) {
      setMessage(t.passwordLength)
      setMessageIsSuccess(false)
      return
    }
    if (mode === 'sign-up' && password !== confirmation) {
      setMessage(t.passwordMismatch)
      setMessageIsSuccess(false)
      return
    }

    setBusy(true)
    setMessage('')
    setMessageIsSuccess(false)
    setCanResendConfirmation(false)
    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      setBusy(false)
      if (error) {
        if (
          error.code === 'email_not_confirmed' ||
          error.message.toLowerCase().includes('email not confirmed')
        ) {
          setMessage(t.emailNotConfirmed)
          setMessageIsSuccess(false)
          setCanResendConfirmation(true)
          return
        }
        setMessage(t.authFailed)
        setMessageIsSuccess(false)
        return
      }
      onClose()
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account?lang=${locale}`,
        data: {
          account_type: 'customer',
          full_name: name.trim(),
          phone: phone.trim(),
            contact_email: email.trim().toLowerCase(),
        },
      },
    })
    setBusy(false)
    if (error) {
      setMessage(t.authFailed)
      setMessageIsSuccess(false)
      return
    }
    if (data.session) {
      onClose()
    } else {
      changeMode('sign-in')
      setMessage(t.confirmEmail)
      setMessageIsSuccess(true)
      setCanResendConfirmation(true)
    }
  }

  return (
    <div className="customer-auth-backdrop" role="presentation">
      <section
        className="customer-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-auth-title"
      >
        <button
          className="customer-auth-close"
          type="button"
          onClick={onClose}
          aria-label={t.close}
          title={t.close}
        >
          <X size={19} />
        </button>
        <div className="customer-auth-tabs" role="tablist">
          <button
            className={mode === 'sign-in' ? 'is-active' : ''}
            type="button"
            onClick={() => changeMode('sign-in')}
          >
            {t.signIn}
          </button>
          <button
            className={mode === 'sign-up' ? 'is-active' : ''}
            type="button"
            onClick={() => changeMode('sign-up')}
          >
            {t.signUp}
          </button>
        </div>
        <h2 id="customer-auth-title">
          {mode === 'sign-in' ? t.signInTitle : t.signUpTitle}
        </h2>
        <p>
          {mode === 'sign-in' ? t.signInIntro : t.signUpIntro}
        </p>
        <form onSubmit={submit}>
          {mode === 'sign-up' && (
            <div className="customer-auth-row">
              <label>
                <span>{t.name}</span>
                <div><UserRound size={16} /><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></div>
              </label>
              <label>
                <span>{t.phone}</span>
                <div><Phone size={16} /><input required autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
              </label>
            </div>
          )}
          <label>
            <span>{t.email}</span>
            <div><Mail size={16} /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          </label>
          <label>
            <span>{t.password}</span>
            <div><LockKeyhole size={16} /><input required minLength={8} type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          </label>
          {mode === 'sign-up' && (
            <label>
              <span>{t.confirmPassword}</span>
              <div><LockKeyhole size={16} /><input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
            </label>
          )}
          {message && (
            <p
              className={`customer-auth-message ${messageIsSuccess ? 'is-success' : ''}`}
              role="status"
            >
              {message}
            </p>
          )}
          {canResendConfirmation && (
            <button
              className="customer-auth-resend"
              type="button"
              disabled={busy}
              onClick={() => void resendConfirmation()}
            >
              {t.resendConfirmation}
            </button>
          )}
          <button className="customer-auth-submit" type="submit" disabled={busy}>
            {mode === 'sign-in' ? t.signIn : t.createAccount}
          </button>
        </form>
        <div
          className={`customer-auth-switch ${mode === 'sign-in' ? 'is-register-prompt' : ''}`}
        >
          <span>{mode === 'sign-in' ? t.noAccount : t.hasAccount}</span>
          <button type="button" onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
            {mode === 'sign-in' ? t.registerLink : t.signIn}
          </button>
        </div>
      </section>
    </div>
  )
}
