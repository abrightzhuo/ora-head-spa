import { useMemo, useState } from 'react'
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserRound,
} from 'lucide-react'
import type {
  Appointment,
  AppointmentCharge,
  StaffProfile,
} from '../../lib/supabase'
import {
  easternDateKey,
  formatEasternDateTime,
  shiftDateKey,
} from '../../lib/dateTime'

type Props = {
  appointments: Appointment[]
  staff: StaffProfile[]
  locale: 'zh' | 'en'
  currentProfile: StaffProfile
  onStatusChange: (
    appointment: Appointment,
    status: Appointment['status'],
  ) => void
  charges: AppointmentCharge[]
  onChargeFee: (
    appointment: Appointment,
    chargeType: AppointmentCharge['charge_type'],
  ) => void
  updatingId: string | null
  chargingId: string | null
}

const statusOrder: Appointment['status'][] = [
  'pending',
  'checked_in',
  'in_service',
  'completed',
  'checked_out',
]

const statusLabels = {
  zh: {
    pending: '已预约',
    checked_in: '已到店',
    in_service: '服务中',
    completed: '服务完成',
    checked_out: '已结账',
    cancelled_or_changed_outside_24h: '提前24小时以上取消或更改',
    cancelled_or_changed_within_24h: '24小时内取消或更改',
    no_show_no_contact: '未到店且未提前联系',
  },
  en: {
    pending: 'Booked',
    checked_in: 'Checked In',
    in_service: 'In Service',
    completed: 'Completed',
    checked_out: 'Checked Out',
    cancelled_or_changed_outside_24h: 'Cancelled/changed over 24h',
    cancelled_or_changed_within_24h: 'Cancelled/changed within 24h',
    no_show_no_contact: 'No-show without notice',
  },
}

