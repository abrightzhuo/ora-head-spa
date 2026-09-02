begin;

alter table public.business_settings
  add column if not exists currency text not null default 'USD',
  add column if not exists tax_rate_bps integer not null default 0
    check (tax_rate_bps between 0 and 10000),
  add column if not exists pay_period_type text not null default 'biweekly'
    check (pay_period_type in ('weekly', 'biweekly', 'semimonthly')),
  add column if not exists pay_period_anchor date not null default '2026-08-10',
  add column if not exists tip_options integer[] not null default '{15,20,25}';

alter table public.services
  add column if not exists taxable boolean not null default true,
  add column if not exists commissionable boolean not null default true;

alter table public.staff_profiles
  add column if not exists hourly_rate_cents integer not null default 0
    check (hourly_rate_cents >= 0),
  add column if not exists service_commission_bps integer not null default 0
    check (service_commission_bps between 0 and 10000),
  add column if not exists product_commission_bps integer not null default 0
    check (product_commission_bps between 0 and 10000);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null check (char_length(name) between 1 and 160),
  price_cents integer not null check (price_cents >= 0),
  taxable boolean not null default true,
  commissionable boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkouts (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique
    references public.appointments (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete restrict,
  provider_id uuid references public.staff_profiles (id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'payment_pending', 'paid', 'voided', 'refunded')),
  currency text not null default 'USD',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  tip_cents integer not null default 0 check (tip_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  notes text,
  opened_at timestamptz not null default now(),
  opened_by uuid not null references public.staff_profiles (id) on delete restrict,
  closed_at timestamptz,
  closed_by uuid references public.staff_profiles (id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.staff_profiles (id) on delete restrict
);

create index if not exists checkouts_closed_at_idx
  on public.checkouts (closed_at desc);

create index if not exists checkouts_provider_idx
  on public.checkouts (provider_id, closed_at desc);

create table if not exists public.checkout_items (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.checkouts (id) on delete cascade,
  item_type text not null
    check (item_type in ('service', 'add_on', 'product', 'custom')),
  service_id uuid references public.services (id) on delete restrict,
  product_id uuid references public.products (id) on delete restrict,
  provider_id uuid references public.staff_profiles (id) on delete restrict,
  description text not null check (char_length(description) between 1 and 240),
  quantity integer not null default 1 check (quantity between 1 and 100),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_subtotal_cents integer not null default 0 check (line_subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  line_total_cents integer not null default 0 check (line_total_cents >= 0),
  commission_base_cents integer not null default 0
    check (commission_base_cents >= 0),
  taxable boolean not null default true,
  commissionable boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists checkout_items_checkout_idx
  on public.checkout_items (checkout_id, display_order);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.checkouts (id) on delete restrict,
  method text not null
    check (method in ('square_card', 'cash', 'external_card', 'gift_card', 'other')),
  provider text not null default 'manual'
    check (provider in ('square', 'manual')),
  provider_payment_id text unique,
  idempotency_key uuid not null unique default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'voided', 'refunded')),
  amount_cents integer not null check (amount_cents >= 0),
  card_brand text,
  card_last_four text,
  receipt_url text,
  failure_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.staff_profiles (id) on delete restrict
);

create index if not exists payments_checkout_idx
  on public.payments (checkout_id, created_at desc);

create table if not exists public.tip_allocations (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null references public.checkouts (id) on delete restrict,
  payment_id uuid references public.payments (id) on delete restrict,
  staff_id uuid not null references public.staff_profiles (id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  unique (checkout_id, staff_id)
);

create index if not exists tip_allocations_staff_idx
  on public.tip_allocations (staff_id, created_at desc);

create table if not exists public.checkout_history (
  id bigint generated by default as identity primary key,
  checkout_id uuid not null references public.checkouts (id) on delete cascade,
  action text not null,
  details jsonb not null default '{}',
  acted_by uuid not null references public.staff_profiles (id) on delete restrict,
  acted_at timestamptz not null default now()
);

create index if not exists checkout_history_checkout_idx
  on public.checkout_history (checkout_id, acted_at desc);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles (id) on delete restrict,
  clock_in timestamptz not null,
  clock_out timestamptz,
  status text not null default 'open'
    check (status in ('open', 'closed', 'edited')),
  source text not null default 'employee'
    check (source in ('employee', 'manager', 'approved_edit')),
  notes text,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.staff_profiles (id) on delete restrict,
  check (clock_out is null or clock_in < clock_out)
);

create unique index if not exists time_entries_one_open_per_staff_idx
  on public.time_entries (staff_id)
  where clock_out is null;

create index if not exists time_entries_staff_clock_idx
  on public.time_entries (staff_id, clock_in desc);

create table if not exists public.time_breaks (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (ended_at is null or started_at < ended_at)
);

create unique index if not exists time_breaks_one_open_per_entry_idx
  on public.time_breaks (time_entry_id)
  where ended_at is null;

create table if not exists public.time_edit_requests (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete restrict,
  requested_by uuid not null references public.staff_profiles (id) on delete restrict,
  original_clock_in timestamptz not null,
  original_clock_out timestamptz,
  requested_clock_in timestamptz not null,
  requested_clock_out timestamptz,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references public.staff_profiles (id) on delete restrict,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  check (
    requested_clock_out is null
    or requested_clock_in < requested_clock_out
  )
);

create index if not exists time_edit_requests_status_idx
  on public.time_edit_requests (status, created_at desc);

create table if not exists public.time_entry_history (
  id bigint generated by default as identity primary key,
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  action text not null,
  before_values jsonb,
  after_values jsonb,
  reason text,
  acted_by uuid not null references public.staff_profiles (id) on delete restrict,
  acted_at timestamptz not null default now()
);

create index if not exists time_entry_history_entry_idx
  on public.time_entry_history (time_entry_id, acted_at desc);

create or replace function public.clock_action(action_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  active_entry public.time_entries;
  active_break public.time_breaks;
begin
  if actor is null or not public.is_active_staff(actor) then
    raise exception 'Active staff account required';
  end if;

  select *
  into active_entry
  from public.time_entries
  where staff_id = actor and clock_out is null
  order by clock_in desc
  limit 1
  for update;

  if action_name = 'clock_in' then
    if active_entry.id is not null then
      raise exception 'Already clocked in';
    end if;

    insert into public.time_entries (
      staff_id,
      clock_in,
      updated_by
    )
    values (actor, now(), actor)
    returning * into active_entry;

    insert into public.time_entry_history (
      time_entry_id,
      action,
      after_values,
      acted_by
    )
    values (
      active_entry.id,
      'clock_in',
      to_jsonb(active_entry),
      actor
    );
  elsif action_name = 'start_break' then
    if active_entry.id is null then
      raise exception 'Clock in first';
    end if;

    if exists (
      select 1
      from public.time_breaks
      where time_entry_id = active_entry.id and ended_at is null
    ) then
      raise exception 'Break already started';
    end if;

    insert into public.time_breaks (time_entry_id, started_at)
    values (active_entry.id, now())
    returning * into active_break;

    insert into public.time_entry_history (
      time_entry_id,
      action,
      after_values,
      acted_by
    )
    values (
      active_entry.id,
      'start_break',
      to_jsonb(active_break),
      actor
    );
  elsif action_name = 'end_break' then
    if active_entry.id is null then
      raise exception 'No active shift';
    end if;

    select *
    into active_break
    from public.time_breaks
    where time_entry_id = active_entry.id and ended_at is null
    limit 1
    for update;

    if active_break.id is null then
      raise exception 'No active break';
    end if;

    update public.time_breaks
    set ended_at = now()
    where id = active_break.id
    returning * into active_break;

    insert into public.time_entry_history (
      time_entry_id,
      action,
      after_values,
      acted_by
    )
    values (
      active_entry.id,
      'end_break',
      to_jsonb(active_break),
      actor
    );
  elsif action_name = 'clock_out' then
    if active_entry.id is null then
      raise exception 'No active shift';
    end if;

    update public.time_breaks
    set ended_at = now()
    where time_entry_id = active_entry.id and ended_at is null;

    update public.time_entries
    set
      clock_out = now(),
      status = 'closed',
      updated_at = now(),
      updated_by = actor
    where id = active_entry.id
    returning * into active_entry;

    insert into public.time_entry_history (
      time_entry_id,
      action,
      after_values,
      acted_by
    )
    values (
      active_entry.id,
      'clock_out',
      to_jsonb(active_entry),
      actor
    );
  else
    raise exception 'Unsupported clock action';
  end if;

  return jsonb_build_object(
    'entry', to_jsonb(active_entry),
    'break', case
      when active_break.id is null then null
      else to_jsonb(active_break)
    end
  );
end;
$$;

create or replace function public.review_time_edit_request(
  request_id uuid,
  decision text,
  manager_note text default null
)
returns public.time_edit_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  request_record public.time_edit_requests;
  entry_before public.time_entries;
  updated_request public.time_edit_requests;
begin
  if actor is null or not public.is_manager(actor) then
    raise exception 'Manager access required';
  end if;

  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select *
  into request_record
  from public.time_edit_requests
  where id = request_id and status = 'pending'
  for update;

  if request_record.id is null then
    raise exception 'Pending request not found';
  end if;

  if decision = 'approved' then
    select *
    into entry_before
    from public.time_entries
    where id = request_record.time_entry_id
    for update;

    update public.time_entries
    set
      clock_in = request_record.requested_clock_in,
      clock_out = request_record.requested_clock_out,
      status = case
        when request_record.requested_clock_out is null then 'open'
        else 'edited'
      end,
      source = 'approved_edit',
      updated_at = now(),
      updated_by = actor
    where id = request_record.time_entry_id;

    insert into public.time_entry_history (
      time_entry_id,
      action,
      before_values,
      after_values,
      reason,
      acted_by
    )
    select
      request_record.time_entry_id,
      'approved_edit',
      to_jsonb(entry_before),
      to_jsonb(entry_after),
      request_record.reason,
      actor
    from public.time_entries entry_after
    where entry_after.id = request_record.time_entry_id;
  end if;

  update public.time_edit_requests
  set
    status = decision,
    reviewed_by = actor,
    reviewed_at = now(),
    review_note = manager_note
  where id = request_id
  returning * into updated_request;

  return updated_request;
end;
$$;

create or replace function public.manager_edit_time_entry(
  entry_id uuid,
  new_clock_in timestamptz,
  new_clock_out timestamptz,
  edit_reason text
)
returns public.time_entries
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  before_entry public.time_entries;
  updated_entry public.time_entries;
begin
  if actor is null or not public.is_manager(actor) then
    raise exception 'Manager access required';
  end if;
  if new_clock_in is null
    or (new_clock_out is not null and new_clock_out <= new_clock_in)
    or length(trim(coalesce(edit_reason, ''))) < 3 then
    raise exception 'Valid times and reason required';
  end if;

  select * into before_entry
  from public.time_entries
  where id = entry_id
  for update;

  if before_entry.id is null then
    raise exception 'Time entry not found';
  end if;

  update public.time_entries
  set
    clock_in = new_clock_in,
    clock_out = new_clock_out,
    status = case when new_clock_out is null then 'open' else 'edited' end,
    source = 'manager',
    notes = edit_reason,
    approved = true,
    updated_at = now(),
    updated_by = actor
  where id = entry_id
  returning * into updated_entry;

  insert into public.time_entry_history (
    time_entry_id,
    action,
    before_values,
    after_values,
    reason,
    acted_by
  )
  values (
    entry_id,
    'manager_edit',
    to_jsonb(before_entry),
    to_jsonb(updated_entry),
    edit_reason,
    actor
  );

  return updated_entry;
end;
$$;

create or replace function public.get_earnings_summary(
  range_start timestamptz,
  range_end timestamptz,
  requested_staff uuid default null
)
returns table (
  staff_id uuid,
  staff_name text,
  appointment_count bigint,
  completed_service_count bigint,
  service_sales_cents bigint,
  product_sales_cents bigint,
  tips_cents bigint,
  service_commission_cents bigint,
  product_commission_cents bigint,
  worked_minutes bigint,
  hourly_pay_cents bigint,
  estimated_earnings_cents bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with authorized_staff as (
    select profile.*
    from public.staff_profiles profile
    where profile.active
      and (
        profile.id = auth.uid()
        or public.is_manager(auth.uid())
      )
      and (requested_staff is null or profile.id = requested_staff)
  ),
  item_totals as (
    select
      item.provider_id as staff_id,
      count(distinct checkout.appointment_id) as appointment_count,
      count(*) filter (
        where item.item_type in ('service', 'add_on')
      ) as completed_service_count,
      coalesce(sum(item.commission_base_cents) filter (
        where item.item_type in ('service', 'add_on')
      ), 0) as service_sales_cents,
      coalesce(sum(item.commission_base_cents) filter (
        where item.item_type = 'product'
      ), 0) as product_sales_cents
    from public.checkouts checkout
    join public.checkout_items item on item.checkout_id = checkout.id
    where checkout.status = 'paid'
      and checkout.closed_at >= range_start
      and checkout.closed_at < range_end
    group by item.provider_id
  ),
  tip_totals as (
    select
      tip.staff_id,
      coalesce(sum(tip.amount_cents), 0) as tips_cents
    from public.tip_allocations tip
    join public.checkouts checkout on checkout.id = tip.checkout_id
    where checkout.status = 'paid'
      and checkout.closed_at >= range_start
      and checkout.closed_at < range_end
    group by tip.staff_id
  ),
  time_totals as (
    select
      entry.staff_id,
      floor(sum(
        extract(epoch from (
          least(coalesce(entry.clock_out, now()), range_end)
          - greatest(entry.clock_in, range_start)
        )) / 60
        - coalesce((
          select sum(
            extract(epoch from (
              least(coalesce(break_entry.ended_at, now()), range_end)
              - greatest(break_entry.started_at, range_start)
            )) / 60
          )
          from public.time_breaks break_entry
          where break_entry.time_entry_id = entry.id
            and break_entry.started_at < range_end
            and coalesce(break_entry.ended_at, now()) > range_start
        ), 0)
      ))::bigint as worked_minutes
    from public.time_entries entry
    where entry.clock_in < range_end
      and coalesce(entry.clock_out, now()) > range_start
      and entry.approved
    group by entry.staff_id
  )
  select
    staff.id,
    staff.display_name,
    coalesce(items.appointment_count, 0),
    coalesce(items.completed_service_count, 0),
    coalesce(items.service_sales_cents, 0),
    coalesce(items.product_sales_cents, 0),
    coalesce(tips.tips_cents, 0),
    round(
      coalesce(items.service_sales_cents, 0)
      * staff.service_commission_bps / 10000.0
    )::bigint,
    round(
      coalesce(items.product_sales_cents, 0)
      * staff.product_commission_bps / 10000.0
    )::bigint,
    coalesce(time.worked_minutes, 0),
    round(
      coalesce(time.worked_minutes, 0)
      * staff.hourly_rate_cents / 60.0
    )::bigint,
    (
      round(
        coalesce(time.worked_minutes, 0)
        * staff.hourly_rate_cents / 60.0
      )
      + round(
        coalesce(items.service_sales_cents, 0)
        * staff.service_commission_bps / 10000.0
      )
      + round(
        coalesce(items.product_sales_cents, 0)
        * staff.product_commission_bps / 10000.0
      )
      + coalesce(tips.tips_cents, 0)
    )::bigint
  from authorized_staff staff
  left join item_totals items on items.staff_id = staff.id
  left join tip_totals tips on tips.staff_id = staff.id
  left join time_totals time on time.staff_id = staff.id
  order by staff.display_name;
$$;

revoke all on function public.clock_action(text) from public;
revoke all on function public.clock_action(text) from anon;
revoke all on function public.review_time_edit_request(uuid, text, text)
  from public;
revoke all on function public.review_time_edit_request(uuid, text, text)
  from anon;
revoke all on function public.manager_edit_time_entry(
  uuid,
  timestamptz,
  timestamptz,
  text
) from public;
revoke all on function public.manager_edit_time_entry(
  uuid,
  timestamptz,
  timestamptz,
  text
) from anon;
revoke all on function public.get_earnings_summary(
  timestamptz,
  timestamptz,
  uuid
) from public;
revoke all on function public.get_earnings_summary(
  timestamptz,
  timestamptz,
  uuid
) from anon;

grant execute on function public.clock_action(text) to authenticated;
grant execute on function public.review_time_edit_request(uuid, text, text)
  to authenticated;
grant execute on function public.manager_edit_time_entry(
  uuid,
  timestamptz,
  timestamptz,
  text
) to authenticated;
grant execute on function public.get_earnings_summary(
  timestamptz,
  timestamptz,
  uuid
) to authenticated;

alter table public.products enable row level security;
alter table public.checkouts enable row level security;
alter table public.checkout_items enable row level security;
alter table public.payments enable row level security;
alter table public.tip_allocations enable row level security;
alter table public.checkout_history enable row level security;
alter table public.time_entries enable row level security;
alter table public.time_breaks enable row level security;
alter table public.time_edit_requests enable row level security;
alter table public.time_entry_history enable row level security;

drop policy if exists "Managers can update staff compensation"
  on public.staff_profiles;
drop policy if exists "Active staff can view products" on public.products;
drop policy if exists "Managers can manage products" on public.products;
drop policy if exists "Authorized staff can view checkouts"
  on public.checkouts;
drop policy if exists "Authorized staff can view checkout items"
  on public.checkout_items;
drop policy if exists "Authorized staff can view payments" on public.payments;
drop policy if exists "Staff can view allocated tips"
  on public.tip_allocations;
drop policy if exists "Authorized staff can view checkout history"
  on public.checkout_history;
drop policy if exists "Staff can view own time entries" on public.time_entries;
drop policy if exists "Staff can view own breaks" on public.time_breaks;
drop policy if exists "Staff can view time edit requests"
  on public.time_edit_requests;
drop policy if exists "Staff can submit time edit requests"
  on public.time_edit_requests;
drop policy if exists "Managers can update time edit requests"
  on public.time_edit_requests;
drop policy if exists "Staff can view own time history"
  on public.time_entry_history;

create policy "Managers can update staff compensation"
  on public.staff_profiles for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Active staff can view products"
  on public.products for select to authenticated
  using (public.is_active_staff());

create policy "Managers can manage products"
  on public.products for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Authorized staff can view checkouts"
  on public.checkouts for select to authenticated
  using (
    public.can_manage_appointments()
    or provider_id = auth.uid()
  );

create policy "Authorized staff can view checkout items"
  on public.checkout_items for select to authenticated
  using (
    exists (
      select 1
      from public.checkouts checkout
      where checkout.id = checkout_items.checkout_id
        and (
          public.can_manage_appointments()
          or checkout.provider_id = auth.uid()
        )
    )
  );

create policy "Authorized staff can view payments"
  on public.payments for select to authenticated
  using (
    exists (
      select 1
      from public.checkouts checkout
      where checkout.id = payments.checkout_id
        and (
          public.can_manage_appointments()
          or checkout.provider_id = auth.uid()
        )
    )
  );

create policy "Staff can view allocated tips"
  on public.tip_allocations for select to authenticated
  using (
    staff_id = auth.uid()
    or public.is_manager()
    or public.can_manage_appointments()
  );

create policy "Authorized staff can view checkout history"
  on public.checkout_history for select to authenticated
  using (
    exists (
      select 1
      from public.checkouts checkout
      where checkout.id = checkout_history.checkout_id
        and (
          public.can_manage_appointments()
          or checkout.provider_id = auth.uid()
        )
    )
  );

create policy "Staff can view own time entries"
  on public.time_entries for select to authenticated
  using (staff_id = auth.uid() or public.is_manager());

create policy "Staff can view own breaks"
  on public.time_breaks for select to authenticated
  using (
    exists (
      select 1
      from public.time_entries entry
      where entry.id = time_breaks.time_entry_id
        and (
          entry.staff_id = auth.uid()
          or public.is_manager()
        )
    )
  );

create policy "Staff can view time edit requests"
  on public.time_edit_requests for select to authenticated
  using (requested_by = auth.uid() or public.is_manager());

create policy "Staff can submit time edit requests"
  on public.time_edit_requests for insert to authenticated
  with check (
    requested_by = auth.uid()
    and exists (
      select 1
      from public.time_entries entry
      where entry.id = time_edit_requests.time_entry_id
        and entry.staff_id = auth.uid()
    )
  );

create policy "Managers can update time edit requests"
  on public.time_edit_requests for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Staff can view own time history"
  on public.time_entry_history for select to authenticated
  using (
    exists (
      select 1
      from public.time_entries entry
      where entry.id = time_entry_history.time_entry_id
        and (
          entry.staff_id = auth.uid()
          or public.is_manager()
        )
    )
  );

revoke all on table public.products from anon, authenticated;
revoke all on table public.checkouts from anon, authenticated;
revoke all on table public.checkout_items from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.tip_allocations from anon, authenticated;
revoke all on table public.checkout_history from anon, authenticated;
revoke all on table public.time_entries from anon, authenticated;
revoke all on table public.time_breaks from anon, authenticated;
revoke all on table public.time_edit_requests from anon, authenticated;
revoke all on table public.time_entry_history from anon, authenticated;

grant select, insert, update, delete on table public.products to authenticated;
grant select on table public.checkouts to authenticated;
grant select on table public.checkout_items to authenticated;
grant select on table public.payments to authenticated;
grant select on table public.tip_allocations to authenticated;
grant select on table public.checkout_history to authenticated;
grant select on table public.time_entries to authenticated;
grant select on table public.time_breaks to authenticated;
grant select, insert, update on table public.time_edit_requests to authenticated;
grant select on table public.time_entry_history to authenticated;
grant update (
  hourly_rate_cents,
  service_commission_bps,
  product_commission_bps
) on table public.staff_profiles to authenticated;

commit;
