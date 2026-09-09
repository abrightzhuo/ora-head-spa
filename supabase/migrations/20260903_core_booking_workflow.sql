begin;

grant insert on table public.appointments to authenticated;
grant update (
  customer_id,
  customer_name,
  customer_email,
  phone,
  service,
  service_id,
  provider_id,
  preferred_date,
  starts_at,
  ends_at,
  message,
  service_price_cents,
  cancellation_deadline,
  updated_at,
  updated_by
) on table public.appointments to authenticated;

create or replace function public.record_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := coalesce(auth.uid(), new.updated_by);
  request_role text := coalesce(auth.role(), '');
  changed_fields jsonb := '{}'::jsonb;
begin
  if new.service_id is distinct from old.service_id then
    changed_fields := changed_fields || jsonb_build_object(
      'service',
      jsonb_build_object(
        'from_id', old.service_id,
        'to_id', new.service_id,
        'from', old.service,
        'to', new.service
      )
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
    if actor is null and request_role <> 'service_role' then
      raise exception 'Only active staff or the booking service can modify an appointment';
    end if;
    if actor is not null and not public.is_active_staff(actor) then
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

comment on table public.appointment_change_history is
  'Immutable audit log for service, provider and schedule changes.';

commit;
