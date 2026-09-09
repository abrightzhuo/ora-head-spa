import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Banknote,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Gift,
  LogOut,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import { AppointmentCalendar } from '../components/admin/AppointmentCalendar'
import { CheckoutManager } from '../components/admin/CheckoutManager'
import { CustomerRecordsPanel } from '../components/admin/CustomerRecordsPanel'
import { EarningsPanel } from '../components/admin/EarningsPanel'
import { GiftCardManager } from '../components/admin/GiftCardManager'
import { MembershipManager } from '../components/admin/MembershipManager'
import { OperationsSettings } from '../components/admin/OperationsSettings'
import { ProfilePanel } from '../components/admin/ProfilePanel'
import { ProviderProfilesManager } from '../components/admin/ProviderProfilesManager'
import { TimeClockPanel } from '../components/admin/TimeClockPanel'
import { BrandMark } from '../components/BrandMark'
import {
  formatDateKey,
  formatEasternDateTime,
} from '../lib/dateTime'
import {
  isSupabaseConfigured,
  supabase,
  type Appointment,
  type AppointmentChangeHistory,
  type AppointmentCharge,
  type AppointmentStatusHistory,
  type Checkout,
  type CheckoutItem,
  type Customer,
  type Membership,
  type OperatorAccountHistory,
  type Service,
  type StaffProfile,
} from '../lib/supabase'
import { copy } from '../localizedContent'

type AdminLocale = 'zh' | 'en'
type StatusFilter = 'all' | Appointment['status']
type SortField = 'created_at' | 'preferred_date'
type SortDirection = 'near' | 'far'
type AdminTab =
  | 'appointments'
  | 'customers'
  | 'checkout'
    | 'memberships'
  | 'giftcards'
  | 'timeclock'
  | 'earnings'
  | 'operators'
  | 'settings'
  | 'profile'

const appointmentStatuses: Appointment['status'][] = [
  'pending',
  'checked_in',
  'in_service',
  'completed',
  'checked_out',
  'cancelled_or_changed_outside_24h',
  'cancelled_or_changed_within_24h',
  'no_show_no_contact',
]

function chargeTypeForStatus(
  status: Appointment['status'],
): AppointmentCharge['charge_type'] | null {
  if (status === 'cancelled_or_changed_outside_24h') {
    return 'cancellation_outside_24h'
  }
  if (status === 'cancelled_or_changed_within_24h') {
    return 'late_cancellation'
  }
  if (status === 'no_show_no_contact') return 'no_show'
  return null
}

function chargePercentage(chargeType: AppointmentCharge['charge_type']) {
  if (chargeType === 'no_show') return 50
  if (chargeType === 'late_cancellation') return 15
  return 0
}

