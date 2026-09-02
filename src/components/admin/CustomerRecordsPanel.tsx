import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  CalendarDays,
  CalendarPlus,
  History,
  Mail,
  Phone,
  Search,
  StickyNote,
  UserRound,
} from 'lucide-react'
import {
  type Appointment,
  type Checkout,
  type CheckoutItem,
  type Customer,
  type Service,
  type StaffProfile,
} from '../../lib/supabase'
import {
  easternInputValue,
  easternLocalDateTimeToIso,
  formatDateKey,
  formatEasternDateTime,
} from '../../lib/dateTime'
import { copy } from '../../localizedContent'

type AdminLocale = 'zh' | 'en'

type CustomerRecord = {
  key: string
  customer: Customer | null
  name: string
  phone: string
  email: string
  notes: string
  appointments: Appointment[]
}

const labels = {
  zh: {
    title: '顾客档案',
    note: '通过手机号、邮箱或姓名查找顾客，并查看完整预约与服务记录。',
    search: '输入手机号、邮箱或姓名',
    customers: '顾客',
    appointments: '预约',
    completed: '已完成服务',
    lastVisit: '最近预约',
    noVisit: '暂无',
    noCustomers: '没有找到匹配的顾客',
    selectCustomer: '选择左侧顾客查看详细记录',
    history: '预约与服务历史',
    provider: '技师',
    service: '服务项目',
    status: '状态',
    customerMessage: '顾客留言',
    serviceNotes: '服务记录',
    checkoutItems: '实际服务及加购',
    noNotes: '暂无服务记录',
    profileNotes: '顾客备注',
    registerWalkIn: '登记到店消费',
    walkInTitle: '登记 Walk-in 服务',
    walkInNote: '为该顾客创建一条已到店记录，随后可在 Checkout 中完成收款。',
    walkInService: '服务项目',
    walkInProvider: '服务技师',
    walkInTime: '到店时间',
    walkInNotes: '服务备注（可选）',
    cancel: '取消',
    create: '创建到店记录',
    creating: '正在创建...',
    created: '到店记录已创建，可前往 Checkout 继续收款。',
    invalid: '请选择服务、技师和到店时间。',
    unavailable: '该技师在所选时间已有预约，请选择其他技师或时间。',
    createFailed: '无法创建到店记录，请重试。',
  },
  en: {
    title: 'Customer Records',
    note: 'Find customers by phone, email or name and review their complete booking and service history.',
    search: 'Search phone, email or name',
    customers: 'Customers',
    appointments: 'Appointments',
    completed: 'Completed services',
    lastVisit: 'Latest appointment',
    noVisit: 'None',
    noCustomers: 'No matching customers',
    selectCustomer: 'Select a customer to view their records',
    history: 'Booking and service history',
    provider: 'Provider',
    service: 'Service',
    status: 'Status',
    customerMessage: 'Customer message',
    serviceNotes: 'Service record',
    checkoutItems: 'Services and add-ons',
    noNotes: 'No service notes',
    profileNotes: 'Customer notes',
    registerWalkIn: 'Record walk-in',
    walkInTitle: 'Record walk-in service',
    walkInNote: 'Create a checked-in record for this customer, then complete payment in Checkout.',
    walkInService: 'Service',
    walkInProvider: 'Provider',
    walkInTime: 'Arrival time',
    walkInNotes: 'Service notes (optional)',
    cancel: 'Cancel',
    create: 'Create walk-in record',
    creating: 'Creating...',
    created: 'Walk-in record created. Continue payment in Checkout.',
    invalid: 'Select a service, provider and arrival time.',
    unavailable: 'This provider already has an appointment at that time.',
    createFailed: 'Unable to create the walk-in record. Try again.',
  },
}

const statusLabels = {
  zh: {
    pending: '已预约',
    checked_in: '已到店',
    in_service: '服务中',
    completed: '已完成',
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

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? ''
}

function normalizePhone(value: string | null | undefined) {
  return value?.replace(/\D/g, '') ?? ''
}

function localDateTimeValue() {
  return easternInputValue(new Date())
}

function appointmentTime(appointment: Appointment) {
  return new Date(
    appointment.starts_at ??
      `${appointment.preferred_date}T12:00:00`,
  ).getTime()
}

function formatAppointmentDate(
  appointment: Appointment,
  locale: AdminLocale,
) {
  const displayLocale = locale === 'zh' ? 'zh-CN' : 'en-US'
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: appointment.starts_at ? '2-digit' : undefined,
    minute: appointment.starts_at ? '2-digit' : undefined,
  }

  return appointment.starts_at
    ? formatEasternDateTime(appointment.starts_at, displayLocale, options)
    : formatDateKey(appointment.preferred_date, displayLocale, options)
}

