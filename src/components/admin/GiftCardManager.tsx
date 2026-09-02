import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Ban,
  Check,
  Copy,
  Gift,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { formatEasternDateTime } from '../../lib/dateTime'

type GiftCardTransaction = {
  id: string
  transaction_type:
    | 'issued'
    | 'redeemed'
    | 'adjustment'
    | 'redemption_reversed'
  amount_cents: number
  balance_after_cents: number
  checkout_id: string | null
  note: string | null
  created_at: string
}

type GiftCard = {
  id: string
  last_four: string
  initial_balance_cents: number
  balance_cents: number
  currency: string
  recipient_name: string | null
  recipient_email: string | null
  purchaser_name: string | null
  note: string | null
  active: boolean
  expires_at: string | null
  created_at: string
  gift_card_transactions: GiftCardTransaction[]
}

type Props = {
  session: Session
  locale: 'zh' | 'en'
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function GiftCardManager({ session, locale }: Props) {
  const [cards, setCards] = useState<GiftCard[]>([])
  const [amount, setAmount] = useState('100')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [purchaserName, setPurchaserName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const [issuedCode, setIssuedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const t =
    locale === 'zh'
      ? {
          title: 'Gift Cards / 礼品卡',
          note: '发行、管理余额并查看礼品卡使用记录。',
          amount: '初始金额',
          recipient: '收卡人姓名',
          recipientEmail: '收卡人邮箱',
          purchaser: '购买人姓名',
          expires: '到期日期（可选）',
          internalNote: '备注',
          issue: '发行礼品卡',
          issued: '礼品卡已创建。完整卡号只显示这一次。',
          copy: '复制卡号',
          copied: '已复制',
          currentCards: '已发行礼品卡',
          empty: '尚未发行礼品卡。',
          card: '卡号',
          balance: '余额',
          initial: '初始金额',
          status: '状态',
          active: '使用中',
          inactive: '已停用',
          expired: '已过期',
          disable: '停用',
          enable: '启用',
          history: '交易记录',
          noHistory: '暂无交易记录',
          adjust: '调整余额',
          adjustment: '调整金额',
          adjustmentHelp: '增加请输入正数，扣减请输入负数。',
          saveAdjustment: '保存调整',
          failed: '操作失败，请确认数据库迁移已执行。',
        }
      : {
          title: 'Gift Cards',
          note: 'Issue cards, manage balances, and review activity.',
          amount: 'Initial amount',
          recipient: 'Recipient name',
          recipientEmail: 'Recipient email',
          purchaser: 'Purchaser name',
          expires: 'Expiration date (optional)',
          internalNote: 'Note',
          issue: 'Issue gift card',
          issued: 'Gift card created. The full code is shown only once.',
          copy: 'Copy code',
          copied: 'Copied',
          currentCards: 'Issued gift cards',
          empty: 'No gift cards have been issued.',
          card: 'Card',
          balance: 'Balance',
          initial: 'Initial',
          status: 'Status',
          active: 'Active',
          inactive: 'Inactive',
          expired: 'Expired',
          disable: 'Disable',
          enable: 'Enable',
          history: 'Activity',
          noHistory: 'No activity yet',
          adjust: 'Adjust balance',
          adjustment: 'Adjustment amount',
          adjustmentHelp: 'Use a positive amount to add and a negative amount to deduct.',
          saveAdjustment: 'Save adjustment',
          failed: 'Unable to complete the action. Confirm the database migration is installed.',
        }

  const request = async (
    method: 'GET' | 'POST' | 'PATCH',
    body?: Record<string, unknown>,
  ) => {
    const response = await fetch('/api/gift-cards', {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error ?? 'gift_card_failed')
    return result
  }

  const load = async () => {
    setLoading(true)
    setMessage('')
    try {
      const result = await request('GET')
      setCards(result.cards ?? [])
    } catch {
      setMessage(t.failed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // The access token is stable for the mounted admin session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const issue = async (event: FormEvent) => {
    event.preventDefault()
    const amountCents = Math.round(Number(amount) * 100)
    if (!Number.isFinite(amountCents) || amountCents < 100) return

    setLoading(true)
    setMessage('')
    try {
      const result = await request('POST', {
        amountCents,
        recipientName,
        recipientEmail,
        purchaserName,
        expiresAt: expiresAt || null,
        note,
      })
      setIssuedCode(result.code)
      setMessage(t.issued)
      setRecipientName('')
      setRecipientEmail('')
      setPurchaserName('')
      setExpiresAt('')
      setNote('')
      await load()
      setMessage(t.issued)
    } catch {
      setMessage(t.failed)
    } finally {
      setLoading(false)
    }
  }

  const toggle = async (card: GiftCard) => {
    setLoading(true)
    setMessage('')
    try {
      await request('PATCH', {
        action: 'status',
        cardId: card.id,
        active: !card.active,
      })
      await load()
    } catch {
      setMessage(t.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="admin-panel gift-card-manager">
      <header className="gift-card-manager__header">
        <div>
          <Gift size={21} />
          <div>
            <h2>{t.title}</h2>
            <p>{t.note}</p>
          </div>
        </div>
        <button
          type="button"
          className="admin-toolbar__refresh"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
        </button>
      </header>

      {message && (
        <div
          className={`gift-card-manager__feedback admin-status admin-status--${
            message === t.failed ? 'red' : 'gold'
          }`}
        >
          {message}
        </div>
      )}

      {issuedCode && (
        <div className="gift-card-manager__issued">
          <div>
            <span>{t.card}</span>
            <strong>{issuedCode}</strong>
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              void navigator.clipboard.writeText(issuedCode)
              setMessage(t.copied)
            }}
          >
            <Copy size={15} />
            {t.copy}
          </button>
        </div>
      )}

      <div className="gift-card-manager__workspace">
        <form className="gift-card-manager__card gift-card-form" onSubmit={issue}>
          <header>
            <Plus size={16} />
            <div>
              <h3>{t.issue}</h3>
              <p>{locale === 'zh' ? '填写信息后即刻生成实体卡号，仅显示一次。' : 'Fill in details to issue a new card. The full code appears only once.'}</p>
            </div>
          </header>
          <div className="gift-card-form__grid">
            <label>
              <span>{t.amount}</span>
              <input
                type="number"
                min="1"
                max="10000"
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
              <span>{t.expires}</span>
              <input
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </label>
            <label>
              <span>{t.recipient}</span>
              <input
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
              />
            </label>
            <label>
              <span>{t.recipientEmail}</span>
              <input
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
              />
            </label>
            <label>
              <span>{t.purchaser}</span>
              <input
                value={purchaserName}
                onChange={(event) => setPurchaserName(event.target.value)}
              />
            </label>
            <label className="gift-card-form__note">
              <span>{t.internalNote}</span>
              <input value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
          <footer>
            <button type="submit" className="button button--gold" disabled={loading}>
              <Plus size={15} />
              {t.issue}
            </button>
          </footer>
        </form>

        <div className="gift-card-manager__list gift-card-manager__card">
          <header>
            <div>
              <h3>
                {t.currentCards}
                <em>· {cards.length}</em>
              </h3>
              <p>
                {locale === 'zh'
                  ? '点击卡片展开交易流水，可直接启用/停用。'
                  : 'Expand a card to review activity; toggle status anytime.'}
              </p>
            </div>
          </header>
          {cards.length === 0 ? (
            <div className="gift-card-list__empty">
              <Gift size={26} />
              <p>{t.empty}</p>
            </div>
          ) : (
            <ul className="gift-card-list__stack">
              {cards.map((card) => {
                const expired =
                  card.expires_at &&
                  new Date(card.expires_at).getTime() <= Date.now()
                const transactions = [
                  ...(card.gift_card_transactions ?? []),
                ].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                const statusKey = expired
                  ? 'expired'
                  : card.active
                    ? 'active'
                    : 'inactive'

                return (
                  <li key={card.id} className="gift-card-list__item">
                    <div className="gift-card-list__head">
                      <div className="gift-card-list__brand">
                        <strong>ORA •••• {card.last_four}</strong>
                        <span>
                          {card.recipient_name || card.recipient_email || (locale === 'zh' ? '未指定收卡人' : 'Unassigned')}
                        </span>
                      </div>
                      <dl className="gift-card-list__metrics">
                        <div>
                          <dt>{t.balance}</dt>
                          <dd className="is-balance">{money(card.balance_cents)}</dd>
                        </div>
                        <div>
                          <dt>{t.initial}</dt>
                          <dd>{money(card.initial_balance_cents)}</dd>
                        </div>
                        <div>
                          <dt>{t.status}</dt>
                          <dd>
                            <span
                              className={`admin-status admin-status--${
                                statusKey === 'active'
                                  ? 'green'
                                  : statusKey === 'expired'
                                    ? 'red'
                                    : 'gold'
                              }`}
                            >
                              {expired
                                ? t.expired
                                : card.active
                                  ? t.active
                                  : t.inactive}
                            </span>
                          </dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        className="button button--ghost"
                        disabled={loading || Boolean(expired)}
                        onClick={() => void toggle(card)}
                      >
                        {card.active ? <Ban size={15} /> : <Check size={15} />}
                        {card.active ? t.disable : t.enable}
                      </button>
                    </div>
                    <details className="gift-card-list__history">
                      <summary>{t.history}</summary>
                      {transactions.length === 0 ? (
                        <p className="gift-card-list__history-empty">{t.noHistory}</p>
                      ) : (
                        <ol>
                          {transactions.map((transaction) => (
                            <li key={transaction.id}>
                              <span className={`txn txn--${transaction.transaction_type}`}>
                                {transaction.transaction_type}
                              </span>
                              <strong>{money(transaction.amount_cents)}</strong>
                              <small>
                                  {formatEasternDateTime(
                                    transaction.created_at,
                                  locale === 'zh' ? 'zh-CN' : 'en-US',
                                    {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    },
                                  )}
                                {' · '}
                                {locale === 'zh' ? '余额' : 'Balance'} {money(transaction.balance_after_cents)}
                              </small>
                            </li>
                          ))}
                        </ol>
                      )}
                    </details>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
