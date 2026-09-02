import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, CalendarRange, RefreshCw } from 'lucide-react'
import {
  supabase,
  type EarningsSummary,
  type StaffProfile,
} from '../../lib/supabase'
import {
  easternDateKey,
  easternLocalDateTimeToIso,
  formatDateKey,
  shiftDateKey,
} from '../../lib/dateTime'

type Props = {
  locale: 'zh' | 'en'
  currentProfile: StaffProfile
  staff: StaffProfile[]
}

type RangeType = 'daily' | 'weekly' | 'pay_period'

function mondayOf(dateKey: string) {
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay()
  return shiftDateKey(dateKey, -((weekday + 6) % 7))
}

function money(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function EarningsPanel({ locale, currentProfile, staff }: Props) {
  const [rangeType, setRangeType] = useState<RangeType>('daily')
  const [referenceDate, setReferenceDate] = useState(() => easternDateKey())
  const [selectedStaff, setSelectedStaff] = useState('')
  const [payPeriodAnchor, setPayPeriodAnchor] = useState('2026-08-10')
  const [summaries, setSummaries] = useState<EarningsSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isManager =
    currentProfile.role === 'owner' || currentProfile.role === 'manager'

  const t =
    locale === 'zh'
      ? {
          title: '收入统计',
          note: '按日、周或双周工资周期汇总服务、提成、小费和工时收入。',
          daily: '每日',
          weekly: '每周',
          payPeriod: '工资周期',
          allStaff: '全部员工',
          refresh: '刷新',
          appointments: '预约',
          services: '完成服务',
          serviceSales: '服务销售',
          productSales: '产品销售',
          tips: '小费',
          commission: '提成',
          hours: '工时',
          hourlyPay: '时薪收入',
          estimated: '预计收入',
          empty: '当前周期暂无收入或工时数据。',
          failed: '收入数据读取失败，请重试。',
        }
      : {
          title: 'Earnings',
          note: 'Review service sales, commissions, tips and hourly earnings by day, week or pay period.',
          daily: 'Daily',
          weekly: 'Weekly',
          payPeriod: 'Pay Period',
          allStaff: 'All staff',
          refresh: 'Refresh',
          appointments: 'Appointments',
          services: 'Completed services',
          serviceSales: 'Service sales',
          productSales: 'Product sales',
          tips: 'Tips',
          commission: 'Commission',
          hours: 'Hours worked',
          hourlyPay: 'Hourly pay',
          estimated: 'Estimated earnings',
          empty: 'No earnings or time data in this period.',
          failed: 'Unable to load earnings. Please try again.',
        }

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('business_settings')
      .select('pay_period_anchor')
      .eq('id', true)
      .single()
      .then(({ data }) => {
        if (data?.pay_period_anchor) setPayPeriodAnchor(data.pay_period_anchor)
      })
  }, [])

  const range = useMemo(() => {
    let startDate = referenceDate
    let endDate = shiftDateKey(referenceDate, 1)

    if (rangeType === 'daily') {
      return {
        startDate,
        endDate,
        startIso: easternLocalDateTimeToIso(`${startDate}T00:00`),
        endIso: easternLocalDateTimeToIso(`${endDate}T00:00`),
      }
    } else if (rangeType === 'weekly') {
      startDate = mondayOf(referenceDate)
      endDate = shiftDateKey(startDate, 7)
    } else {
      const referenceTime = new Date(`${referenceDate}T12:00:00Z`).getTime()
      const anchorTime = new Date(`${payPeriodAnchor}T12:00:00Z`).getTime()
      const elapsedDays = Math.floor((referenceTime - anchorTime) / 86400000)
      const periodOffset = Math.floor(elapsedDays / 14) * 14
      startDate = shiftDateKey(payPeriodAnchor, periodOffset)
      endDate = shiftDateKey(startDate, 14)
    }

    return {
      startDate,
      endDate,
      startIso: easternLocalDateTimeToIso(`${startDate}T00:00`),
      endIso: easternLocalDateTimeToIso(`${endDate}T00:00`),
    }
  }, [payPeriodAnchor, rangeType, referenceDate])

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError('')
    const requestedStaff = isManager
      ? selectedStaff || null
      : currentProfile.id
    const { data, error: loadError } = await supabase.rpc(
      'get_earnings_summary',
      {
          range_start: range.startIso,
          range_end: range.endIso,
        requested_staff: requestedStaff,
      },
    )
    setSummaries((data ?? []) as EarningsSummary[])
    setError(loadError ? t.failed : '')
    setLoading(false)
  }, [
    currentProfile.id,
    isManager,
      range.endIso,
      range.startIso,
    selectedStaff,
    t.failed,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="admin-panel earnings-panel">
      <header>
        <div>
          <Banknote size={21} />
          <div>
            <h2>{t.title}</h2>
            <p>{t.note}</p>
          </div>
        </div>
      </header>

      <div className="earnings-toolbar">
        <div className="earnings-range-tabs">
          {(['daily', 'weekly', 'pay_period'] as RangeType[]).map((type) => (
            <button
              className={rangeType === type ? 'is-active' : ''}
              type="button"
              key={type}
              onClick={() => setRangeType(type)}
            >
              {type === 'daily'
                ? t.daily
                : type === 'weekly'
                  ? t.weekly
                  : t.payPeriod}
            </button>
          ))}
        </div>
        <label>
          <CalendarRange size={16} />
          <input
            type="date"
            value={referenceDate}
            onChange={(event) => setReferenceDate(event.target.value)}
          />
        </label>
        {isManager && (
          <select
            value={selectedStaff}
            onChange={(event) => setSelectedStaff(event.target.value)}
          >
            <option value="">{t.allStaff}</option>
            {staff
              .filter((profile) => profile.active)
              .map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profile.display_name}
                </option>
              ))}
          </select>
        )}
        <button type="button" disabled={loading} onClick={() => void load()}>
          <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
          {t.refresh}
        </button>
      </div>

      <p className="earnings-period">
          {formatDateKey(
            range.startDate,
            locale === 'zh' ? 'zh-CN' : 'en-US',
            { dateStyle: 'medium' },
          )}{' '}
          -{' '}
          {formatDateKey(
            shiftDateKey(range.endDate, -1),
            locale === 'zh' ? 'zh-CN' : 'en-US',
            { dateStyle: 'medium' },
          )}
      </p>
      {error && <p className="admin-error">{error}</p>}

      <div className="earnings-grid">
        {summaries.length === 0 && !loading ? (
          <p>{t.empty}</p>
        ) : (
          summaries.map((summary) => {
            const commission =
              Number(summary.service_commission_cents) +
              Number(summary.product_commission_cents)
            return (
              <article key={summary.staff_id}>
                <h3>{summary.staff_name}</h3>
                <dl>
                  <div><dt>{t.appointments}</dt><dd>{summary.appointment_count}</dd></div>
                  <div><dt>{t.services}</dt><dd>{summary.completed_service_count}</dd></div>
                  <div><dt>{t.serviceSales}</dt><dd>{money(summary.service_sales_cents)}</dd></div>
                  <div><dt>{t.productSales}</dt><dd>{money(summary.product_sales_cents)}</dd></div>
                  <div><dt>{t.tips}</dt><dd>{money(summary.tips_cents)}</dd></div>
                  <div><dt>{t.commission}</dt><dd>{money(commission)}</dd></div>
                  <div><dt>{t.hours}</dt><dd>{(summary.worked_minutes / 60).toFixed(2)}</dd></div>
                  <div><dt>{t.hourlyPay}</dt><dd>{money(summary.hourly_pay_cents)}</dd></div>
                </dl>
                <div className="earnings-total">
                  <span>{t.estimated}</span>
                  <strong>{money(summary.estimated_earnings_cents)}</strong>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