export function AppointmentCalendar({
  appointments,
  staff,
  locale,
  currentProfile,
  onStatusChange,
  charges,
  onChargeFee,
  updatingId,
  chargingId,
}: Props) {
  const [date, setDate] = useState(() => easternDateKey())
  const [providerId, setProviderId] = useState(
    currentProfile.role === 'staff' ? currentProfile.id : 'all',
  )
  const labels = statusLabels[locale]
  const providers = staff.filter(
    (profile) => profile.active && profile.role === 'staff',
  )
  const staffById = useMemo(
    () => new Map(staff.map((profile) => [profile.id, profile])),
    [staff],
  )
  const chargeByAppointment = useMemo(
    () =>
      new Map(
        charges.map((charge) => [
          `${charge.appointment_id}:${charge.charge_type}`,
          charge,
        ]),
      ),
    [charges],
  )

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => {
          return (
            appointment.preferred_date === date &&
            (providerId === 'all' || appointment.provider_id === providerId)
          )
        })
        .sort((left, right) =>
          (left.starts_at ?? '').localeCompare(right.starts_at ?? ''),
        ),
    [appointments, date, providerId],
  )

  const changeDay = (days: number) => {
    setDate(shiftDateKey(date, days))
  }

  const nextStatus = (status: Appointment['status']) => {
    const index = statusOrder.indexOf(status)
    return index >= 0 && index < statusOrder.length - 1
      ? statusOrder[index + 1]
      : null
  }

  return (
    <section className="admin-panel appointment-calendar">
      <header>
        <div>
          <CalendarDays size={20} />
          <div>
            <h2>{locale === 'zh' ? '预约日历' : 'Appointment Calendar'}</h2>
            <p>
              {locale === 'zh'
                ? '查看当天预约并完成 Check-in 与服务状态流转。'
                : 'Review the day and move guests through check-in and service.'}
            </p>
          </div>
        </div>
        <div className="appointment-calendar__controls">
          <button type="button" onClick={() => changeDay(-1)}>
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <button type="button" onClick={() => changeDay(1)}>
            <ChevronRight size={16} />
          </button>
          {currentProfile.role !== 'staff' && (
            <select
              value={providerId}
              onChange={(event) => setProviderId(event.target.value)}
            >
              <option value="all">
                {locale === 'zh' ? '全部技师' : 'All providers'}
              </option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.display_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className="appointment-calendar__timeline">
        {dayAppointments.length === 0 ? (
          <div className="appointment-calendar__empty">
            <CalendarDays />
            <p>
              {locale === 'zh'
                ? '当天没有预约。'
                : 'No appointments on this day.'}
            </p>
          </div>
        ) : (
          dayAppointments.map((appointment) => {
            const provider = appointment.provider_id
              ? staffById.get(appointment.provider_id)
              : null
            const next = nextStatus(appointment.status)
            const chargeType =
              appointment.status === 'cancelled_or_changed_outside_24h'
                ? 'cancellation_outside_24h'
                : appointment.status === 'cancelled_or_changed_within_24h'
                  ? 'late_cancellation'
                  : appointment.status === 'no_show_no_contact'
                  ? 'no_show'
                  : null
            const charge = chargeType
              ? chargeByAppointment.get(`${appointment.id}:${chargeType}`)
              : null
            const chargeEligible =
              currentProfile.role !== 'staff' && chargeType !== null
            const percentage =
              chargeType === 'no_show'
                ? 50
                : chargeType === 'late_cancellation'
                  ? 15
                  : 0
            const feeCents = appointment.service_price_cents
              ? Math.round(appointment.service_price_cents * percentage / 100)
              : 0
            return (
              <article
                key={appointment.id}
                className={`appointment-calendar__item status-${appointment.status}`}
              >
                <time>
                  {appointment.starts_at
                      ? formatEasternDateTime(
                          appointment.starts_at,
                        locale === 'zh' ? 'zh-CN' : 'en-US',
                        { hour: 'numeric', minute: '2-digit' },
                        )
                    : '—'}
                </time>
                <div>
                  <strong>{appointment.customer_name}</strong>
                  <span>{appointment.service}</span>
                  <small>
                    <UserRound size={12} />
                    {provider?.display_name ??
                      (locale === 'zh' ? '未分配技师' : 'Unassigned')}
                  </small>
                  {appointment.card_last_four && (
                    <small>
                      <CreditCard size={12} />
                      {appointment.card_brand ?? 'Card'} ••••{' '}
                      {appointment.card_last_four}
                    </small>
                  )}
                </div>
                <div className="appointment-calendar__actions">
                  <em>{labels[appointment.status]}</em>
                  {next && (
                    <button
                      type="button"
                      disabled={updatingId === appointment.id}
                      onClick={() => onStatusChange(appointment, next)}
                    >
                      {labels[next]}
                    </button>
                  )}
                  {chargeType &&
                    chargeEligible &&
                    appointment.payment_method_id &&
                    charge?.status !== 'completed' &&
                    charge?.status !== 'waived' && (
                      <button
                        type="button"
                        disabled={chargingId === appointment.id}
                        onClick={() => onChargeFee(appointment, chargeType)}
                      >
                        <Banknote size={13} />
                        {charge?.status === 'failed'
                          ? locale === 'zh'
                            ? `重试收取 ${percentage}%`
                            : `Retry ${percentage}% fee`
                          : percentage === 0
                            ? locale === 'zh'
                              ? '确认免收费用 · $0.00'
                              : 'Confirm no fee · $0.00'
                            : locale === 'zh'
                              ? `收取 ${percentage}% · $${(feeCents / 100).toFixed(2)}`
                              : `Charge ${percentage}% · $${(feeCents / 100).toFixed(2)}`}
                      </button>
                    )}
                  {(charge?.status === 'completed' ||
                    charge?.status === 'waived') && (
                    <a
                      className="appointment-calendar__receipt"
                      href={charge.receipt_url ?? undefined}
                      target={charge.receipt_url ? '_blank' : undefined}
                      rel={charge.receipt_url ? 'noreferrer' : undefined}
                    >
                      {charge.status === 'waived'
                        ? locale === 'zh'
                          ? '已确认免收费用'
                          : 'No fee confirmed'
                        : locale === 'zh'
                          ? `已收取 $${(charge.amount_cents / 100).toFixed(2)}`
                          : `Charged $${(charge.amount_cents / 100).toFixed(2)}`}
                    </a>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
