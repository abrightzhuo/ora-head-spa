import { useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Mail,
  PencilLine,
  Phone,
  Plus,
  UserRound,
  X,
} from 'lucide-react'
import type {
  Appointment,
  AppointmentCharge,
  AppointmentChangeHistory,
  Customer,
  Service,
  StaffProfile,
} from '../../lib/supabase'
import {
  easternDateKey,
  easternInputValue,
  easternLocalDateTimeToIso,
  formatDateKey,
  formatEasternDateTime,
  shiftDateKey,
} from '../../lib/dateTime'

type Props = {
  appointments: Appointment[]
  customers: Customer[]
  services: Service[]
  staff: StaffProfile[]
  session: Session
  locale: 'zh' | 'en'
  currentProfile: StaffProfile
  onStatusChange: (
    appointment: Appointment,
    status: Appointment['status'],
  ) => void
  onAppointmentSaved: () => void
  changeHistory: AppointmentChangeHistory[]
  charges: AppointmentCharge[]
  onChargeFee: (
    appointment: Appointment,
    chargeType: AppointmentCharge['charge_type'],
  ) => void
  updatingId: string | null
  chargingId: string | null
}

type ViewMode = 'day' | 'week'

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

function startOfWeek(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  return shiftDateKey(date, -((day + 6) % 7))
}

