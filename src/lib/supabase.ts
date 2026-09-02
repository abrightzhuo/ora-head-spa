import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export type Customer = {
  id: string
  auth_user_id: string | null
  name: string
  phone: string
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Appointment = {
  id: string
  created_at: string
  customer_name: string
  customer_email: string | null
  phone: string
  service: string
  preferred_date: string
  message: string | null
  locale: string
  status:
    | 'pending'
    | 'checked_in'
    | 'in_service'
    | 'completed'
    | 'checked_out'
    | 'cancelled_or_changed_outside_24h'
    | 'cancelled_or_changed_within_24h'
    | 'no_show_no_contact'
  customer_id: string | null
  service_id: string | null
  provider_id: string | null
  starts_at: string | null
  ends_at: string | null
  source: 'online' | 'front_desk' | 'phone' | 'walk_in' | 'legacy'
  internal_notes: string | null
  status_changed_by: string | null
  status_changed_at: string | null
  service_price_cents: number | null
  payment_method_id: string | null
  card_brand: string | null
  card_last_four: string | null
  cancellation_deadline: string | null
  payment_policy_version: string | null
  payment_policy_consent_at: string | null
}

export type AppointmentCharge = {
  id: string
  appointment_id: string
  payment_method_id: string
  charge_type: 'cancellation_outside_24h' | 'late_cancellation' | 'no_show'
  percentage_bps: 0 | 1500 | 5000
  base_amount_cents: number
  amount_cents: number
  currency: string
  provider_payment_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'waived'
  card_brand: string | null
  card_last_four: string | null
  receipt_url: string | null
  failure_message: string | null
  charged_by: string
  processed_at: string | null
  created_at: string
}

export type AppointmentStatusHistory = {
  id: number
  appointment_id: string
  from_status: Appointment['status']
  to_status: Appointment['status']
  changed_by: string
  changed_at: string
}

export type OperatorAccountHistory = {
  id: number
  operator_id: string
  action: 'created' | 'deleted'
  acted_by: string
  acted_at: string
}

export type StaffProfile = {
  id: string
  email: string
  display_name: string
  role: 'owner' | 'manager' | 'front_desk' | 'staff'
  active: boolean
  bookable: boolean
  phone: string | null
  bio: string | null
  profile_headline: string | null
  photo_url: string | null
  specialties: string[]
  languages: string[]
  experience_years: number | null
  color: string
  hourly_rate_cents: number
  service_commission_bps: number
  product_commission_bps: number
  created_at: string
  created_by: string | null
}

export type Service = {
  id: string
  code: string
  name: string
  name_zh: string | null
  description: string
  description_zh: string | null
  what_to_expect: string[]
  duration_minutes: number
  buffer_minutes: number
  price_cents: number | null
  taxable: boolean
  commissionable: boolean
  active: boolean
  online_bookable: boolean
  display_order: number
}

export type WeeklyAvailability = {
  id: string
  staff_id: string
  weekday: number
  start_time: string
  end_time: string
  active: boolean
}

export type ScheduleBlock = {
  id: string
  staff_id: string | null
  starts_at: string
  ends_at: string
  reason: string | null
  created_at: string
  created_by: string | null
}

export type Product = {
  id: string
  sku: string | null
  name: string
  price_cents: number
  taxable: boolean
  commissionable: boolean
  active: boolean
}

export type Membership = {
  id: string
  customer_id: string
  user_id: string
  status: 'active' | 'expired' | 'cancelled' | 'refunded'
  complimentary_service_code: 'pure-reset' | 'vital-glow'
  complimentary_redeemed_at: string | null
  complimentary_redeemed_checkout_id: string | null
  price_cents: 28800
  currency: 'USD'
  starts_at: string
  expires_at: string
  provider_payment_id: string
  payment_environment: 'sandbox' | 'production'
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export type Checkout = {
  id: string
  appointment_id: string
  customer_id: string | null
  provider_id: string | null
  status: 'draft' | 'payment_pending' | 'paid' | 'voided' | 'refunded'
  currency: string
  subtotal_cents: number
  discount_cents: number
  tax_cents: number
  tip_cents: number
  total_cents: number
  membership_id: string | null
  membership_discount_cents: number
  membership_complimentary_applied: boolean
  notes: string | null
  opened_at: string
  opened_by: string
  closed_at: string | null
  closed_by: string | null
}

export type CheckoutItem = {
  id: string
  checkout_id: string
  item_type: 'service' | 'add_on' | 'product' | 'custom'
  service_id: string | null
  product_id: string | null
  provider_id: string | null
  description: string
  quantity: number
  unit_price_cents: number
  line_subtotal_cents: number
  discount_cents: number
  membership_discount_cents: number
  membership_complimentary_applied: boolean
  tax_cents: number
  line_total_cents: number
  commission_base_cents: number
  taxable: boolean
  commissionable: boolean
  display_order: number
}

export type Payment = {
  id: string
  checkout_id: string
  method: 'square_card' | 'cash' | 'external_card' | 'gift_card' | 'other'
  provider: 'square' | 'manual'
  provider_payment_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'voided' | 'refunded'
  amount_cents: number
  card_brand: string | null
  card_last_four: string | null
  receipt_url: string | null
  processed_at: string | null
}

export type TimeEntry = {
  id: string
  staff_id: string
  clock_in: string
  clock_out: string | null
  status: 'open' | 'closed' | 'edited'
  source: 'employee' | 'manager' | 'approved_edit'
  notes: string | null
  approved: boolean
  updated_at: string
}

export type TimeBreak = {
  id: string
  time_entry_id: string
  started_at: string
  ended_at: string | null
}

export type TimeEditRequest = {
  id: string
  time_entry_id: string
  requested_by: string
  original_clock_in: string
  original_clock_out: string | null
  requested_clock_in: string
  requested_clock_out: string | null
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
}

export type EarningsSummary = {
  staff_id: string
  staff_name: string
  appointment_count: number
  completed_service_count: number
  service_sales_cents: number
  product_sales_cents: number
  tips_cents: number
  service_commission_cents: number
  product_commission_cents: number
  worked_minutes: number
  hourly_pay_cents: number
  estimated_earnings_cents: number
}
