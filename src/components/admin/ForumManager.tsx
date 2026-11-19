import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, EyeOff, Send, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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
  authorEmail: string
  status: 'pending' | 'published' | 'hidden'
  createdAt: string
  answeredAt: string | null
  answers: ForumAnswer[]
}

type Props = {
  locale: 'zh' | 'en'
}

type Filter = 'pending' | 'published' | 'hidden' | 'all'

const labels = {
  zh: {
    title: '顾客问答',
    note: '在这里回答顾客提问，回答并发布后会展示在论坛页面。',
    pending: '待回答',
    published: '已发布',
    hidden: '已隐藏',
    all: '全部',
    refresh: '刷新',
    refreshing: '刷新中',
    loading: '正在加载问答…',
    empty: '当前筛选下没有内容。',
    askedBy: '提问者',
    answerLabel: '回答',
    answerPlaceholder: '写下你的回答，发布后顾客和其他访客都能看到。',
    saveAnswer: '保存回答',
    saving: '保存中…',
    publish: '发布到论坛',
    hide: '从论坛隐藏',
    remove: '删除',
    confirmDelete: '确定删除这条提问吗？删除后无法恢复。',
    statusPending: '待回答',
    statusPublished: '已发布',
    statusHidden: '已隐藏',
    noAnswer: '还没有回答',
    saved: '回答已保存。',
    publishedMessage: '已发布到论坛。',
    hiddenMessage: '已从论坛隐藏。',
    deleted: '已删除。',
    loadFailed: '加载失败，请重试。',
    actionFailed: '操作失败，请重试。',
    answerRequired: '请先写下回答内容。',
  },
  en: {
    title: 'Customer Q&A',
    note: 'Answer customer questions here. Published answers appear on the public forum page.',
    pending: 'Waiting',
    published: 'Published',
    hidden: 'Hidden',
    all: 'All',
    refresh: 'Refresh',
    refreshing: 'Refreshing',
    loading: 'Loading questions…',
    empty: 'Nothing in this filter.',
    askedBy: 'Asked by',
    answerLabel: 'Reply',
    answerPlaceholder: 'Write your reply. Once published, guests can read it on the forum.',
    saveAnswer: 'Save reply',
    saving: 'Saving…',
    publish: 'Publish to forum',
    hide: 'Hide from forum',
    remove: 'Delete',
    confirmDelete: 'Delete this question? This cannot be undone.',
    statusPending: 'Waiting',
    statusPublished: 'Published',
    statusHidden: 'Hidden',
    noAnswer: 'No reply yet',
    saved: 'Reply saved.',
    publishedMessage: 'Published to the forum.',
    hiddenMessage: 'Hidden from the forum.',
    deleted: 'Deleted.',
    loadFailed: 'Unable to load. Please try again.',
    actionFailed: 'Action failed. Please try again.',
    answerRequired: 'Please write a reply first.',
  },
}