function formatService(value: string, locale: AdminLocale) {
  for (const localeCopy of Object.values(copy)) {
    const index = localeCopy.services.items.findIndex(
      (service) => service.title === value || service.english === value,
    )
    if (index >= 0) {
      return copy[locale].services.items[index]?.title ?? value
    }
  }
  return value
}

function buildCustomerRecords(
  customers: Customer[],
  appointments: Appointment[],
) {
  const records = new Map<string, CustomerRecord>()
  const byCustomerId = new Map<string, string>()
  const byEmail = new Map<string, string>()
  const byPhone = new Map<string, string>()

  customers.forEach((customer) => {
    const key = `customer-${customer.id}`
    records.set(key, {
      key,
      customer,
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      notes: customer.notes ?? '',
      appointments: [],
    })
    byCustomerId.set(customer.id, key)
    const email = normalizeEmail(customer.email)
    const phone = normalizePhone(customer.phone)
    if (email && !byEmail.has(email)) byEmail.set(email, key)
    if (phone && !byPhone.has(phone)) byPhone.set(phone, key)
  })

  appointments.forEach((appointment) => {
    const email = normalizeEmail(appointment.customer_email)
    const phone = normalizePhone(appointment.phone)
    const matchedKey =
      (appointment.customer_id
        ? byCustomerId.get(appointment.customer_id)
        : undefined) ??
      (email ? byEmail.get(email) : undefined) ??
      (phone ? byPhone.get(phone) : undefined)
    const key = matchedKey ?? `appointment-${appointment.id}`
    let record = records.get(key)

    if (!record) {
      record = {
        key,
        customer: null,
        name: appointment.customer_name,
        phone: appointment.phone,
        email: appointment.customer_email ?? '',
        notes: '',
        appointments: [],
      }
      records.set(key, record)
      if (email) byEmail.set(email, key)
      if (phone) byPhone.set(phone, key)
    }

    record.appointments.push(appointment)
  })

  return [...records.values()]
    .map((record) => ({
      ...record,
      appointments: [...record.appointments].sort(
        (left, right) => appointmentTime(right) - appointmentTime(left),
      ),
    }))
    .sort((left, right) => {
      const leftTime = left.appointments[0]
        ? appointmentTime(left.appointments[0])
        : new Date(left.customer?.created_at ?? 0).getTime()
      const rightTime = right.appointments[0]
        ? appointmentTime(right.appointments[0])
        : new Date(right.customer?.created_at ?? 0).getTime()
      return rightTime - leftTime
    })
}