const adminCopy = {
  zh: {
    title: '预约管理',
    adminSystemTitle: '后台管理系统',
    tabs: {
      appointments: '预约管理',
      customers: '顾客档案',
      checkout: 'Checkout / 收款',
        memberships: '会员卡',
        giftcards: '礼品卡',
      timeclock: '考勤与审批',
      earnings: '收入统计',
      operators: '人员账号',
      settings: '门店设置',
      profile: '个人资料',
    },
    count: (count: number) => `共 ${count} 条预约`,
    logout: '退出',
    search: '搜索姓名、电话、项目或留言',
    refreshing: '刷新中',
    refresh: '刷新',
    allStatuses: '全部状态',
    sortBy: '排序依据',
    sortCreatedAt: '提交时间',
    sortPreferredDate: '期望日期',
    nearToFar: '由近至远',
    farToNear: '由远至近',
    updateError: '状态更新失败，请重试。',
      confirmStatusChange: (
        customer: string,
        fromStatus: string,
        toStatus: string,
        feeNote: string,
      ) =>
        `确认将 ${customer} 的预约状态从“${fromStatus}”更改为“${toStatus}”吗？${feeNote}`,
      statusFeeNotes: {
        cancellation_outside_24h: '此状态对应免收费用，需另行确认费用处理。',
        late_cancellation: '此状态对应 15% 取消费用，需另行点击收费。',
        no_show: '此状态对应 50% 未到店费用，需另行点击收费。',
      },
    accessError: '此账号没有后台访问权限，请联系管理员。',
    loading: '正在加载...',
    loginNote: '请使用店主、经理、前台或员工账号登录。',
    email: '邮箱',
    password: '密码',
    signingIn: '正在登录...',
    signIn: '登录',
    authError: '邮箱或密码不正确。',
    dataError: '读取预约失败，请检查数据库权限后重试。',
    setupTitle: 'Supabase 尚未配置',
    setupNote: '请在本地和 Vercel 中设置以下环境变量，然后重新构建网站。',
    emptyTitle: '还没有预约',
    emptyNote: '顾客提交预约后会显示在这里。',
    noMatchTitle: '没有匹配的预约',
    noMatchNote: '请尝试其他搜索关键词。',
    roles: {
      owner: '店主',
      manager: '经理',
      front_desk: '前台',
      staff: '员工/技师',
    },
    operatorTitle: '人员账号',
    operatorNote: '店主和经理可按岗位创建后台账号。',
    operatorName: '姓名',
    operatorEmail: '邮箱',
    accountRole: '账号类型',
    temporaryPassword: '临时密码（至少 8 位）',
    createOperator: '创建账号',
    creatingOperator: '正在创建...',
    operatorCreated: '账号已创建。',
      operatorDeleted: '账号已删除。',
      deleteOperator: '删除',
      deletingOperator: '删除中...',
      deleteConfirm: (name: string) =>
        `确定删除账号“${name}”吗？删除后该账号将无法登录，历史操作记录会继续保留。`,
      accountActions: {
        created: '创建账号',
        deleted: '删除账号',
      },
      activeAccount: '使用中',
      inactiveAccount: '已删除',
      noOperators: '尚未创建其他账号。',
    operatorErrors: {
      invalid_input: '请填写有效邮箱、姓名和至少 8 位密码。',
      email_exists: '该邮箱已注册。',
      manager_required: '只有店主或经理可以管理账号。',
      role_forbidden: '当前账号无权管理该角色。',
      server_not_configured: '服务器账号服务尚未配置。',
      create_failed: '账号创建失败，请重试。',
      profile_create_failed: '账号资料创建失败，请重试。',
        audit_failed: '账号操作记录写入失败，请重试。',
        delete_failed: '账号删除失败，请重试。',
        operator_not_found: '未找到该账号。',
        operator_inactive: '该账号已删除。',
        self_delete_forbidden: '不能删除当前登录账号。',
        last_owner_forbidden: '不能删除最后一个有效店主账号。',
      unauthorized: '登录已失效，请重新登录。',
      unknown: '账号创建失败，请重试。',
    },
    columns: {
      createdAt: '提交时间',
      customer: '顾客',
      phone: '联系电话',
      service: '预约项目',
        date: '预约时间',
        provider: '技师',
      message: '留言',
      status: '状态',
        fee: '费用处理',
      changedBy: '操作记录',
    },
    statuses: {
      pending: '已预约',
      checked_in: '已到店',
      in_service: '服务中',
      completed: '已完成',
      checked_out: '已结账',
      cancelled_or_changed_outside_24h: '提前24小时以上取消或更改',
      cancelled_or_changed_within_24h: '24小时内取消或更改',
      no_show_no_contact: '未到店且未提前联系',
    },
  },
  en: {
    title: 'Booking Management',
    adminSystemTitle: 'Admin Management System',
    tabs: {
      appointments: 'Bookings',
      customers: 'Customers',
      checkout: 'Checkout',
        memberships: 'Memberships',
        giftcards: 'Gift Cards',
      timeclock: 'Time Clock',
      earnings: 'Earnings',
      operators: 'Staff accounts',
      settings: 'Store settings',
      profile: 'My Profile',
    },
    count: (count: number) => `${count} ${count === 1 ? 'booking' : 'bookings'}`,
    logout: 'Log out',
    search: 'Search name, phone, ritual or message',
    refreshing: 'Refreshing',
    refresh: 'Refresh',
    allStatuses: 'All statuses',
    sortBy: 'Sort by',
    sortCreatedAt: 'Submitted time',
    sortPreferredDate: 'Preferred date',
    nearToFar: 'Near to far',
    farToNear: 'Far to near',
    updateError: 'Unable to update the status. Please try again.',
      confirmStatusChange: (
        customer: string,
        fromStatus: string,
        toStatus: string,
        feeNote: string,
      ) =>
        `Change ${customer}'s appointment status from "${fromStatus}" to "${toStatus}"?${feeNote}`,
      statusFeeNotes: {
        cancellation_outside_24h:
          ' This outcome has no fee and requires a separate confirmation.',
        late_cancellation:
          ' This outcome has a 15% fee that must be charged separately.',
        no_show:
          ' This outcome has a 50% fee that must be charged separately.',
      },
    accessError: 'This account does not have management access. Contact an administrator.',
    loading: 'Loading...',
    loginNote: 'Sign in with an owner, manager, front desk or staff account.',
    email: 'Email',
    password: 'Password',
    signingIn: 'Signing in...',
    signIn: 'Sign in',
    authError: 'Incorrect email or password.',
    dataError: 'Unable to load bookings. Check database permissions and try again.',
    setupTitle: 'Supabase is not configured',
    setupNote: 'Set the following environment variables locally and in Vercel, then rebuild the website.',
    emptyTitle: 'No bookings yet',
    emptyNote: 'Customer bookings will appear here after submission.',
    noMatchTitle: 'No matching bookings',
    noMatchNote: 'Try a different search term.',
    roles: {
      owner: 'Owner',
      manager: 'Manager',
      front_desk: 'Front Desk',
      staff: 'Staff / Provider',
    },
    operatorTitle: 'Staff accounts',
    operatorNote: 'Owners and managers can create role-based staff accounts.',
    operatorName: 'Name',
    operatorEmail: 'Email',
    accountRole: 'Account type',
    temporaryPassword: 'Temporary password (8+ characters)',
    createOperator: 'Create account',
    creatingOperator: 'Creating...',
    operatorCreated: 'Account created.',
      operatorDeleted: 'Account deleted.',
      deleteOperator: 'Delete',
      deletingOperator: 'Deleting...',
      deleteConfirm: (name: string) =>
        `Delete account "${name}"? The account will no longer be able to sign in, while its activity history remains available.`,
      accountActions: {
        created: 'Account created',
        deleted: 'Account deleted',
      },
      activeAccount: 'Active',
      inactiveAccount: 'Deleted',
      noOperators: 'No other accounts yet.',
    operatorErrors: {
      invalid_input: 'Enter a valid email, name and password of at least 8 characters.',
      email_exists: 'This email is already registered.',
      manager_required: 'Only owners and managers can manage accounts.',
      role_forbidden: 'This account cannot manage the selected role.',
      server_not_configured: 'The server account service is not configured.',
      create_failed: 'Unable to create the account. Please try again.',
      profile_create_failed: 'Unable to create the account profile. Please try again.',
        audit_failed: 'Unable to save the account activity. Please try again.',
        delete_failed: 'Unable to delete the account. Please try again.',
        operator_not_found: 'The account was not found.',
        operator_inactive: 'The account has already been deleted.',
        self_delete_forbidden: 'You cannot delete the account currently signed in.',
        last_owner_forbidden: 'The last active owner account cannot be deleted.',
      unauthorized: 'Your session has expired. Please sign in again.',
      unknown: 'Unable to create the account. Please try again.',
    },
    columns: {
      createdAt: 'Submitted',
      customer: 'Customer',
      phone: 'Phone',
      service: 'Ritual',
        date: 'Appointment time',
        provider: 'Provider',
      message: 'Message',
      status: 'Status',
        fee: 'Fee',
      changedBy: 'Activity history',
    },
    statuses: {
      pending: 'Booked',
      checked_in: 'Checked In',
      in_service: 'In Service',
      completed: 'Completed',
      checked_out: 'Checked Out',
      cancelled_or_changed_outside_24h: 'Cancelled/changed over 24h',
      cancelled_or_changed_within_24h: 'Cancelled/changed within 24h',
      no_show_no_contact: 'No-show without notice',
    },
  },
}

