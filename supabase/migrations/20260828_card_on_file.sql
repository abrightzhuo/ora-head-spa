begin;

alter table public.customers
  add column if not exists square_customer_id text;

create unique index if not exists customers_square_customer_id_idx
  on public.customers (square_customer_id)
  where square_customer_id is not null;

create table if not exists public.customer_payment_methods (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null
    references public.customers (id) on delete restrict,
  square_customer_id text not null,
  square_card_id text not null unique,
  card_brand text,
  card_last_four text,
  exp_month integer check (exp_month between 1 and 12),
  exp_year integer check (exp_year >= 2020),
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  environment text not null
    check (environment in ('sandbox', 'production')),
  consent_version text not null,
  consent_text text not null,
  consent_at timestamptz not null,
  consent_ip text,
  consent_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_payment_methods_customer_idx
  on public.customer_payment_methods (customer_id, created_at desc);

alter table public.appointments
  add column if not exists service_price_cents integer
    check (service_price_cents > 0),
  add column if not exists payment_method_id uuid
    references public.customer_payment_methods (id) on delete restrict,
  add column if not exists card_brand text,
  add column if not exists card_last_four text,
  add column if not exists cancellation_deadline timestamptz,
  add column if not exists payment_policy_version text,
  add column if not exists payment_policy_consent_at timestamptz;

update public.appointments appointment
set service_price_cents = service.price_cents
from public.services service
where appointment.service_id = service.id
  and appointment.service_price_cents is null
  and service.price_cents is not null;

update public.appointments
set cancellation_deadline = starts_at - interval '24 hours'
where starts_at is not null
  and cancellation_deadline is null;

create table if not exists public.appointment_charges (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null
    references public.appointments (id) on delete restrict,
  payment_method_id uuid not null
    references public.customer_payment_methods (id) on delete restrict,
  charge_type text not null
    check (charge_type in ('late_cancellation', 'no_show')),
  percentage_bps integer not null
    check (percentage_bps in (1500, 5000)),
  base_amount_cents integer not null check (base_amount_cents > 0),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  provider_payment_id text unique,
  idempotency_key uuid not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  card_brand text,
  card_last_four text,
  receipt_url text,
  failure_message text,
  charged_by uuid not null
    references public.staff_profiles (id) on delete restrict,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, charge_type)
);

create index if not exists appointment_charges_appointment_idx
  on public.appointment_charges (appointment_id, created_at desc);

alter table public.customer_payment_methods enable row level security;
alter table public.appointment_charges enable row level security;

drop policy if exists "Managers can view appointment charges"
  on public.appointment_charges;
create policy "Managers can view appointment charges"
  on public.appointment_charges for select to authenticated
  using (public.can_manage_appointments());

revoke all on table public.customer_payment_methods from anon, authenticated;
revoke all on table public.appointment_charges from anon, authenticated;
grant select on table public.appointment_charges to authenticated;

comment on table public.customer_payment_methods is
  'Square card-on-file references and the customer consent evidence used to create them.';
comment on table public.appointment_charges is
  'Idempotent late-cancellation and no-show charges created from a stored Square card.';

commit;
