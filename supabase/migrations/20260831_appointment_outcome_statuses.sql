begin;

alter table public.appointments
  disable trigger record_appointment_status_change;
alter table public.appointments
  disable trigger record_appointment_change;

alter table public.appointments
  drop constraint if exists appointments_status_check,
  drop constraint if exists appointments_provider_time_excl;

alter table public.appointment_status_history
  drop constraint if exists appointment_status_history_from_status_check,
  drop constraint if exists appointment_status_history_to_status_check;

update public.appointment_status_history history
set
  from_status = case history.from_status
    when 'confirmed' then 'pending'
    when 'cancelled' then case
      when history.changed_at < appointment.cancellation_deadline
        then 'cancelled_or_changed_outside_24h'
      else 'cancelled_or_changed_within_24h'
    end
    when 'no_show' then 'no_show_no_contact'
    else history.from_status
  end,
  to_status = case history.to_status
    when 'confirmed' then 'pending'
    when 'cancelled' then case
      when history.changed_at < appointment.cancellation_deadline
        then 'cancelled_or_changed_outside_24h'
      else 'cancelled_or_changed_within_24h'
    end
    when 'no_show' then 'no_show_no_contact'
    else history.to_status
  end
from public.appointments appointment
where appointment.id = history.appointment_id
  and (
    history.from_status in ('confirmed', 'cancelled', 'no_show')
    or history.to_status in ('confirmed', 'cancelled', 'no_show')
  );

update public.appointments
set status = case status
  when 'confirmed' then 'pending'
  when 'cancelled' then case
    when coalesce(status_changed_at, updated_at, created_at) <
      cancellation_deadline
      then 'cancelled_or_changed_outside_24h'
    else 'cancelled_or_changed_within_24h'
  end
  when 'no_show' then 'no_show_no_contact'
  else status
end
where status in ('confirmed', 'cancelled', 'no_show');

alter table public.appointments
  add constraint appointments_status_check
  check (
    status in (
      'pending',
      'checked_in',
      'in_service',
      'completed',
      'checked_out',
      'cancelled_or_changed_outside_24h',
      'cancelled_or_changed_within_24h',
      'no_show_no_contact'
    )
  );

alter table public.appointment_status_history
  add constraint appointment_status_history_from_status_check
  check (
    from_status in (
      'pending',
      'checked_in',
      'in_service',
      'completed',
      'checked_out',
      'cancelled_or_changed_outside_24h',
      'cancelled_or_changed_within_24h',
      'no_show_no_contact'
    )
  ),
  add constraint appointment_status_history_to_status_check
  check (
    to_status in (
      'pending',
      'checked_in',
      'in_service',
      'completed',
      'checked_out',
      'cancelled_or_changed_outside_24h',
      'cancelled_or_changed_within_24h',
      'no_show_no_contact'
    )
  );

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
    and status not in (
      'cancelled_or_changed_outside_24h',
      'cancelled_or_changed_within_24h',
      'no_show_no_contact'
    )
  );

alter table public.appointments
  enable trigger record_appointment_status_change;
alter table public.appointments
  enable trigger record_appointment_change;

create or replace function public.validate_appointment_outcome_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'cancelled_or_changed_outside_24h'
    and new.starts_at <= now() + interval '24 hours' then
    raise exception 'This outcome requires more than 24 hours notice';
  end if;

  if new.status = 'cancelled_or_changed_within_24h'
    and new.starts_at > now() + interval '24 hours' then
    raise exception 'This outcome requires 24 hours notice or less';
  end if;

  if new.status = 'no_show_no_contact' and new.starts_at > now() then
    raise exception 'No-show cannot be recorded before the appointment starts';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_appointment_outcome_status
  on public.appointments;
create trigger validate_appointment_outcome_status
before insert or update of status, starts_at
on public.appointments
for each row execute function public.validate_appointment_outcome_status();

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
        - make_interval(
            mins => eligible.duration_minutes + eligible.buffer_minutes
          ),
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
      and appointment.status not in (
        'cancelled_or_changed_outside_24h',
        'cancelled_or_changed_within_24h',
        'no_show_no_contact'
      )
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

alter table public.appointment_charges
  drop constraint if exists appointment_charges_charge_type_check,
  drop constraint if exists appointment_charges_percentage_bps_check,
  drop constraint if exists appointment_charges_amount_cents_check,
  drop constraint if exists appointment_charges_status_check;

alter table public.appointment_charges
  add constraint appointment_charges_charge_type_check
    check (
      charge_type in (
        'cancellation_outside_24h',
        'late_cancellation',
        'no_show'
      )
    ),
  add constraint appointment_charges_percentage_bps_check
    check (percentage_bps in (0, 1500, 5000)),
  add constraint appointment_charges_amount_cents_check
    check (amount_cents >= 0),
  add constraint appointment_charges_status_check
    check (
      status in ('pending', 'completed', 'failed', 'refunded', 'waived')
    );

commit;