type OperatorErrorCode = keyof (typeof adminCopy)['zh']['operatorErrors']

function getInitialLocale(): AdminLocale {
  const savedLocale = localStorage.getItem('ora-admin-locale')
  return savedLocale === 'en' ? 'en' : 'zh'
}

function formatDate(value: string, locale: AdminLocale) {
  return formatDateKey(value, locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatDateTime(value: string, locale: AdminLocale) {
  return formatEasternDateTime(value, locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAppointmentTime(
  appointment: Appointment,
  locale: AdminLocale,
) {
  if (!appointment.starts_at) {
    return formatDate(appointment.preferred_date, locale)
  }

  const displayLocale = locale === 'zh' ? 'zh-CN' : 'en-US'
  const date = formatEasternDateTime(appointment.starts_at, displayLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const start = formatEasternDateTime(appointment.starts_at, displayLocale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  const end = appointment.ends_at
    ? formatEasternDateTime(appointment.ends_at, displayLocale, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return `${date} ${start}${end ? ` - ${end}` : ''}`
}

function formatService(value: string, locale: AdminLocale) {
  for (const localeCopy of Object.values(copy)) {
    const serviceIndex = localeCopy.services.items.findIndex(
      (service) => service.title === value || service.english === value,
    )

    if (serviceIndex >= 0) {
      return copy[locale].services.items[serviceIndex]?.title ?? value
    }
  }

  return value
}

export default function Admin() {
  const [locale, setLocale] = useState<AdminLocale>(getInitialLocale)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentCharges, setAppointmentCharges] = useState<AppointmentCharge[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
    const [memberships, setMemberships] = useState<Membership[]>([])
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [statusHistory, setStatusHistory] = useState<AppointmentStatusHistory[]>([])
  const [appointmentChangeHistory, setAppointmentChangeHistory] = useState<
    AppointmentChangeHistory[]
  >([])
  const [operatorHistory, setOperatorHistory] = useState<OperatorAccountHistory[]>([])
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([])
  const [currentProfile, setCurrentProfile] = useState<StaffProfile | null>(null)
  const [profileReady, setProfileReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dataError, setDataError] = useState(false)
  const [accessError, setAccessError] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('near')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [chargingId, setChargingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState(false)
  const [operatorName, setOperatorName] = useState('')
  const [operatorEmail, setOperatorEmail] = useState('')
  const [operatorPassword, setOperatorPassword] = useState('')
  const [accountRole, setAccountRole] = useState<StaffProfile['role']>('staff')
  const [creatingOperator, setCreatingOperator] = useState(false)
  const [operatorError, setOperatorError] = useState<OperatorErrorCode | null>(null)
  const [operatorCreated, setOperatorCreated] = useState(false)
  const [operatorDeleted, setOperatorDeleted] = useState(false)
  const [deletingOperatorId, setDeletingOperatorId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('appointments')
  const t = adminCopy[locale]
  const canManageStaff =
    currentProfile?.role === 'owner' || currentProfile?.role === 'manager'
  const canCheckout = currentProfile?.role !== 'staff'

  const changeLocale = (nextLocale: AdminLocale) => {
    localStorage.setItem('ora-admin-locale', nextLocale)
    document.documentElement.lang = nextLocale === 'zh' ? 'zh-CN' : 'en'
    setLocale(nextLocale)
  }

  const languageSwitch = (
    <div className="admin-language" aria-label="Language">
      <button
        className={locale === 'zh' ? 'is-active' : ''}
        type="button"
        onClick={() => changeLocale('zh')}
        aria-pressed={locale === 'zh'}
      >
        中文
      </button>
      <button
        className={locale === 'en' ? 'is-active' : ''}
        type="button"
        onClick={() => changeLocale('en')}
        aria-pressed={locale === 'en'}
      >
        English
      </button>
    </div>
  )

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const loadAppointments = useCallback(async () => {
    if (!supabase || !session) return

    setLoading(true)
    setProfileReady(false)
    setDataError(false)
    setAccessError(false)
    try {
      const profileResult = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      const profile = profileResult.data as StaffProfile | null

      if (profileResult.error || !profile || !profile.active) {
        setCurrentProfile(null)
        setAccessError(true)
        return
      }

      const canReadAccountHistory =
        profile.role === 'owner' || profile.role === 'manager'
      const [
        appointmentsResult,
        appointmentChargesResult,
        customersResult,
          membershipsResult,
        checkoutsResult,
        checkoutItemsResult,
        servicesResult,
        profilesResult,
        historyResult,
        changeHistoryResult,
        operatorHistoryResult,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false }),
        profile.role !== 'staff'
          ? supabase
              .from('appointment_charges')
              .select('*')
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('customers')
          .select('*')
          .order('updated_at', { ascending: false }),
          supabase
            .from('memberships')
            .select('*')
            .order('created_at', { ascending: false }),
        supabase
          .from('checkouts')
          .select('*')
          .order('opened_at', { ascending: false }),
        supabase
          .from('checkout_items')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('services')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('staff_profiles')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('appointment_status_history')
          .select('*')
          .order('changed_at', { ascending: false }),
        supabase
          .from('appointment_change_history')
          .select('*')
          .order('acted_at', { ascending: false }),
        canReadAccountHistory
          ? supabase
              .from('operator_account_history')
              .select('*')
              .order('acted_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ])

      if (
        appointmentsResult.error ||
        appointmentChargesResult.error ||
        customersResult.error ||
          membershipsResult.error ||
        checkoutsResult.error ||
        checkoutItemsResult.error ||
        servicesResult.error ||
        profilesResult.error ||
        historyResult.error ||
        changeHistoryResult.error ||
        operatorHistoryResult.error
      ) {
        setDataError(true)
      } else {
        setCurrentProfile(profile)
        setStaffProfiles((profilesResult.data ?? []) as StaffProfile[])
        setAppointments((appointmentsResult.data ?? []) as Appointment[])
        setAppointmentCharges(
          (appointmentChargesResult.data ?? []) as AppointmentCharge[],
        )
        setCustomers((customersResult.data ?? []) as Customer[])
          setMemberships((membershipsResult.data ?? []) as Membership[])
        setCheckouts((checkoutsResult.data ?? []) as Checkout[])
        setCheckoutItems(
          (checkoutItemsResult.data ?? []) as CheckoutItem[],
        )
        setServices((servicesResult.data ?? []) as Service[])
        setStatusHistory(
          (historyResult.data ?? []) as AppointmentStatusHistory[],
        )
        setAppointmentChangeHistory(
          (changeHistoryResult.data ?? []) as AppointmentChangeHistory[],
        )
        setOperatorHistory(
          (operatorHistoryResult.data ?? []) as OperatorAccountHistory[],
        )
      }
    } catch {
      setDataError(true)
    } finally {
      setLoading(false)
      setProfileReady(true)
    }
  }, [session])

  useEffect(() => {
    if (session) void loadAppointments()
  }, [session, loadAppointments])

  const staffById = useMemo(
    () => new Map(staffProfiles.map((profile) => [profile.id, profile])),
    [staffProfiles],
  )
  const staffAccounts = useMemo(
    () =>
      [...staffProfiles].sort((left, right) =>
        left.created_at.localeCompare(right.created_at),
      ),
    [staffProfiles],
  )
  const operatorHistoryById = useMemo(() => {
    const grouped = new Map<string, OperatorAccountHistory[]>()

    operatorHistory.forEach((entry) => {
      const entries = grouped.get(entry.operator_id) ?? []
      entries.push(entry)
      grouped.set(entry.operator_id, entries)
    })

    return grouped
  }, [operatorHistory])
  const historyByAppointment = useMemo(() => {
    const grouped = new Map<string, AppointmentStatusHistory[]>()

    statusHistory.forEach((entry) => {
      const entries = grouped.get(entry.appointment_id) ?? []
      entries.push(entry)
      grouped.set(entry.appointment_id, entries)
    })

    return grouped
  }, [statusHistory])
  const chargeByAppointment = useMemo(
    () =>
      new Map(
        appointmentCharges.map((charge) => [
          `${charge.appointment_id}:${charge.charge_type}`,
          charge,
        ]),
      ),
    [appointmentCharges],
  )

  const displayedAppointments = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase()
    const filtered = appointments.filter((appointment) => {
      if (statusFilter !== 'all' && appointment.status !== statusFilter) {
        return false
      }

      if (!keyword) return true

      return [
        appointment.customer_name,
        appointment.phone,
        appointment.service,
        formatService(appointment.service, locale),
          appointment.provider_id
            ? staffById.get(appointment.provider_id)?.display_name ?? ''
            : '',
        appointment.message ?? '',
        appointment.status,
        t.statuses[appointment.status],
        appointment.status_changed_by
          ? staffById.get(appointment.status_changed_by)?.display_name ?? ''
          : '',
      ].some((value) => value.toLocaleLowerCase().includes(keyword))
    })

    return filtered.sort((left, right) => {
      const leftValue = new Date(
        sortField === 'created_at'
          ? left.created_at
          : `${left.preferred_date}T12:00:00`,
      ).getTime()
      const rightValue = new Date(
        sortField === 'created_at'
          ? right.created_at
          : `${right.preferred_date}T12:00:00`,
      ).getTime()
      const chronological = leftValue - rightValue
      const nearFirst =
        sortField === 'created_at' ? -chronological : chronological

      return sortDirection === 'near' ? nearFirst : -nearFirst
    })
  }, [
    appointments,
    locale,
    query,
    sortDirection,
    sortField,
    staffById,
    statusFilter,
    t.statuses,
  ])

  const updateStatus = async (
    appointment: Appointment,
    status: Appointment['status'],
  ) => {
    if (!supabase || status === appointment.status) return

    const chargeType = chargeTypeForStatus(status)
    const feeNote = chargeType ? t.statusFeeNotes[chargeType] : ''
    const confirmation = t.confirmStatusChange(
      appointment.customer_name,
      t.statuses[appointment.status],
      t.statuses[status],
      feeNote,
    )
    if (!window.confirm(confirmation)) return

    setUpdatingId(appointment.id)
    setUpdateError(false)
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointment.id)
      .select('status, status_changed_by, status_changed_at')
      .single()

    if (error || !data) {
      setUpdateError(true)
    } else {
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id
            ? {
                ...item,
                status: data.status as Appointment['status'],
                status_changed_by: data.status_changed_by,
                status_changed_at: data.status_changed_at,
              }
            : item,
        ),
      )

      const { data: historyEntry, error: historyError } = await supabase
        .from('appointment_status_history')
        .select('*')
        .eq('appointment_id', appointment.id)
        .order('changed_at', { ascending: false })
        .limit(1)
        .single()

      if (historyError || !historyEntry) {
        setUpdateError(true)
      } else {
        setStatusHistory((current) => [
          historyEntry as AppointmentStatusHistory,
          ...current.filter((entry) => entry.id !== historyEntry.id),
        ])
      }
    }
    setUpdatingId(null)
  }

  const chargeAppointmentFee = async (
    appointment: Appointment,
    chargeType: AppointmentCharge['charge_type'],
  ) => {
    if (!session || !appointment.service_price_cents) return

    const percentage = chargePercentage(chargeType)
    const amount = (
      Math.round(appointment.service_price_cents * percentage / 100) / 100
    ).toFixed(2)
    const description =
      chargeType === 'no_show'
        ? locale === 'zh'
          ? 'No-show 费用'
          : 'no-show fee'
        : chargeType === 'cancellation_outside_24h'
          ? locale === 'zh'
            ? '提前取消/更改免收费用记录'
            : 'no-fee cancellation/change record'
        : locale === 'zh'
          ? '临时取消费用'
          : 'late cancellation fee'
    const confirmation =
      locale === 'zh'
        ? percentage === 0
          ? `确认将 ${appointment.customer_name} 的预约记录为“提前24小时以上取消或更改”，免收费用？`
          : `确认向 ${appointment.customer_name} 尾号 ${appointment.card_last_four ?? '未知'} 的卡收取 $${amount} ${description}？`
        : percentage === 0
          ? `Record ${appointment.customer_name}'s cancellation/change as no fee?`
          : `Charge $${amount} ${description} to ${appointment.customer_name}'s card ending ${appointment.card_last_four ?? 'unknown'}?`

    if (!window.confirm(confirmation)) return

    setChargingId(appointment.id)
    setUpdateError(false)
    try {
      const response = await fetch('/api/booking-fees', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          chargeType,
        }),
      })
      const result = (await response.json()) as {
        charge?: AppointmentCharge
      }

      if (!response.ok || !result.charge) {
        setUpdateError(true)
        return
      }

      setAppointmentCharges((current) => [
        result.charge as AppointmentCharge,
        ...current.filter((charge) => charge.id !== result.charge?.id),
      ])
    } catch {
      setUpdateError(true)
    } finally {
      setChargingId(null)
    }
  }

  const createOperator = async (event: FormEvent) => {
    event.preventDefault()
    if (!session || !canManageStaff) return

    setOperatorError(null)
    setOperatorCreated(false)
    setOperatorDeleted(false)
    if (
      !operatorName.trim() ||
      !operatorEmail.includes('@') ||
      operatorPassword.length < 8
    ) {
      setOperatorError('invalid_input')
      return
    }

    setCreatingOperator(true)
    try {
      const response = await fetch('/api/operators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          displayName: operatorName,
          email: operatorEmail,
          password: operatorPassword,
          role: accountRole,
        }),
      })
      const result = await response.json() as {
        operator?: StaffProfile
          audit?: OperatorAccountHistory
        error?: OperatorErrorCode
      }

        if (!response.ok || !result.operator || !result.audit) {
        setOperatorError(result.error ?? 'unknown')
        return
      }

      setStaffProfiles((current) => [...current, result.operator as StaffProfile])
        setOperatorHistory((current) => [
          result.audit as OperatorAccountHistory,
          ...current,
        ])
      setOperatorName('')
      setOperatorEmail('')
      setOperatorPassword('')
      setAccountRole('staff')
      setOperatorCreated(true)
    } catch {
      setOperatorError('unknown')
    } finally {
      setCreatingOperator(false)
    }
  }

  const deleteOperator = async (operator: StaffProfile) => {
    if (
      !session ||
      !canManageStaff ||
      !operator.active ||
      !window.confirm(t.deleteConfirm(operator.display_name))
    ) {
      return
    }

    setOperatorError(null)
    setOperatorCreated(false)
    setOperatorDeleted(false)
    setDeletingOperatorId(operator.id)

    try {
      const response = await fetch('/api/operators', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ operatorId: operator.id }),
      })
      const result = await response.json() as {
        operator?: StaffProfile
        audit?: OperatorAccountHistory
        error?: OperatorErrorCode
      }

      if (!response.ok || !result.operator || !result.audit) {
        setOperatorError(result.error ?? 'unknown')
        return
      }

      setStaffProfiles((current) =>
        current.map((profile) =>
          profile.id === operator.id
            ? result.operator as StaffProfile
            : profile,
        ),
      )
      setOperatorHistory((current) => [
        result.audit as OperatorAccountHistory,
        ...current,
      ])
      setOperatorDeleted(true)
    } catch {
      setOperatorError('unknown')
    } finally {
      setDeletingOperatorId(null)
    }
  }

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return

    setSigningIn(true)
    setAuthError(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(true)
    setSigningIn(false)
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="admin-page admin-page--centered">
        {languageSwitch}
        <section className="admin-panel admin-setup">
          <p className="admin-kicker">ORA ADMIN</p>
          <h1>{t.setupTitle}</h1>
          <p>{t.setupNote}</p>
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_ANON_KEY</code>
        </section>
      </main>
    )
  }

  if (!authReady) {
    return <main className="admin-page admin-page--centered">{languageSwitch}<p>{t.loading}</p></main>
  }

  if (!session) {
    return (
      <main className="admin-page admin-page--centered">
        {languageSwitch}
        <form className="admin-panel admin-login" onSubmit={signIn}>
          <p className="admin-kicker">ORA ADMIN</p>
          <h1>{t.title}</h1>
          <p>{t.loginNote}</p>
          <label>
            <span>{t.email}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span>{t.password}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {authError && <p className="admin-error" role="alert">{t.authError}</p>}
          <button className="button button--gold" type="submit" disabled={signingIn}>
            {signingIn ? t.signingIn : t.signIn}
          </button>
        </form>
      </main>
    )
  }

  if (!profileReady) {
    return (
      <main className="admin-page admin-page--centered">
        {languageSwitch}
        <p>{t.loading}</p>
      </main>
    )
  }

  if (!currentProfile) {
    return (
      <main className="admin-page admin-page--centered">
        {languageSwitch}
        <section className="admin-panel admin-setup">
          <p className="admin-kicker">ORA ADMIN</p>
          <h1>{t.title}</h1>
          <p className="admin-error" role="alert">
            {accessError ? t.accessError : t.dataError}
          </p>
          <button
            className="button button--gold"
            type="button"
            onClick={() => void supabase?.auth.signOut()}
          >
            {t.logout}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header admin-header--compact">
        <div className="admin-header__brand">
          <BrandMark compact href="/" />
          <span>{t.adminSystemTitle}</span>
        </div>
        <div className="admin-header__actions">
          {languageSwitch}
          <span className="admin-user">
            <strong>{currentProfile.display_name}</strong>
            <small>
              {t.roles[currentProfile.role]} · {session.user.email}
            </small>
          </span>
          <button type="button" onClick={() => void supabase?.auth.signOut()}>
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label={t.title}>
          <button
            className={activeTab === 'appointments' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('appointments')}
            aria-pressed={activeTab === 'appointments'}
          >
            <CalendarDays size={17} />
            {t.tabs.appointments}
          </button>
          <button
            className={activeTab === 'customers' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('customers')}
            aria-pressed={activeTab === 'customers'}
          >
            <UserRound size={17} />
            {t.tabs.customers}
          </button>
          <button
            className={activeTab === 'memberships' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('memberships')}
            aria-pressed={activeTab === 'memberships'}
          >
            <BadgeCheck size={17} />
            {t.tabs.memberships}
          </button>
          {canCheckout && (
            <>
              <button
                className={activeTab === 'checkout' ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveTab('checkout')}
                aria-pressed={activeTab === 'checkout'}
              >
                <ReceiptText size={17} />
                {t.tabs.checkout}
              </button>
                {canManageStaff && (
                  <button
                    className={activeTab === 'giftcards' ? 'is-active' : ''}
                    type="button"
                    onClick={() => setActiveTab('giftcards')}
                    aria-pressed={activeTab === 'giftcards'}
                  >
                    <Gift size={17} />
                    {t.tabs.giftcards}
                  </button>
                )}
            </>
          )}
          <button
            className={activeTab === 'timeclock' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('timeclock')}
            aria-pressed={activeTab === 'timeclock'}
          >
            <Clock3 size={17} />
            {t.tabs.timeclock}
          </button>
          <button
            className={activeTab === 'earnings' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('earnings')}
            aria-pressed={activeTab === 'earnings'}
          >
            <Banknote size={17} />
            {t.tabs.earnings}
          </button>
          {canManageStaff && (
            <>
          <button
            className={activeTab === 'operators' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('operators')}
            aria-pressed={activeTab === 'operators'}
          >
            <Users size={17} />
            {t.tabs.operators}
          </button>
          <button
            className={activeTab === 'settings' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('settings')}
            aria-pressed={activeTab === 'settings'}
          >
            <Settings2 size={17} />
            {t.tabs.settings}
          </button>
            </>
          )}
          <button
            className={activeTab === 'profile' ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab('profile')}
            aria-pressed={activeTab === 'profile'}
          >
            <UserRound size={17} />
            {t.tabs.profile}
          </button>
        </nav>

      {canManageStaff && activeTab === 'operators' && (
        <section className="admin-panel admin-operators">
          <div className="admin-operators__heading">
            <div>
              <Users size={20} />
              <div>
                <h2>{t.operatorTitle}</h2>
                <p>{t.operatorNote}</p>
              </div>
            </div>
          </div>
          <form className="admin-operator-form" onSubmit={createOperator}>
            <label>
              <span>{t.operatorName}</span>
              <input
                type="text"
                value={operatorName}
                onChange={(event) => setOperatorName(event.target.value)}
                autoComplete="off"
                maxLength={80}
                required
              />
            </label>
            <label>
              <span>{t.operatorEmail}</span>
              <input
                type="email"
                value={operatorEmail}
                onChange={(event) => setOperatorEmail(event.target.value)}
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>{t.accountRole}</span>
              <select
                value={accountRole}
                onChange={(event) =>
                  setAccountRole(event.target.value as StaffProfile['role'])
                }
              >
                <option value="staff">{t.roles.staff}</option>
                <option value="front_desk">{t.roles.front_desk}</option>
                <option value="manager">{t.roles.manager}</option>
                {currentProfile.role === 'owner' && (
                  <option value="owner">{t.roles.owner}</option>
                )}
              </select>
            </label>
            <label>
              <span>{t.temporaryPassword}</span>
              <input
                type="password"
                value={operatorPassword}
                onChange={(event) => setOperatorPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button type="submit" disabled={creatingOperator}>
              <UserPlus size={16} />
              {creatingOperator ? t.creatingOperator : t.createOperator}
            </button>
          </form>
          {operatorError && (
            <p className="admin-error" role="alert">
              {t.operatorErrors[operatorError]}
            </p>
          )}
          {operatorCreated && (
            <p className="admin-success" role="status">{t.operatorCreated}</p>
          )}
          {operatorDeleted && (
            <p className="admin-success" role="status">{t.operatorDeleted}</p>
          )}
          <ProviderProfilesManager
            locale={locale}
            staff={staffProfiles}
            onProfileUpdated={(profile) =>
              setStaffProfiles((current) =>
                current.map((item) =>
                  item.id === profile.id ? profile : item,
                ),
              )
            }
          />
          <div className="admin-operator-list">
            {staffAccounts.length === 0 ? (
              <p>{t.noOperators}</p>
            ) : (
              staffAccounts.map((operator) => {
                const history = operatorHistoryById.get(operator.id) ?? []

                return (
                  <article key={operator.id}>
                    <div className="admin-operator-list__identity">
                      <span>{operator.display_name}</span>
                      <small>{operator.email}</small>
                      <small>{t.roles[operator.role]}</small>
                    </div>
                    <em className={operator.active ? 'is-active' : ''}>
                      {operator.active ? t.activeAccount : t.inactiveAccount}
                    </em>
                    {operator.active && operator.id !== currentProfile?.id && (
                      <button
                        className="admin-operator-list__delete"
                        type="button"
                        onClick={() => void deleteOperator(operator)}
                        disabled={deletingOperatorId === operator.id}
                      >
                        <Trash2 size={14} />
                        {deletingOperatorId === operator.id
                          ? t.deletingOperator
                          : t.deleteOperator}
                      </button>
                    )}
                    <ol className="admin-account-history">
                      {history.map((entry) => {
                        const actor = staffById.get(entry.acted_by)

                        return (
                          <li key={entry.id}>
                            <strong>{t.accountActions[entry.action]}</strong>
                            <span>{actor?.display_name ?? actor?.email ?? '—'}</span>
                            <small>{formatDateTime(entry.acted_at, locale)}</small>
                          </li>
                        )
                      })}
                    </ol>
                  </article>
                )
              })
            )}
          </div>
        </section>
      )}

      {canManageStaff && activeTab === 'settings' && (
        <OperationsSettings
          locale={locale}
          staff={staffProfiles}
          currentUserId={currentProfile.id}
        />
      )}

      {activeTab === 'customers' && (
        <CustomerRecordsPanel
          locale={locale}
          customers={customers}
          appointments={appointments}
          staff={staffProfiles}
          services={services}
          checkouts={checkouts}
          checkoutItems={checkoutItems}
          session={session}
          onWalkInCreated={(appointment) =>
            setAppointments((current) => [appointment, ...current])
          }
        />
      )}

      {canCheckout && activeTab === 'checkout' && (
        <CheckoutManager
          appointments={appointments}
          staff={staffProfiles}
          session={session}
          locale={locale}
          onCompleted={() => void loadAppointments()}
        />
      )}

        {canManageStaff && activeTab === 'giftcards' && (
          <GiftCardManager session={session} locale={locale} />
        )}

      {activeTab === 'memberships' && (
        <MembershipManager
          locale={locale}
          memberships={memberships}
          customers={customers}
        />
      )}

      {activeTab === 'timeclock' && (
        <TimeClockPanel
          locale={locale}
          currentProfile={currentProfile}
          staff={staffProfiles}
        />
      )}

      {activeTab === 'earnings' && (
        <EarningsPanel
          locale={locale}
          currentProfile={currentProfile}
          staff={staffProfiles}
        />
      )}

      {activeTab === 'profile' && (
        <ProfilePanel
          locale={locale}
          profile={currentProfile}
          email={session.user.email ?? currentProfile.email}
          roleLabel={t.roles[currentProfile.role]}
          onProfileUpdated={(profile) => {
            setCurrentProfile(profile)
            setStaffProfiles((current) =>
              current.map((item) => (item.id === profile.id ? profile : item)),
            )
          }}
        />
      )}

      {activeTab === 'appointments' && (
        <>
          <AppointmentCalendar
            appointments={appointments}
            customers={customers}
            services={services}
            staff={staffProfiles}
            session={session}
            locale={locale}
            currentProfile={currentProfile}
            changeHistory={appointmentChangeHistory}
            onStatusChange={(appointment, status) =>
              void updateStatus(appointment, status)
            }
            onAppointmentSaved={() => void loadAppointments()}
            charges={appointmentCharges}
            onChargeFee={(appointment, chargeType) =>
              void chargeAppointmentFee(appointment, chargeType)
            }
            updatingId={updatingId}
            chargingId={chargingId}
          />
          <section className="admin-toolbar">
        <label className="admin-search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            aria-label={t.search}
          />
        </label>
        <div className="admin-filters">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            aria-label={t.columns.status}
          >
            <option value="all">{t.allStatuses}</option>
            {appointmentStatuses.map((status) => (
              <option key={status} value={status}>
                {t.statuses[status]}
              </option>
            ))}
          </select>
          <select
            value={sortField}
            onChange={(event) =>
              setSortField(event.target.value as SortField)
            }
            aria-label={t.sortBy}
          >
            <option value="created_at">{t.sortCreatedAt}</option>
            <option value="preferred_date">{t.sortPreferredDate}</option>
          </select>
          <select
            value={sortDirection}
            onChange={(event) =>
              setSortDirection(event.target.value as SortDirection)
            }
            aria-label={sortDirection === 'near' ? t.nearToFar : t.farToNear}
          >
            <option value="near">{t.nearToFar}</option>
            <option value="far">{t.farToNear}</option>
          </select>
        </div>
        <button type="button" onClick={() => void loadAppointments()} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
          {loading ? t.refreshing : t.refresh}
        </button>
          </section>

          {dataError && <p className="admin-error admin-error--data" role="alert">{t.dataError}</p>}
          {updateError && <p className="admin-error admin-error--data" role="alert">{t.updateError}</p>}

          <section className="admin-panel admin-table-wrap">
        {displayedAppointments.length === 0 && !loading ? (
          <div className="admin-empty">
            <CalendarDays />
            <h2>{appointments.length === 0 ? t.emptyTitle : t.noMatchTitle}</h2>
            <p>{appointments.length === 0 ? t.emptyNote : t.noMatchNote}</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.columns.createdAt}</th>
                <th>{t.columns.customer}</th>
                <th>{t.columns.phone}</th>
                <th>{t.columns.service}</th>
                <th>{t.columns.date}</th>
                  <th>{t.columns.provider}</th>
                <th>{t.columns.message}</th>
                <th>{t.columns.status}</th>
                  <th>{t.columns.fee}</th>
                <th>{t.columns.changedBy}</th>
              </tr>
            </thead>
            <tbody>
              {displayedAppointments.map((appointment) => {
                const history = historyByAppointment.get(appointment.id) ?? []
                  const chargeType = chargeTypeForStatus(appointment.status)
                  const charge = chargeType
                    ? chargeByAppointment.get(
                        `${appointment.id}:${chargeType}`,
                      )
                    : null
                  const percentage = chargeType
                    ? chargePercentage(chargeType)
                    : 0
                  const feeCents = appointment.service_price_cents
                    ? Math.round(
                        appointment.service_price_cents * percentage / 100,
                      )
                    : 0

                return (
                  <tr key={appointment.id}>
                  <td data-label={t.columns.createdAt}>{formatDateTime(appointment.created_at, locale)}</td>
                  <td data-label={t.columns.customer}><strong>{appointment.customer_name}</strong></td>
                  <td data-label={t.columns.phone}><a href={`tel:${appointment.phone}`}>{appointment.phone}</a></td>
                  <td data-label={t.columns.service}>{formatService(appointment.service, locale)}</td>
                    <td
                      data-label={t.columns.date}
                      className="admin-table__appointment-time"
                    >
                      {formatAppointmentTime(appointment, locale)}
                    </td>
                    <td data-label={t.columns.provider}>
                      {appointment.provider_id
                        ? staffById.get(appointment.provider_id)?.display_name ??
                          (locale === 'zh' ? '未知技师' : 'Unknown provider')
                        : locale === 'zh'
                          ? '未分配'
                          : 'Unassigned'}
                    </td>
                  <td data-label={t.columns.message} className="admin-table__message">{appointment.message || '—'}</td>
                  <td data-label={t.columns.status}>
                    <select
                      className={`admin-status admin-status--${appointment.status}`}
                      value={appointment.status}
                      onChange={(event) =>
                        void updateStatus(
                          appointment,
                          event.target.value as Appointment['status'],
                        )
                      }
                      disabled={updatingId === appointment.id}
                      aria-label={`${t.columns.status}: ${appointment.customer_name}`}
                    >
                      {appointmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {t.statuses[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                    <td
                      data-label={t.columns.fee}
                      className="admin-table__fee"
                    >
                      {chargeType &&
                      currentProfile.role !== 'staff' ? (
                        charge?.status === 'completed' ||
                        charge?.status === 'waived' ? (
                          <a
                            className="admin-fee-result"
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
                        ) : appointment.payment_method_id ? (
                          <button
                            className="admin-fee-action"
                            type="button"
                            disabled={chargingId === appointment.id}
                            onClick={() =>
                              void chargeAppointmentFee(
                                appointment,
                                chargeType,
                              )
                            }
                          >
                            <Banknote size={13} />
                            {charge?.status === 'failed'
                              ? locale === 'zh'
                                ? `重试收取 ${percentage}%`
                                : `Retry ${percentage}% fee`
                              : percentage === 0
                                ? locale === 'zh'
                                  ? '确认免收 · $0.00'
                                  : 'Confirm no fee · $0.00'
                                : locale === 'zh'
                                  ? `收取 ${percentage}% · $${(feeCents / 100).toFixed(2)}`
                                  : `Charge ${percentage}% · $${(feeCents / 100).toFixed(2)}`}
                          </button>
                        ) : (
                          <span className="admin-fee-unavailable">
                            {locale === 'zh'
                              ? '未保存付款卡'
                              : 'No card on file'}
                          </span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                  <td data-label={t.columns.changedBy} className="admin-table__operator">
                    {history.length > 0 ? (
                      <ol className="admin-history">
                        {history.map((entry) => {
                          const changedBy = staffById.get(entry.changed_by)

                          return (
                            <li key={entry.id}>
                              <strong>
                                {t.statuses[entry.from_status]}
                                <span aria-hidden="true"> → </span>
                                {t.statuses[entry.to_status]}
                              </strong>
                              <span>{changedBy?.display_name ?? changedBy?.email ?? '—'}</span>
                              <small>{formatDateTime(entry.changed_at, locale)}</small>
                            </li>
                          )
                        })}
                      </ol>
                    ) : '—'}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}

          </section>
        </>
      )}
    </main>
  )
}
