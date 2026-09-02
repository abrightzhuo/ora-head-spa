import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarOff, Clock3, Save, Settings2 } from 'lucide-react'
import {
  supabase,
  type Product,
  type ScheduleBlock,
  type Service,
  type StaffProfile,
  type WeeklyAvailability,
} from '../../lib/supabase'
import {
  easternLocalDateTimeToIso,
  formatEasternDateTime,
} from '../../lib/dateTime'

type Props = {
  locale: 'zh' | 'en'
  staff: StaffProfile[]
  currentUserId: string
}

type BusinessSettings = {
  business_name: string
  timezone: string
  location: string
  slot_interval_minutes: number
  minimum_notice_minutes: number
  booking_window_days: number
  cancellation_policy: string | null
  currency: string
  tax_rate_bps: number
  pay_period_type: 'weekly' | 'biweekly' | 'semimonthly'
  pay_period_anchor: string
  tip_options: number[]
}

type StaffService = {
  staff_id: string
  service_id: string
  active: boolean
}

const weekdayLabels = {
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

export function OperationsSettings({ locale, staff, currentUserId }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [compensation, setCompensation] = useState<StaffProfile[]>(staff)
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [relations, setRelations] = useState<StaffService[]>([])
  const [availability, setAvailability] = useState<WeeklyAvailability[]>([])
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [blockStaffId, setBlockStaffId] = useState('')
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const copy =
    locale === 'zh'
      ? {
          title: '门店设置',
          note: '管理服务、价格、技师能力、排班和可预约规则。',
          bookingRules: '预约规则',
          finance: '财务与工资设置',
          taxRate: '销售税率（%）',
          payPeriod: '工资周期',
          weekly: '每周',
          biweekly: '双周',
          semimonthly: '每月两次',
          periodAnchor: '工资周期起始日',
          compensation: '员工时薪与提成',
          hourlyRate: '时薪（美元）',
          serviceCommission: '服务提成（%）',
          productCommission: '产品提成（%）',
          products: '产品',
          productName: '产品名称',
          addProduct: '添加产品',
          location: '门店地址',
          slot: '时间间隔（分钟）',
          notice: '最短提前时间（分钟）',
          window: '可提前预约天数',
          cancellation: '取消政策',
          services: '服务项目',
          englishName: '英文名称',
          chineseName: '中文名称',
          duration: '时长（分钟）',
          buffer: '清理/缓冲（分钟）',
          price: '价格（美元）',
          active: '启用',
          online: '开放在线预约',
          providerSkills: '技师可服务项目',
          schedule: '每周排班',
          selectProvider: '选择技师',
          closed: '休息',
          temporaryBlock: '临时关闭时间',
          wholeStore: '整间门店',
          starts: '开始时间',
          ends: '结束时间',
          reason: '原因',
          addBlock: '关闭该时段',
          save: '保存设置',
          saved: '设置已保存。',
          failed: '保存失败，请重试。',
          noProviders: '请先在人员账号中创建 Staff / Provider。',
        }
      : {
          title: 'Store Settings',
          note: 'Manage services, pricing, provider skills, schedules and booking rules.',
          bookingRules: 'Booking Rules',
          finance: 'Finance & Payroll',
          taxRate: 'Sales tax (%)',
          payPeriod: 'Pay period',
          weekly: 'Weekly',
          biweekly: 'Biweekly',
          semimonthly: 'Semimonthly',
          periodAnchor: 'Pay period start',
          compensation: 'Staff Compensation',
          hourlyRate: 'Hourly rate (USD)',
          serviceCommission: 'Service commission (%)',
          productCommission: 'Product commission (%)',
          products: 'Products',
          productName: 'Product name',
          addProduct: 'Add product',
          location: 'Location',
          slot: 'Slot interval (minutes)',
          notice: 'Minimum notice (minutes)',
          window: 'Booking window (days)',
          cancellation: 'Cancellation policy',
          services: 'Services',
          englishName: 'English name',
          chineseName: 'Chinese name',
          duration: 'Duration (minutes)',
          buffer: 'Cleanup / buffer (minutes)',
          price: 'Price (USD)',
          active: 'Active',
          online: 'Online booking',
          providerSkills: 'Provider Services',
          schedule: 'Weekly Schedule',
          selectProvider: 'Select provider',
          closed: 'Off',
          temporaryBlock: 'Temporary Closure',
          wholeStore: 'Entire store',
          starts: 'Starts',
          ends: 'Ends',
          reason: 'Reason',
          addBlock: 'Block this time',
          save: 'Save settings',
          saved: 'Settings saved.',
          failed: 'Unable to save. Please try again.',
          noProviders: 'Create a Staff / Provider account first.',
        }

  const providers = useMemo(
    () => staff.filter((profile) => profile.active && profile.role === 'staff'),
    [staff],
  )

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [settingsResult, servicesResult, productsResult, relationsResult, scheduleResult, blocksResult] =
      await Promise.all([
        supabase.from('business_settings').select('*').eq('id', true).single(),
        supabase.from('services').select('*').order('display_order'),
        supabase.from('products').select('*').order('name'),
        supabase.from('staff_services').select('*'),
        supabase.from('weekly_availability').select('*').order('weekday'),
        supabase
          .from('schedule_blocks')
          .select('*')
          .gte('ends_at', new Date().toISOString())
          .order('starts_at'),
      ])

    if (
      settingsResult.error ||
      servicesResult.error ||
      productsResult.error ||
      relationsResult.error ||
      scheduleResult.error ||
      blocksResult.error
    ) {
      setMessage(copy.failed)
    } else {
      setSettings(settingsResult.data as BusinessSettings)
      setServices((servicesResult.data ?? []) as Service[])
      setProducts((productsResult.data ?? []) as Product[])
      setCompensation(staff)
      setRelations((relationsResult.data ?? []) as StaffService[])
      setAvailability(
        (scheduleResult.data ?? []) as WeeklyAvailability[],
      )
      setBlocks((blocksResult.data ?? []) as ScheduleBlock[])
    }
    setLoading(false)
  }, [copy.failed, staff])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedStaffId && providers[0]) {
      setSelectedStaffId(providers[0].id)
    }
  }, [providers, selectedStaffId])

  const updateService = <K extends keyof Service>(
    id: string,
    field: K,
    value: Service[K],
  ) => {
    setServices((current) =>
      current.map((service) =>
        service.id === id ? { ...service, [field]: value } : service,
      ),
    )
  }

  const toggleRelation = (staffId: string, serviceId: string) => {
    setRelations((current) => {
      const exists = current.some(
        (item) =>
          item.staff_id === staffId &&
          item.service_id === serviceId &&
          item.active,
      )
      if (exists) {
        return current.filter(
          (item) =>
            !(item.staff_id === staffId && item.service_id === serviceId),
        )
      }
      return [...current, { staff_id: staffId, service_id: serviceId, active: true }]
    })
  }

  const scheduleFor = (weekday: number) =>
    availability.find(
      (item) =>
        item.staff_id === selectedStaffId &&
        item.weekday === weekday &&
        item.active,
    )

  const setScheduleDay = (
    weekday: number,
    field: 'active' | 'start_time' | 'end_time',
    value: boolean | string,
  ) => {
    setAvailability((current) => {
      const existing = current.find(
        (item) =>
          item.staff_id === selectedStaffId && item.weekday === weekday,
      )
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, [field]: value } : item,
        )
      }
      return [
        ...current,
        {
          id: crypto.randomUUID(),
          staff_id: selectedStaffId,
          weekday,
          start_time: '10:00',
          end_time: '21:00',
          active: field === 'active' ? Boolean(value) : true,
          [field]: value,
        },
      ]
    })
  }

  const save = async () => {
    if (!supabase || !settings) return
    setSaving(true)
    setMessage('')

    const settingsResult = await supabase
      .from('business_settings')
      .update({ ...settings, updated_by: currentUserId })
      .eq('id', true)

    const serviceResults = await Promise.all(
      services.map((service) =>
        supabase
          .from('services')
          .update({
            name: service.name,
            name_zh: service.name_zh,
            description: service.description,
            description_zh: service.description_zh,
            duration_minutes: service.duration_minutes,
            buffer_minutes: service.buffer_minutes,
            price_cents: service.price_cents,
            taxable: service.taxable,
            commissionable: service.commissionable,
            active: service.active,
            online_bookable:
              service.online_bookable && service.price_cents !== null,
          })
          .eq('id', service.id),
      ),
    )

    const productResult = await supabase.from('products').upsert(products)
    const compensationResults = await Promise.all(
      compensation.map((profile) =>
        supabase
          .from('staff_profiles')
          .update({
            hourly_rate_cents: profile.hourly_rate_cents,
            service_commission_bps: profile.service_commission_bps,
            product_commission_bps: profile.product_commission_bps,
          })
          .eq('id', profile.id),
      ),
    )

    const relationDelete = selectedStaffId
      ? await supabase
          .from('staff_services')
          .delete()
          .eq('staff_id', selectedStaffId)
      : { error: null }
    const selectedRelations = relations.filter(
      (item) => item.staff_id === selectedStaffId && item.active,
    )
    const relationInsert =
      selectedRelations.length > 0
        ? await supabase.from('staff_services').insert(selectedRelations)
        : { error: null }

    const scheduleDelete = selectedStaffId
      ? await supabase
          .from('weekly_availability')
          .delete()
          .eq('staff_id', selectedStaffId)
      : { error: null }
    const selectedSchedule = availability
      .filter((item) => item.staff_id === selectedStaffId && item.active)
      .map(({ staff_id, weekday, start_time, end_time }) => ({
        staff_id,
        weekday,
        start_time,
        end_time,
        active: true,
      }))
    const scheduleInsert =
      selectedSchedule.length > 0
        ? await supabase.from('weekly_availability').insert(selectedSchedule)
        : { error: null }

    const failed =
      settingsResult.error ||
      serviceResults.some((result) => result.error) ||
      productResult.error ||
      compensationResults.some((result) => result.error) ||
      relationDelete.error ||
      relationInsert.error ||
      scheduleDelete.error ||
      scheduleInsert.error
    setMessage(failed ? copy.failed : copy.saved)
    setSaving(false)
    if (!failed) void load()
  }

  const addBlock = async () => {
    if (!supabase || !blockStart || !blockEnd) return
    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert({
        staff_id: blockStaffId || null,
          starts_at: easternLocalDateTimeToIso(blockStart),
          ends_at: easternLocalDateTimeToIso(blockEnd),
        reason: blockReason || null,
        created_by: currentUserId,
      })
      .select('*')
      .single()

    if (error || !data) {
      setMessage(copy.failed)
      return
    }
    setBlocks((current) => [...current, data as ScheduleBlock])
    setBlockStart('')
    setBlockEnd('')
    setBlockReason('')
    setMessage(copy.saved)
  }

  if (loading || !settings) {
    return <section className="admin-panel operations-settings">...</section>
  }

  return (
    <section className="admin-panel operations-settings">
      <header>
        <div>
          <Settings2 size={20} />
          <div>
            <h2>{copy.title}</h2>
            <p>{copy.note}</p>
          </div>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving}>
          <Save size={16} />
          {copy.save}
        </button>
      </header>

      {message && <p className="operations-settings__message">{message}</p>}

      <div className="operations-settings__section">
        <h3>{copy.bookingRules}</h3>
        <div className="operations-settings__grid">
          <label>
            <span>{copy.location}</span>
            <input
              value={settings.location}
              onChange={(event) =>
                setSettings({ ...settings, location: event.target.value })
              }
            />
          </label>
          <label>
            <span>{copy.slot}</span>
            <input
              type="number"
              min={5}
              max={60}
              value={settings.slot_interval_minutes}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  slot_interval_minutes: Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            <span>{copy.notice}</span>
            <input
              type="number"
              min={0}
              value={settings.minimum_notice_minutes}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  minimum_notice_minutes: Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            <span>{copy.window}</span>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.booking_window_days}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  booking_window_days: Number(event.target.value),
                })
              }
            />
          </label>
        </div>
        <label>
          <span>{copy.cancellation}</span>
          <textarea
            rows={3}
            value={settings.cancellation_policy ?? ''}
            onChange={(event) =>
              setSettings({
                ...settings,
                cancellation_policy: event.target.value,
              })
            }
          />
        </label>
      </div>

      <div className="operations-settings__section">
        <h3>{copy.finance}</h3>
        <div className="operations-settings__grid">
          <label>
            <span>{copy.taxRate}</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={settings.tax_rate_bps / 100}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  tax_rate_bps: Math.round(Number(event.target.value) * 100),
                })
              }
            />
          </label>
          <label>
            <span>{copy.payPeriod}</span>
            <select
              value={settings.pay_period_type}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  pay_period_type: event.target
                    .value as BusinessSettings['pay_period_type'],
                })
              }
            >
              <option value="weekly">{copy.weekly}</option>
              <option value="biweekly">{copy.biweekly}</option>
              <option value="semimonthly">{copy.semimonthly}</option>
            </select>
          </label>
          <label>
            <span>{copy.periodAnchor}</span>
            <input
              type="date"
              value={settings.pay_period_anchor}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  pay_period_anchor: event.target.value,
                })
              }
            />
          </label>
        </div>
      </div>

      <div className="operations-settings__section">
        <h3>{copy.compensation}</h3>
        <div className="operations-compensation">
          {compensation
            .filter((profile) => profile.active)
            .map((profile) => (
              <article key={profile.id}>
                <strong>{profile.display_name}</strong>
                <label>
                  <span>{copy.hourlyRate}</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={profile.hourly_rate_cents / 100}
                    onChange={(event) =>
                      setCompensation((current) =>
                        current.map((item) =>
                          item.id === profile.id
                            ? {
                                ...item,
                                hourly_rate_cents: Math.round(
                                  Number(event.target.value) * 100,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  <span>{copy.serviceCommission}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={profile.service_commission_bps / 100}
                    onChange={(event) =>
                      setCompensation((current) =>
                        current.map((item) =>
                          item.id === profile.id
                            ? {
                                ...item,
                                service_commission_bps: Math.round(
                                  Number(event.target.value) * 100,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  <span>{copy.productCommission}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={profile.product_commission_bps / 100}
                    onChange={(event) =>
                      setCompensation((current) =>
                        current.map((item) =>
                          item.id === profile.id
                            ? {
                                ...item,
                                product_commission_bps: Math.round(
                                  Number(event.target.value) * 100,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              </article>
            ))}
        </div>
      </div>

      <div className="operations-settings__section">
        <h3>{copy.products}</h3>
        <div className="operations-products">
          {products.map((product) => (
            <article key={product.id}>
              <input
                aria-label={copy.productName}
                value={product.name}
                onChange={(event) =>
                  setProducts((current) =>
                    current.map((item) =>
                      item.id === product.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  )
                }
              />
              <input
                aria-label={copy.price}
                type="number"
                min={0}
                step="0.01"
                value={product.price_cents / 100}
                onChange={(event) =>
                  setProducts((current) =>
                    current.map((item) =>
                      item.id === product.id
                        ? {
                            ...item,
                            price_cents: Math.round(
                              Number(event.target.value) * 100,
                            ),
                          }
                        : item,
                    ),
                  )
                }
              />
              <label>
                <input
                  type="checkbox"
                  checked={product.active}
                  onChange={(event) =>
                    setProducts((current) =>
                      current.map((item) =>
                        item.id === product.id
                          ? { ...item, active: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                {copy.active}
              </label>
            </article>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setProducts((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                sku: null,
                name: '',
                price_cents: 0,
                taxable: true,
                commissionable: true,
                active: true,
              },
            ])
          }
        >
          {copy.addProduct}
        </button>
      </div>

      <div className="operations-settings__section">
        <h3>{copy.services}</h3>
        <div className="operations-services">
          {services.map((service) => (
            <article key={service.id}>
              <div className="operations-settings__grid">
                <label>
                  <span>{copy.englishName}</span>
                  <input
                    value={service.name}
                    onChange={(event) =>
                      updateService(service.id, 'name', event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>{copy.chineseName}</span>
                  <input
                    value={service.name_zh ?? ''}
                    onChange={(event) =>
                      updateService(service.id, 'name_zh', event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>{copy.duration}</span>
                  <input
                    type="number"
                    value={service.duration_minutes}
                    onChange={(event) =>
                      updateService(
                        service.id,
                        'duration_minutes',
                        Number(event.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  <span>{copy.buffer}</span>
                  <input
                    type="number"
                    value={service.buffer_minutes}
                    onChange={(event) =>
                      updateService(
                        service.id,
                        'buffer_minutes',
                        Number(event.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  <span>{copy.price}</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      service.price_cents === null
                        ? ''
                        : service.price_cents / 100
                    }
                    onChange={(event) =>
                      updateService(
                        service.id,
                        'price_cents',
                        event.target.value
                          ? Math.round(Number(event.target.value) * 100)
                          : null,
                      )
                    }
                  />
                </label>
              </div>
              <div className="operations-settings__checks">
                <label>
                  <input
                    type="checkbox"
                    checked={service.active}
                    onChange={(event) =>
                      updateService(service.id, 'active', event.target.checked)
                    }
                  />
                  {copy.active}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={service.online_bookable}
                    disabled={service.price_cents === null}
                    onChange={(event) =>
                      updateService(
                        service.id,
                        'online_bookable',
                        event.target.checked,
                      )
                    }
                  />
                  {copy.online}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={service.taxable}
                    onChange={(event) =>
                      updateService(service.id, 'taxable', event.target.checked)
                    }
                  />
                  Taxable
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={service.commissionable}
                    onChange={(event) =>
                      updateService(
                        service.id,
                        'commissionable',
                        event.target.checked,
                      )
                    }
                  />
                  Commissionable
                </label>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="operations-settings__section">
        <h3>{copy.providerSkills}</h3>
        {providers.length === 0 ? (
          <p>{copy.noProviders}</p>
        ) : (
          <>
            <select
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.display_name}
                </option>
              ))}
            </select>
            <div className="operations-settings__checks">
              {services.map((service) => (
                <label key={service.id}>
                  <input
                    type="checkbox"
                    checked={relations.some(
                      (item) =>
                        item.staff_id === selectedStaffId &&
                        item.service_id === service.id &&
                        item.active,
                    )}
                    onChange={() =>
                      toggleRelation(selectedStaffId, service.id)
                    }
                  />
                  {locale === 'zh'
                    ? service.name_zh || service.name
                    : service.name}
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedStaffId && (
        <div className="operations-settings__section">
          <h3>{copy.schedule}</h3>
          <div className="operations-schedule">
            {weekdayLabels[locale].map((label, weekday) => {
              const day = scheduleFor(weekday)
              return (
                <div key={label}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(day)}
                      onChange={(event) =>
                        setScheduleDay(weekday, 'active', event.target.checked)
                      }
                    />
                    {label}
                  </label>
                  {day ? (
                    <>
                      <input
                        type="time"
                        value={day.start_time.slice(0, 5)}
                        onChange={(event) =>
                          setScheduleDay(
                            weekday,
                            'start_time',
                            event.target.value,
                          )
                        }
                      />
                      <input
                        type="time"
                        value={day.end_time.slice(0, 5)}
                        onChange={(event) =>
                          setScheduleDay(
                            weekday,
                            'end_time',
                            event.target.value,
                          )
                        }
                      />
                    </>
                  ) : (
                    <span>{copy.closed}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="operations-settings__section">
        <h3>
          <CalendarOff size={17} />
          {copy.temporaryBlock}
        </h3>
        <div className="operations-settings__grid">
          <label>
            <span>{copy.selectProvider}</span>
            <select
              value={blockStaffId}
              onChange={(event) => setBlockStaffId(event.target.value)}
            >
              <option value="">{copy.wholeStore}</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.display_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{copy.starts}</span>
            <input
              type="datetime-local"
              value={blockStart}
              onChange={(event) => setBlockStart(event.target.value)}
            />
          </label>
          <label>
            <span>{copy.ends}</span>
            <input
              type="datetime-local"
              value={blockEnd}
              onChange={(event) => setBlockEnd(event.target.value)}
            />
          </label>
          <label>
            <span>{copy.reason}</span>
            <input
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
            />
          </label>
        </div>
        <button type="button" onClick={() => void addBlock()}>
          <Clock3 size={16} />
          {copy.addBlock}
        </button>
        {blocks.length > 0 && (
          <ul className="operations-blocks">
            {blocks.map((block) => (
              <li key={block.id}>
                <strong>
                  {block.staff_id
                    ? staff.find((item) => item.id === block.staff_id)
                        ?.display_name
                    : copy.wholeStore}
                </strong>
                <span>
                  {formatEasternDateTime(
                    block.starts_at,
                    locale === 'zh' ? 'zh-CN' : 'en-US',
                    { dateStyle: 'medium', timeStyle: 'short' },
                  )}
                  {' – '}
                  {formatEasternDateTime(
                    block.ends_at,
                    locale === 'zh' ? 'zh-CN' : 'en-US',
                    { dateStyle: 'medium', timeStyle: 'short' },
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
