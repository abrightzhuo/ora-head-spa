alter table public.appointments
  add column if not exists booking_idempotency_key uuid;

create unique index if not exists appointments_booking_idempotency_key_idx
  on public.appointments (booking_idempotency_key)
  where booking_idempotency_key is not null;

create table if not exists public.appointment_payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique
    references public.appointments (id) on delete restrict,
  provider text not null default 'square'
    check (provider = 'square'),
  provider_payment_id text not null unique,
  idempotency_key uuid not null unique,
  status text not null
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  card_brand text,
  card_last_four text,
  receipt_url text,
  environment text not null
    check (environment in ('sandbox', 'production')),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists appointment_payments_appointment_idx
  on public.appointment_payments (appointment_id);

alter table public.appointment_payments enable row level security;

drop policy if exists "Authorized staff can view appointment payments"
  on public.appointment_payments;

create policy "Authorized staff can view appointment payments"
  on public.appointment_payments for select to authenticated
  using (
    exists (
      select 1
      from public.appointments appointment
      where appointment.id = appointment_payments.appointment_id
        and (
          public.can_manage_appointments()
          or appointment.provider_id = auth.uid()
        )
    )
  );

revoke all on table public.appointment_payments from anon, authenticated;
grant select on table public.appointment_payments to authenticated;