export function AppointmentCalendar({
  appointments,
  customers,
  services,
  staff,
  session,
  locale,
  currentProfile,
  onStatusChange,
  onAppointmentSaved,
  changeHistory,
  charges,
  onChargeFee,
  updatingId,
  chargingId,
}: Props) {
  const [date, setDate] = useState(() => easternDateKey())
  const [view, setView] = useState<ViewMode>('day')
  const [providerId, setProviderId] = useState(
    currentProfile.role === 'staff' ? currentProfile.id : 'all',
  )
  const [editing, setEditing] = useState<Appointment | 'new' | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [editProviderId, setEditProviderId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const labels = statusLabels[locale]
  const isStaff = currentProfile.role === 'staff'
  const providers = staff.filter(
    (profile) => profile.active && profile.role === 'staff' && profile.bookable,
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
  const changesByAppointment = useMemo(() => {
    const map = new Map<string, AppointmentChangeHistory[]>()
    changeHistory.forEach((entry) => {
      const entries = map.get(entry.appointment_id) ?? []
      entries.push(entry)
      map.set(entry.appointment_id, entries)
    })
    return map
  }, [changeHistory])
  const weekStart = startOfWeek(date)
  const dateKeys = useMemo(
    () =>
      view === 'day'
        ? [date]
        : Array.from({ length: 7 }, (_, index) =>
            shiftDateKey(weekStart, index),
          ),
    [date, view, weekStart],
  )
  const visibleAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            dateKeys.includes(appointment.preferred_date) &&
            (providerId === 'all' || appointment.provider_id === providerId),
        )
        .sort((left, right) =>
          (left.starts_at ?? '').localeCompare(right.starts_at ?? ''),
        ),
    [appointments, dateKeys, providerId],
  )

  const openForm = (appointment?: Appointment) => {
    setEditing(appointment ?? 'new')
    setCustomerId(appointment?.customer_id ?? customers[0]?.id ?? '')
    setServiceId(appointment?.service_id ?? services[0]?.id ?? '')
    setEditProviderId(
      appointment?.provider_id ??
        (isStaff ? currentProfile.id : providers[0]?.id) ??
        '',
    )
    setStartsAt(
      appointment?.starts_at
        ? easternInputValue(appointment.starts_at)
        : `${date}T10:00`,
    )
    setNotes(appointment?.message ?? '')
    setSaveError('')
  }

  const saveAppointment = async () => {
    if (!editing || !serviceId || !editProviderId || !startsAt) return
    if (editing === 'new' && !customerId) return
    setSaving(true)
    setSaveError('')
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action:
            editing === 'new' ? 'create_appointment' : 'update_appointment',
          appointmentId: editing === 'new' ? undefined : editing.id,
          customerId: editing === 'new' ? customerId : undefined,
          serviceId,
          providerId: editProviderId,
          startsAt: easternLocalDateTimeToIso(startsAt),
          notes,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.appointment) {
        throw new Error(result.error ?? 'save_failed')
      }
      setEditing(null)
      onAppointmentSaved()
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setSaveError(
        code === 'slot_unavailable'
          ? locale === 'zh'
            ? '该时间不可预约，请选择其他时间。'
            : 'That time is unavailable.'
          : locale === 'zh'
            ? '保存失败，请检查技师排班和项目设置。'
            : 'Unable to save. Check provider schedule and service settings.',
      )
    } finally {
      setSaving(false)
    }
  }

  const changePeriod = (direction: number) => {
    setDate(shiftDateKey(date, direction * (view === 'day' ? 1 : 7)))
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
                ? '查看客户详情、日/周排班、改约及到店服务状态。'
                : 'Review guest details, day/week schedules and appointment changes.'}
            </p>
          </div>
        </div>
        {!isStaff && (
          <button type="button" onClick={() => openForm()}>
            <Plus size={15} />
            {locale === 'zh' ? '新建预约' : 'New appointment'}
          </button>
        )}
      </header>

      <div className="appointment-calendar__controls">
        <div className="appointment-calendar__view">
          {(['day', 'week'] as ViewMode[]).map((mode) => (
            <button
              className={view === mode ? 'is-active' : ''}
              type="button"
              key={mode}
              onClick={() => setView(mode)}
            >
              {mode === 'day'
                ? locale === 'zh'
                  ? '日'
                  : 'Day'
                : locale === 'zh'
                  ? '周'
                  : 'Week'}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => changePeriod(-1)}>
          <ChevronLeft size={16} />
        </button>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <button type="button" onClick={() => changePeriod(1)}>
          <ChevronRight size={16} />
        </button>
        {!isStaff && (
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

      {editing && (
        <div className="appointment-editor">
          <header>
            <h3>
              {editing === 'new'
                ? locale === 'zh'
                  ? '新建预约'
                  : 'New appointment'
                : locale === 'zh'
                  ? '修改预约'
                  : 'Edit appointment'}
            </h3>
            <button type="button" onClick={() => setEditing(null)}>
              <X size={16} />
            </button>
          </header>
          <div className="appointment-editor__grid">
            {editing === 'new' && (
              <label>
                <span>{locale === 'zh' ? '客户' : 'Customer'}</span>
                <select
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} · {customer.phone}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span>{locale === 'zh' ? '项目' : 'Service'}</span>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.duration_minutes} min · $
                    {((service.price_cents ?? 0) / 100).toFixed(2)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{locale === 'zh' ? '技师' : 'Provider'}</span>
              <select
                value={editProviderId}
                disabled={isStaff}
                onChange={(event) => setEditProviderId(event.target.value)}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{locale === 'zh' ? '时间' : 'Time'}</span>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </label>
          </div>
          <label>
            <span>{locale === 'zh' ? '备注' : 'Notes'}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          {saveError && <p className="admin-error">{saveError}</p>}
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveAppointment()}
          >
            {locale === 'zh' ? '保存预约' : 'Save appointment'}
          </button>
        </div>
      )}

      <div className={`appointment-calendar__timeline view-${view}`}>
        {dateKeys.map((dateKey) => {
          const dayAppointments = visibleAppointments.filter(
            (appointment) => appointment.preferred_date === dateKey,
          )
          return (
            <section className="appointment-calendar__day" key={dateKey}>
              {view === 'week' && (
                <h3>
                  {formatDateKey(dateKey, locale === 'zh' ? 'zh-CN' : 'en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
              )}
              {dayAppointments.length === 0 ? (
                <p className="appointment-calendar__empty">
                  {locale === 'zh' ? '无预约' : 'No appointments'}
                </p>
              ) : (
                dayAppointments.map((appointment) => {
                  const provider = appointment.provider_id
                    ? staffById.get(appointment.provider_id)
                    : null
                  const next = nextStatus(appointment.status)
                  const chargeType =
                    appointment.status ===
                    'cancelled_or_changed_outside_24h'
                      ? 'cancellation_outside_24h'
                      : appointment.status ===
                          'cancelled_or_changed_within_24h'
                        ? 'late_cancellation'
                        : appointment.status === 'no_show_no_contact'
                          ? 'no_show'
                          : null
                  const charge = chargeType
                    ? chargeByAppointment.get(
                        `${appointment.id}:${chargeType}`,
                      )
                    : null
                  const percentage =
                    chargeType === 'no_show'
                      ? 50
                      : chargeType === 'late_cancellation'
                        ? 15
                        : 0
                  const feeCents = appointment.service_price_cents
                    ? Math.round(
                        (appointment.service_price_cents * percentage) / 100,
                      )
                    : 0
                  const appointmentChanges =
                    changesByAppointment.get(appointment.id) ?? []

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
                      <details className="appointment-calendar__guest">
                        <summary>
                          <strong>{appointment.customer_name}</strong>
                          <span>{appointment.service}</span>
                        </summary>
                        <div>
                          <a href={`tel:${appointment.phone}`}>
                            <Phone size={12} /> {appointment.phone}
                          </a>
                          {appointment.customer_email && (
                            <a href={`mailto:${appointment.customer_email}`}>
                              <Mail size={12} /> {appointment.customer_email}
                            </a>
                          )}
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
                          {appointment.message && <p>{appointment.message}</p>}
                          {appointmentChanges.length > 0 && (
                            <small>
                              {locale === 'zh' ? '修改记录' : 'Changes'}:{' '}
                              {appointmentChanges.length}
                            </small>
                          )}
                        </div>
                      </details>
                      <div className="appointment-calendar__actions">
                        <em>{labels[appointment.status]}</em>
                        {![
                          'checked_out',
                          'cancelled_or_changed_outside_24h',
                          'cancelled_or_changed_within_24h',
                          'no_show_no_contact',
                        ].includes(appointment.status) && (
                          <button
                            type="button"
                            onClick={() => openForm(appointment)}
                          >
                            <PencilLine size={13} />
                            {locale === 'zh' ? '修改' : 'Edit'}
                          </button>
                        )}
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
                          !isStaff &&
                          appointment.payment_method_id &&
                          charge?.status !== 'completed' &&
                          charge?.status !== 'waived' && (
                            <button
                              type="button"
                              disabled={chargingId === appointment.id}
                              onClick={() =>
                                onChargeFee(appointment, chargeType)
                              }
                            >
                              <Banknote size={13} />
                              {percentage === 0
                                ? locale === 'zh'
                                  ? '确认免收'
                                  : 'Confirm no fee'
                                : `${percentage}% · $${(
                                    feeCents / 100
                                  ).toFixed(2)}`}
                            </button>
                          )}
                      </div>
                    </article>
                  )
                })
              )}
            </section>
          )
        })}
      </div>
    </section>
  )
}
