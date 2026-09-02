alter table public.appointment_status_history
  alter column changed_by drop not null;

create or replace function public.record_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := coalesce(auth.uid(), new.updated_by);
  request_role text := coalesce(auth.role(), '');
begin
  if new.status is distinct from old.status then
    if actor is null and request_role <> 'service_role' then
      raise exception 'Only active staff or the booking service can change appointment status';
    end if;

    if actor is not null and not public.is_active_staff(actor) then
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