const formatDateTime = (iso: string, locale: 'zh' | 'en') => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ForumManager({ locale }: Props) {
  const t = labels[locale]
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = useCallback(async () => {
    const { data } = await supabase!.auth.getSession()
    return data.session?.access_token ?? ''
  }, [])

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/forum?scope=admin', {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const result = (await response.json()) as {
        topics?: ForumTopic[]
        error?: string
      }
      if (!response.ok) {
        setError(t.loadFailed)
        return
      }
      setTopics(Array.isArray(result.topics) ? result.topics : [])
    } catch {
      setError(t.loadFailed)
    } finally {
      setLoading(false)
    }
  }, [t.loadFailed, token])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () =>
      filter === 'all'
        ? topics
        : topics.filter((topic) => topic.status === filter),
    [filter, topics],
  )

  const counts = useMemo(
    () => ({
      pending: topics.filter((topic) => topic.status === 'pending').length,
      published: topics.filter((topic) => topic.status === 'published').length,
      hidden: topics.filter((topic) => topic.status === 'hidden').length,
    }),
    [topics],
  )

  const post = async (body: Record<string, unknown>, id: string) => {
    setBusyId(id)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        setError(t.actionFailed)
        return false
      }
      return true
    } catch {
      setError(t.actionFailed)
      return false
    } finally {
      setBusyId('')
    }
  }

  const saveAnswer = async (topic: ForumTopic) => {
    const body = (drafts[topic.id] ?? '').trim()
    if (!body) {
      setError(t.answerRequired)
      return
    }

    const ok = await post({ action: 'answer', topicId: topic.id, body }, topic.id)
    if (!ok) return

    setDrafts((current) => ({ ...current, [topic.id]: '' }))
    setMessage(t.saved)
    await load()
  }

  const setStatus = async (topic: ForumTopic, action: 'publish' | 'hide') => {
    const ok = await post({ action, topicId: topic.id }, topic.id)
    if (!ok) return
    setMessage(action === 'publish' ? t.publishedMessage : t.hiddenMessage)
    await load()
  }

  const remove = async (topic: ForumTopic) => {
    if (!window.confirm(t.confirmDelete)) return

    setBusyId(topic.id)
    setMessage('')
    setError('')
    try {
      const response = await fetch(`/api/forum?id=${topic.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await token()}` },
      })
      if (!response.ok) {
        setError(t.actionFailed)
        return
      }
      setMessage(t.deleted)
      await load()
    } catch {
      setError(t.actionFailed)
    } finally {
      setBusyId('')
    }
  }

  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: 'pending', label: t.pending, count: counts.pending },
    { key: 'published', label: t.published, count: counts.published },
    { key: 'hidden', label: t.hidden, count: counts.hidden },
    { key: 'all', label: t.all },
  ]

  return (
    <section className="admin-panel forum-manager">
      <div className="forum-manager__heading">
        <div>
          <h2>{t.title}</h2>
          <p>{t.note}</p>
        </div>
        <button
          className="forum-manager__refresh"
          type="button"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? t.refreshing : t.refresh}
        </button>
      </div>

      <div className="forum-manager__filters">
        {filters.map((item) => (
          <button
            className={filter === item.key ? 'is-active' : ''}
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            aria-pressed={filter === item.key}
          >
            {item.label}
            {typeof item.count === 'number' ? ` (${item.count})` : ''}
          </button>
        ))}
      </div>

      {message && (
        <p className="admin-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {loading && topics.length === 0 ? (
        <p className="forum-manager__state">{t.loading}</p>
      ) : visible.length === 0 ? (
        <p className="forum-manager__state">{t.empty}</p>
      ) : (
        <ul className="forum-manager__list">
          {visible.map((topic) => (
            <li className="forum-manager__item" key={topic.id}>
              <div className="forum-manager__item-head">
                <div>
                  <span
                    className={`forum-manager__badge is-${topic.status}`}
                  >
                    {topic.status === 'published'
                      ? t.statusPublished
                      : topic.status === 'hidden'
                        ? t.statusHidden
                        : t.statusPending}
                  </span>
                  <span className="forum-manager__locale">{topic.locale}</span>
                </div>
                <time dateTime={topic.createdAt}>
                  {formatDateTime(topic.createdAt, locale)}
                </time>
              </div>

              <h3>{topic.title}</h3>
              <p className="forum-manager__body">{topic.body}</p>
              <p className="forum-manager__author">
                {t.askedBy}: {topic.authorName}
                {topic.authorEmail ? ` · ${topic.authorEmail}` : ''}
              </p>

              <div className="forum-manager__answers">
                <p className="forum-manager__answers-label">{t.answerLabel}</p>
                {topic.answers.length === 0 ? (
                  <p className="forum-manager__no-answer">{t.noAnswer}</p>
                ) : (
                  topic.answers.map((answer) => (
                    <div className="forum-manager__answer" key={answer.id}>
                      <div>
                        <strong>{answer.authorName}</strong>
                        <time dateTime={answer.createdAt}>
                          {formatDateTime(answer.createdAt, locale)}
                        </time>
                      </div>
                      <p>{answer.body}</p>
                    </div>
                  ))
                )}
              </div>

              <textarea
                value={drafts[topic.id] ?? ''}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [topic.id]: event.target.value,
                  }))
                }
                placeholder={t.answerPlaceholder}
                rows={3}
                maxLength={2000}
              />

              <div className="forum-manager__actions">
                <button
                  type="button"
                  onClick={() => void saveAnswer(topic)}
                  disabled={busyId === topic.id}
                >
                  <Send size={15} />
                  {busyId === topic.id ? t.saving : t.saveAnswer}
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(topic, 'publish')}
                  disabled={busyId === topic.id || topic.status === 'published'}
                >
                  <Check size={15} />
                  {t.publish}
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(topic, 'hide')}
                  disabled={busyId === topic.id || topic.status === 'hidden'}
                >
                  <EyeOff size={15} />
                  {t.hide}
                </button>
                <button
                  className="is-danger"
                  type="button"
                  onClick={() => void remove(topic)}
                  disabled={busyId === topic.id}
                >
                  <Trash2 size={15} />
                  {t.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
