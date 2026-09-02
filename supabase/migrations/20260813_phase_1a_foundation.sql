begin;

create extension if not exists btree_gist;

create table if not exists public.business_settings (
  id boolean primary key default true check (id),
  business_name text not null default 'ORA Head Spa & Wellness',
  timezone text not null default 'America/New_York',
  location text not null default 'ORA Head Spa & Wellness',
  slot_interval_minutes integer not null default 15
    check (slot_interval_minutes between 5 and 60),
  minimum_notice_minutes integer not null default 120
    check (minimum_notice_minutes >= 0),
  booking_window_days integer not null default 90
    check (booking_window_days between 1 and 365),
  cancellation_policy text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.business_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  name_zh text,
  description text not null default '',
  description_zh text,
  what_to_expect text[] not null default '{}',
  duration_minutes integer not null check (duration_minutes between 15 and 480),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 120),
  price_cents integer check (price_cents is null or price_cents >= 0),
  active boolean not null default true,
  online_bookable boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.services (
  code,
  name,
  name_zh,
  description,
  description_zh,
  what_to_expect,
  duration_minutes,
  display_order
)
values
  (
    'pure-reset',
    'Pure Reset',
    '净澈舒缓',
    'A refreshing ritual for scalps prone to oil and product build-up.',
    '为容易积聚油脂与造型残留的头皮设计，带来洁净轻盈的舒适感。',
    array['Scalp consultation', 'Botanical cleanse', 'Soothing massage'],
    60,
    10
  ),
  (
    'vital-glow',
    'Vital Glow',
    '元气焕活',
    'Cleansing and nourishing care for soft, weightless and glossy hair.',
    '细致清洁与丰润养护相结合，让发丝更柔顺蓬松有光泽。',
    array['Scalp consultation', 'Gentle cleanse', 'Nourishing care', 'Neck and shoulder release'],
    75,
    20
  ),
  (
    'deep-stillness',
    'Deep Stillness',
    '深度静享',
    'An extended head, neck and shoulder ritual for deep relaxation.',
    '从头部延伸至肩颈的深度放松护理，在安静触感中卸下一日疲惫。',
    array['Scalp consultation', 'Aromatic breathing', 'Deep massage', 'Warm restorative rest'],
    90,
    30
  )
on conflict (code) do nothing;

alter table public.staff_profiles
  drop constraint if exists staff_profiles_role_check;

update public.staff_profiles
set role = case role
  when 'admin' then 'manager'
  when 'operator' then 'front_desk'
  else role
end;

update public.staff_profiles
set role = 'owner'
where id = (
  select id
  from public.staff_profiles
  where role = 'manager' and active
  order by created_at
  limit 1
);

alter table public.staff_profiles
  add constraint staff_profiles_role_check
  check (role in ('owner', 'manager', 'front_desk', 'staff'));

alter table public.staff_profiles
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists bookable boolean not null default false,
  add column if not exists color text not null default '#D4AF37',
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.staff_services (
  staff_id uuid not null
    references public.staff_profiles (id) on delete cascade,
  service_id uuid not null
    references public.services (id) on delete cascade,
  active boolean not null default true,
  primary key (staff_id, service_id)
);

create table if not exists public.weekly_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null
    references public.staff_profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  check (start_time < end_time),
  unique (staff_id, weekday, start_time, end_time)
);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff_profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  created_by uuid references public.staff_profiles (id) on delete set null,
  check (starts_at < ends_at)
);

create index if not exists schedule_blocks_time_idx
  on public.schedule_blocks (starts_at, ends_at);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 7 and 40),
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_phone_idx
  on public.customers (phone);

create index if not exists customers_email_idx
  on public.customers (lower(email))
  where email is not null;

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (
    status in (
      'pending',
      'confirmed',
      'checked_in',
      'in_service',
      'completed',
      'checked_out',
      'cancelled',
      'no_show'
    )
  );

alter table public.appointments
  add column if not exists customer_id uuid
    references public.customers (id) on delete restrict,
  add column if not exists customer_email text,
  add column if not exists service_id uuid
    references public.services (id) on delete restrict,
  add column if not exists provider_id uuid
    references public.staff_profiles (id) on delete restrict,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists source text not null default 'online'
    check (source in ('online', 'front_desk', 'phone', 'walk_in', 'legacy')),
  add column if not exists internal_notes text,
  add column if not exists cancellation_reason text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid
    references public.staff_profiles (id) on delete set null;

update public.appointments
set source = 'legacy'
where service_id is null or starts_at is null;

create index if not exists appointments_starts_at_idx
  on public.appointments (starts_at);

create index if not exists appointments_provider_starts_at_idx
  on public.appointments (provider_id, starts_at);

alter table public.appointments
  drop constraint if exists appointments_provider_time_excl;