export function CustomerRecordsPanel({
  locale,
  customers,
  appointments,
  staff,
  services,
  checkouts,
  checkoutItems,
  session,
  onWalkInCreated,
}: {
  locale: AdminLocale
  customers: Customer[]
  appointments: Appointment[]
  staff: StaffProfile[]
  services: Service[]
  checkouts: Checkout[]
  checkoutItems: CheckoutItem[]
  session: Session
  onWalkInCreated: (appointment: Appointment) => void
}) {
  const t = labels[locale]
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [walkInServiceId, setWalkInServiceId] = useState('')
  const [walkInProviderId, setWalkInProviderId] = useState('')
  const [walkInStartsAt, setWalkInStartsAt] = useState(localDateTimeValue)
  const [walkInNotes, setWalkInNotes] = useState('')
  const [walkInBusy, setWalkInBusy] = useState(false)
  const [walkInMessage, setWalkInMessage] = useState('')
  const records = useMemo(
    () => buildCustomerRecords(customers, appointments),
    [appointments, customers],
  )
  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase()
    const phoneKeyword = normalizePhone(query)
    if (!keyword) return records

    return records.filter((record) =>
      record.name.toLocaleLowerCase().includes(keyword) ||
      record.email.toLocaleLowerCase().includes(keyword) ||
      record.phone.toLocaleLowerCase().includes(keyword) ||
      (phoneKeyword &&
        normalizePhone(record.phone).includes(phoneKeyword)),
    )
  }, [query, records])

  useEffect(() => {
    if (
      filteredRecords.length > 0 &&
      !filteredRecords.some((record) => record.key === selectedKey)
    ) {
      setSelectedKey(filteredRecords[0].key)
    }
    if (filteredRecords.length === 0) setSelectedKey('')
  }, [filteredRecords, selectedKey])

  const selected =
    filteredRecords.find((record) => record.key === selectedKey) ?? null
  const staffById = useMemo(
    () => new Map(staff.map((profile) => [profile.id, profile])),
    [staff],
  )
  const checkoutByAppointment = useMemo(
    () =>
      new Map(
        checkouts.map((checkout) => [checkout.appointment_id, checkout]),
      ),
    [checkouts],
  )
  const itemsByCheckout = useMemo(() => {
    const grouped = new Map<string, CheckoutItem[]>()
    checkoutItems.forEach((item) => {
      const items = grouped.get(item.checkout_id) ?? []
      items.push(item)
      grouped.set(item.checkout_id, items)
    })
    return grouped
  }, [checkoutItems])

  const completedCount =
    selected?.appointments.filter((appointment) =>
      ['completed', 'checked_out'].includes(appointment.status),
    ).length ?? 0
  const providers = useMemo(
    () => staff.filter((profile) => profile.active && profile.bookable),
    [staff],
  )

  useEffect(() => {
    if (!walkInServiceId && services[0]) {
      setWalkInServiceId(services[0].id)
    }
    if (!walkInProviderId && providers[0]) {
      setWalkInProviderId(providers[0].id)
    }
  }, [providers, services, walkInProviderId, walkInServiceId])

  const createWalkIn = async () => {
    if (
      !selected?.customer ||
      !walkInServiceId ||
      !walkInProviderId ||
      !walkInStartsAt
    ) {
      setWalkInMessage(t.invalid)
      return
    }

    setWalkInBusy(true)
    setWalkInMessage('')
    try {
      const response = await fetch('/api/bookings?walkIn=1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selected.customer.id,
          serviceId: walkInServiceId,
          providerId: walkInProviderId,
          startsAt: easternLocalDateTimeToIso(walkInStartsAt),
          notes: walkInNotes,
        }),
      })
      const result = await response.json() as {
        appointment?: Appointment
        error?: string
      }
      if (!response.ok || !result.appointment) {
        setWalkInMessage(
          result.error === 'provider_unavailable'
            ? t.unavailable
            : t.createFailed,
        )
        return
      }

      onWalkInCreated(result.appointment)
      setWalkInOpen(false)
      setWalkInNotes('')
      setWalkInStartsAt(localDateTimeValue())
      setWalkInMessage(t.created)
    } catch {
      setWalkInMessage(t.createFailed)
    } finally {
      setWalkInBusy(false)
    }
  }

  return (
    <section className="admin-panel customer-records">
      <header className="customer-records__header">
        <div>
          <UserRound size={21} />
          <div>
            <h2>{t.title}</h2>
            <p>{t.note}</p>
          </div>
        </div>
        <label className="customer-records__search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            aria-label={t.search}
          />
        </label>
      </header>

      <div className="customer-records__workspace">
        <aside className="customer-records__list">
          <strong>{t.customers} · {filteredRecords.length}</strong>
          {filteredRecords.length === 0 ? (
            <p className="customer-records__empty">{t.noCustomers}</p>
          ) : (
            filteredRecords.map((record) => (
              <button
                className={record.key === selectedKey ? 'is-active' : ''}
                type="button"
                key={record.key}
                onClick={() => setSelectedKey(record.key)}
              >
                <span>{record.name}</span>
                <small>{record.phone || '—'}</small>
                <small>{record.email || '—'}</small>
                <em>{record.appointments.length} {t.appointments}</em>
              </button>
            ))
          )}
        </aside>

        <div className="customer-records__detail">
          {!selected ? (
            <div className="customer-records__empty">
              <UserRound size={28} />
              <p>{t.selectCustomer}</p>
            </div>
          ) : (
            <>
              <div className="customer-records__identity">
                <div>
                  <span className="customer-records__avatar">
                    {selected.name.slice(0, 1).toLocaleUpperCase()}
                  </span>
                  <div>
                    <h3>{selected.name}</h3>
                    <div className="customer-records__contacts">
                      {selected.phone && (
                        <a href={`tel:${selected.phone}`}>
                          <Phone size={14} />
                          {selected.phone}
                        </a>
                      )}
                      {selected.email && (
                        <a href={`mailto:${selected.email}`}>
                          <Mail size={14} />
                          {selected.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {selected.notes && (
                  <p>
                    <StickyNote size={14} />
                    <span><strong>{t.profileNotes}</strong>{selected.notes}</span>
                  </p>
                )}
              </div>

              {selected.customer && (
                <div className="customer-records__walk-in">
                  <button
                    className="customer-records__walk-in-trigger"
                    type="button"
                    onClick={() => {
                      setWalkInOpen((current) => !current)
                      setWalkInMessage('')
                    }}
                  >
                    <CalendarPlus size={16} />
                    {t.registerWalkIn}
                  </button>
                  {walkInOpen && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        void createWalkIn()
                      }}
                    >
                      <div>
                        <h4>{t.walkInTitle}</h4>
                        <p>{t.walkInNote}</p>
                      </div>
                      <label>
                        <span>{t.walkInService}</span>
                        <select
                          required
                          value={walkInServiceId}
                          onChange={(event) =>
                            setWalkInServiceId(event.target.value)
                          }
                        >
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {locale === 'zh'
                                ? service.name_zh || service.name
                                : service.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t.walkInProvider}</span>
                        <select
                          required
                          value={walkInProviderId}
                          onChange={(event) =>
                            setWalkInProviderId(event.target.value)
                          }
                        >
                          {providers.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.display_name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t.walkInTime}</span>
                        <input
                          required
                          type="datetime-local"
                          value={walkInStartsAt}
                          onChange={(event) =>
                            setWalkInStartsAt(event.target.value)
                          }
                        />
                      </label>
                      <label className="customer-records__walk-in-notes">
                        <span>{t.walkInNotes}</span>
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={walkInNotes}
                          onChange={(event) =>
                            setWalkInNotes(event.target.value)
                          }
                        />
                      </label>
                      <div className="customer-records__walk-in-actions">
                        <button
                          type="button"
                          onClick={() => setWalkInOpen(false)}
                        >
                          {t.cancel}
                        </button>
                        <button type="submit" disabled={walkInBusy}>
                          {walkInBusy ? t.creating : t.create}
                        </button>
                      </div>
                    </form>
                  )}
                  {walkInMessage && (
                    <p
                      className="customer-records__walk-in-message"
                      role="status"
                    >
                      {walkInMessage}
                    </p>
                  )}
                </div>
              )}

              <dl className="customer-records__summary">
                <div>
                  <dt>{t.appointments}</dt>
                  <dd>{selected.appointments.length}</dd>
                </div>
                <div>
                  <dt>{t.completed}</dt>
                  <dd>{completedCount}</dd>
                </div>
                <div>
                  <dt>{t.lastVisit}</dt>
                  <dd>
                    {selected.appointments[0]
                      ? formatAppointmentDate(
                          selected.appointments[0],
                          locale,
                        )
                      : t.noVisit}
                  </dd>
                </div>
              </dl>

              <div className="customer-records__history">
                <h3><History size={18} />{t.history}</h3>
                {selected.appointments.length === 0 ? (
                  <p className="customer-records__empty">{t.noVisit}</p>
                ) : (
                  selected.appointments.map((appointment) => {
                    const checkout = checkoutByAppointment.get(appointment.id)
                    const items = checkout
                      ? itemsByCheckout.get(checkout.id) ?? []
                      : []
                    const provider = appointment.provider_id
                      ? staffById.get(appointment.provider_id)
                      : null
                    const serviceNotes =
                      appointment.internal_notes || checkout?.notes || ''

                    return (
                      <article key={appointment.id}>
                        <div className="customer-records__appointment-head">
                          <div>
                            <CalendarDays size={17} />
                            <time>
                              {formatAppointmentDate(appointment, locale)}
                            </time>
                          </div>
                          <span className={`admin-status admin-status--${appointment.status}`}>
                            {statusLabels[locale][appointment.status]}
                          </span>
                        </div>
                        <dl>
                          <div>
                            <dt>{t.service}</dt>
                            <dd>{formatService(appointment.service, locale)}</dd>
                          </div>
                          <div>
                            <dt>{t.provider}</dt>
                            <dd>{provider?.display_name ?? '—'}</dd>
                          </div>
                        </dl>
                        {items.length > 0 && (
                          <div className="customer-records__items">
                            <strong>{t.checkoutItems}</strong>
                            <ul>
                              {[...items]
                                .sort(
                                  (left, right) =>
                                    left.display_order - right.display_order,
                                )
                                .map((item) => (
                                  <li key={item.id}>
                                    {item.description}
                                    {item.quantity > 1
                                      ? ` × ${item.quantity}`
                                      : ''}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                        <div className="customer-records__notes">
                          <div>
                            <strong>{t.serviceNotes}</strong>
                            <p>{serviceNotes || t.noNotes}</p>
                          </div>
                          {appointment.message && (
                            <div>
                              <strong>{t.customerMessage}</strong>
                              <p>{appointment.message}</p>
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
