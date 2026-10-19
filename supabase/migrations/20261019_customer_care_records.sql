-- Internal customer care profiles and visit records.
-- Only authenticated staff can read them; writes go through the service role API.

begin;

create table if not exists public.customer_care_profiles (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  allergies text not null default '',
  health_notes text not null default '',
  scalp_baseline text not null default '',
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_care_records (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  record_date date not null default ((now() at time zone 'America/New_York')::date),
  service_ids uuid[] not null default '{}'::uuid[],
  service_names text[] not null default '{}'::text[],
  provider_id uuid references public.staff_profiles(id) on delete set null,
  scalp_assessment text not null default '',
  treatment_notes text not null default '',
  follow_up text not null default '',
  before_photo_path text,
  after_photo_path text,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_care_records_customer_idx
  on public.customer_care_records (customer_id, record_date desc, created_at desc);

create index if not exists customer_care_records_appointment_idx
  on public.customer_care_records (appointment_id)
  where appointment_id is not null;

alter table public.customer_care_profiles enable row level security;
alter table public.customer_care_records enable row level security;

drop policy if exists "Active staff can view care profiles" on public.customer_care_profiles;
create policy "Active staff can view care profiles"
  on public.customer_care_profiles
  for select
  to authenticated
  using (public.is_active_staff());

drop policy if exists "Appointment managers can manage care profiles" on public.customer_care_profiles;
create policy "Appointment managers can manage care profiles"
  on public.customer_care_profiles
  for all
  to authenticated
  using (public.can_manage_appointments())
  with check (public.can_manage_appointments());

drop policy if exists "Active staff can view care records" on public.customer_care_records;
create policy "Active staff can view care records"
  on public.customer_care_records
  for select
  to authenticated
  using (public.is_active_staff());

drop policy if exists "Appointment managers can manage care records" on public.customer_care_records;
create policy "Appointment managers can manage care records"
  on public.customer_care_records
  for all
  to authenticated
  using (public.can_manage_appointments())
  with check (public.can_manage_appointments());

revoke all on table public.customer_care_profiles from anon, authenticated;
revoke all on table public.customer_care_records from anon, authenticated;

grant select on table public.customer_care_profiles to authenticated;
grant select on table public.customer_care_records to authenticated;

commit;