alter table public.appointments
  add constraint appointments_provider_time_excl
  exclude using gist (
    provider_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (
    provider_id is not null
    and starts_at is not null
    and ends_at is not null
    and status not in ('cancelled', 'no_show')
  );

alter table public.appointment_status_history
  drop constraint if exists appointment_status_history_from_status_check,
  drop constraint if exists appointment_status_history_to_status_check;

alter table public.appointment_status_history
  add constraint appointment_status_history_from_status_check
    check (
      from_status in (
        'pending', 'confirmed', 'checked_in', 'in_service',
        'completed', 'checked_out', 'cancelled', 'no_show'
      )
    ),
  add constraint appointment_status_history_to_status_check
    check (
      to_status in (
        'pending', 'confirmed', 'checked_in', 'in_service',
        'completed', 'checked_out', 'cancelled', 'no_show'
      )
    );

create table if not exists public.appointment_change_history (
  id bigint generated by default as identity primary key,
  appointment_id uuid not null
    references public.appointments (id) on delete cascade,
  action text not null,
  changes jsonb not null default '{}',
  acted_by uuid references public.staff_profiles (id) on delete restrict,
  acted_at timestamptz not null default now()
);

create index if not exists appointment_change_history_appointment_idx
  on public.appointment_change_history (appointment_id, acted_at desc);

create table if not exists public.notification_queue (
  id bigint generated by default as identity primary key,
  appointment_id uuid
    references public.appointments (id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  template text not null,
  recipient text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create or replace function public.record_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := coalesce(auth.uid(), new.updated_by);
begin
  if new.status is distinct from old.status then
    if actor is null or not public.is_active_staff(actor) then
      raise exception 'Only active staff can change appointment status';
    end if;

    new.status_changed_by := actor;
    new.status_changed_at := now();

    insert into public.appointment_status_history (
      appointment_id,
      from_status,
      to_status,
      changed_by,
      changed_at
    )
    values (
      old.id,
      old.status,
      new.status,
      actor,
      new.status_changed_at
    );
  end if;

  return new;
end;
$$;

create or replace function public.record_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := coalesce(auth.uid(), new.updated_by);
  changed_fields jsonb := '{}'::jsonb;
begin
  if new.service_id is distinct from old.service_id then
    changed_fields := changed_fields || jsonb_build_object(
      'service_id',
      jsonb_build_object('from', old.service_id, 'to', new.service_id)
    );
  end if;
  if new.provider_id is distinct from old.provider_id then
    changed_fields := changed_fields || jsonb_build_object(
      'provider_id',
      jsonb_build_object('from', old.provider_id, 'to', new.provider_id)
    );
  end if;
  if new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at then
    changed_fields := changed_fields || jsonb_build_object(
      'schedule',
      jsonb_build_object(
        'from_start', old.starts_at,
        'from_end', old.ends_at,
        'to_start', new.starts_at,
        'to_end', new.ends_at
      )
    );
  end if;

  if changed_fields <> '{}'::jsonb then
    if actor is null or not public.is_active_staff(actor) then
      raise exception 'Only active staff can modify an appointment';
    end if;

    insert into public.appointment_change_history (
      appointment_id,
      action,
      changes,
      acted_by
    )
    values (new.id, 'appointment_updated', changed_fields, actor);
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists record_appointment_change
  on public.appointments;

create trigger record_appointment_change
  before update of service_id, provider_id, starts_at, ends_at
  on public.appointments
  for each row
  execute function public.record_appointment_change();

create or replace function public.is_manager(
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.staff_profiles
    where id = check_user
      and active
      and role in ('owner', 'manager')
  );
$$;

create or replace function public.can_manage_appointments(
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.staff_profiles
    where id = check_user
      and active
      and role in ('owner', 'manager', 'front_desk')
  );
$$;

create or replace function public.is_admin(
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_manager(check_user);
$$;

revoke all on function public.is_manager(uuid) from public;
revoke all on function public.can_manage_appointments(uuid) from public;
grant execute on function public.is_manager(uuid) to authenticated;
grant execute on function public.can_manage_appointments(uuid) to authenticated;

create or replace function public.get_available_slots(
  requested_date date,
  requested_service uuid,
  requested_provider uuid default null
)
returns table (
  provider_id uuid,
  provider_name text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with configuration as (
    select
      timezone,
      slot_interval_minutes,
      minimum_notice_minutes,
      booking_window_days
    from public.business_settings
    where id
  ),
  eligible as (
    select
      staff.id,
      staff.display_name,
      availability.start_time,
      availability.end_time,
      service.duration_minutes,
      service.buffer_minutes,
      configuration.timezone,
      configuration.slot_interval_minutes,
      configuration.minimum_notice_minutes,
      configuration.booking_window_days
    from public.staff_profiles staff
    join public.staff_services staff_service
      on staff_service.staff_id = staff.id
      and staff_service.active
    join public.services service
      on service.id = staff_service.service_id
      and service.active
      and service.online_bookable
    join public.weekly_availability availability
      on availability.staff_id = staff.id
      and availability.active
      and availability.weekday = extract(dow from requested_date)::smallint
    cross join configuration
    where staff.active
      and staff.bookable
      and service.id = requested_service
      and (requested_provider is null or staff.id = requested_provider)
      and requested_date between
        (now() at time zone configuration.timezone)::date
        and (now() at time zone configuration.timezone)::date
          + configuration.booking_window_days
  ),
  slots as (
    select
      eligible.id as provider_id,
      eligible.display_name as provider_name,
      slot_start as starts_at,
      slot_start
        + make_interval(mins => eligible.duration_minutes) as ends_at,
      eligible.buffer_minutes
    from eligible
    cross join lateral generate_series(
      (requested_date + eligible.start_time) at time zone eligible.timezone,
      (requested_date + eligible.end_time) at time zone eligible.timezone
        - make_interval(mins => eligible.duration_minutes + eligible.buffer_minutes),
      make_interval(mins => eligible.slot_interval_minutes)
    ) slot_start
    where slot_start >= now()
      + make_interval(mins => eligible.minimum_notice_minutes)
  )
  select
    slots.provider_id,
    slots.provider_name,
    slots.starts_at,
    slots.ends_at
  from slots
  where not exists (
    select 1
    from public.appointments appointment
    where appointment.provider_id = slots.provider_id
      and appointment.status not in ('cancelled', 'no_show')
      and tstzrange(appointment.starts_at, appointment.ends_at, '[)')
        && tstzrange(
          slots.starts_at,
          slots.ends_at + make_interval(mins => slots.buffer_minutes),
          '[)'
        )
  )
  and not exists (
    select 1
    from public.schedule_blocks block
    where (block.staff_id is null or block.staff_id = slots.provider_id)
      and tstzrange(block.starts_at, block.ends_at, '[)')
        && tstzrange(slots.starts_at, slots.ends_at, '[)')
  )
  order by slots.starts_at, slots.provider_name;
$$;

revoke all on function public.get_available_slots(date, uuid, uuid) from public;
grant execute on function public.get_available_slots(date, uuid, uuid)
  to anon, authenticated, service_role;

alter table public.business_settings enable row level security;
alter table public.services enable row level security;
alter table public.staff_services enable row level security;
alter table public.weekly_availability enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.customers enable row level security;
alter table public.appointment_change_history enable row level security;
alter table public.notification_queue enable row level security;

drop policy if exists "Active staff can view appointments"
  on public.appointments;
create policy "Authorized staff can view appointments"
  on public.appointments
  for select
  to authenticated
  using (
    public.can_manage_appointments()
    or provider_id = auth.uid()
  );

drop policy if exists "Active staff can update appointments"
  on public.appointments;
create policy "Authorized staff can update appointments"
  on public.appointments
  for update
  to authenticated
  using (
    public.can_manage_appointments()
    or provider_id = auth.uid()
  )
  with check (
    public.can_manage_appointments()
    or provider_id = auth.uid()
  );

create policy "Public can view active online services"
  on public.services
  for select
  to anon, authenticated
  using (active and online_bookable);

create policy "Active staff can view services"
  on public.services
  for select
  to authenticated
  using (public.is_active_staff());

create policy "Managers can manage services"
  on public.services
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Active staff can view booking configuration"
  on public.business_settings
  for select
  to authenticated
  using (public.is_active_staff());

create policy "Managers can manage booking configuration"
  on public.business_settings
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Active staff can view staff services"
  on public.staff_services
  for select
  to authenticated
  using (public.is_active_staff());

create policy "Managers can manage staff services"
  on public.staff_services
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Active staff can view weekly availability"
  on public.weekly_availability
  for select
  to authenticated
  using (public.is_active_staff());

create policy "Managers can manage weekly availability"
  on public.weekly_availability
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Active staff can view schedule blocks"
  on public.schedule_blocks
  for select
  to authenticated
  using (public.is_active_staff());

create policy "Managers can manage schedule blocks"
  on public.schedule_blocks
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Active staff can view customers"
  on public.customers
  for select
  to authenticated
  using (public.is_active_staff());

create policy "Appointment managers can manage customers"
  on public.customers
  for all
  to authenticated
  using (public.can_manage_appointments())
  with check (public.can_manage_appointments());

create policy "Active staff can view appointment changes"
  on public.appointment_change_history
  for select
  to authenticated
  using (public.is_active_staff());

create policy "Active staff can view notification queue"
  on public.notification_queue
  for select
  to authenticated
  using (public.is_active_staff());

revoke all on table public.business_settings from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.staff_services from anon, authenticated;
revoke all on table public.weekly_availability from anon, authenticated;
revoke all on table public.schedule_blocks from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.appointment_change_history from anon, authenticated;
revoke all on table public.notification_queue from anon, authenticated;

grant select on table public.services to anon, authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, update on table public.business_settings to authenticated;
grant select, insert, update, delete on table public.staff_services to authenticated;
grant select, insert, update, delete on table public.weekly_availability to authenticated;
grant select, insert, update, delete on table public.schedule_blocks to authenticated;
grant select, insert, update on table public.customers to authenticated;
grant select on table public.appointment_change_history to authenticated;
grant select on table public.notification_queue to authenticated;

commit;
