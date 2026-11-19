import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { MessageCircleQuestion, Send } from 'lucide-react'
import { GeoPrefix } from '../components/GeoPrefix'
import { Header } from '../components/Header'
import { useCustomerAuth } from '../contexts/customerAuth'
import { forumCopy } from '../forumCopy'
import { siteHomePath } from '../lib/comingSoon'
import { localeHomePath } from '../lib/localeRouting'
import { useSiteStore } from '../store/useSiteStore'

type ForumAnswer = {
  id: string
  body: string
  authorName: string
  createdAt: string
}

type ForumTopic = {
  id: string
  title: string
  body: string
  locale: string
  authorName: string
  createdAt: string
  answers: ForumAnswer[]
}

const formatDay = (iso: string, locale: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Forum() {
  const locale = useSiteStore((state) => state.locale)
  const t = forumCopy[locale]
  const { session, user, loading: authLoading, openAuth } = useCustomerAuth()

  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  const loadTopics = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/forum', { signal })
      const result = (await response.json()) as { topics?: ForumTopic[] }
      setTopics(Array.isArray(result.topics) ? result.topics : [])
    } catch {
      // 预渲染或离线时保持空列表，不打断页面
      setTopics([])
    } finally {
      setLoadingTopics(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoadingTopics(true)
    void loadTopics(controller.signal)
    return () => controller.abort()
  }, [loadTopics])

  const displayName =
    String(user?.user_metadata?.full_name ?? '').trim() ||
    String(user?.email ?? '').split('@')[0] ||
    ''

  const submitQuestion = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) return

    const trimmedTitle = title.trim()
    const trimmedQuestion = question.trim()
    if (trimmedTitle.length < 3 || trimmedQuestion.length < 10) {
      setFormError(t.errors.invalid_input)
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ask',
          title: trimmedTitle,
          body: trimmedQuestion,
          locale,
        }),
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        const key = String(result.error ?? '') as keyof typeof t.errors
        setFormError(t.errors[key] ?? t.errors.generic)
        return
      }

      setTitle('')
      setQuestion('')
      setSubmitted(true)
    } catch {
      setFormError(t.errors.generic)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="forum-page">
      <Header
        actionHref={`${localeHomePath(locale, siteHomePath())}#booking`}
        returnToHome
      />

      {/* 与会员 / 礼品卡页共用同一张头图与标题位置 */}
      <section className="membership-hero">
        <img src="/images/interior-01.jpg" alt="" />
        <div>
          <p>{t.eyebrow}</p>
          <h1>
            <GeoPrefix />
            {t.title}
          </h1>
          <span>{t.lede}</span>
        </div>
      </section>

      <section className="forum-ask" id="ask">
        <div className="forum-ask__inner">
          <div className="forum-ask__intro">
            <MessageCircleQuestion size={22} strokeWidth={1.5} />
            <h2>{t.askTitle}</h2>
            <p>{t.askNote}</p>
            <p className="forum-ask__hint">{t.pendingNote}</p>
          </div>

          {authLoading ? (
            <p className="forum-ask__state">{t.loading}</p>
          ) : session ? (
            <form className="forum-form" onSubmit={submitQuestion}>
              <p className="forum-form__identity">
                {t.signedInAs(displayName || t.titleLabel)}
              </p>
              <label>
                <span>{t.titleLabel}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setSubmitted(false)
                  }}
                  placeholder={t.titlePlaceholder}
                  maxLength={120}
                  required
                />
              </label>
              <label>
                <span>{t.bodyLabel}</span>
                <textarea
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value)
                    setSubmitted(false)
                  }}
                  placeholder={t.bodyPlaceholder}
                  maxLength={2000}
                  rows={5}
                  required
                />
              </label>
              {formError && (
                <p className="forum-form__error" role="alert">
                  {formError}
                </p>
              )}
              {submitted && (
                <p className="forum-form__success" role="status">
                  {t.successNote}
                </p>
              )}
              <button type="submit" disabled={submitting}>
                <Send size={15} />
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          ) : (
            <div className="forum-ask__signin">
              <p>{t.askNote}</p>
              <button type="button" onClick={() => openAuth('sign-in')}>
                {t.signInToAsk}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="forum-list">
        <div className="forum-list__inner">
          <header className="forum-list__header">
            <h2>{t.listTitle}</h2>
            <p>{t.listNote}</p>
          </header>

          {loadingTopics ? (
            <p className="forum-list__state">{t.loading}</p>
          ) : topics.length === 0 ? (
            <div className="forum-list__empty">
              <h3>{t.emptyTitle}</h3>
              <p>{t.emptyNote}</p>
            </div>
          ) : (
            <ul className="forum-threads">
              {topics.map((topic) => (
                <li className="forum-thread" key={topic.id}>
                  <div className="forum-thread__meta">
                    <span>{t.askedBy(topic.authorName)}</span>
                    <time dateTime={topic.createdAt}>
                      {formatDay(topic.createdAt, locale)}
                    </time>
                  </div>
                  <h3>{topic.title}</h3>
                  <p className="forum-thread__body">{topic.body}</p>

                  {topic.answers.length > 0 ? (
                    <div className="forum-thread__answers">
                      <p className="forum-thread__answers-label">
                        {t.answerLabel}
                      </p>
                      {topic.answers.map((answer) => (
                        <div className="forum-answer" key={answer.id}>
                          <div className="forum-answer__meta">
                            <span>{answer.authorName}</span>
                            <time dateTime={answer.createdAt}>
                              {formatDay(answer.createdAt, locale)}
                            </time>
                          </div>
                          <p>{answer.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="forum-thread__pending">{t.noAnswerYet}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
