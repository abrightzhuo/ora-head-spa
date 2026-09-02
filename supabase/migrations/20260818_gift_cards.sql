create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  last_four text not null check (last_four ~ '^[A-Z0-9]{4}$'),
  initial_balance_cents integer not null
    check (initial_balance_cents > 0),
  balance_cents integer not null
    check (balance_cents >= 0),
  currency text not null default 'USD',
  recipient_name text,
  recipient_email text,
  purchaser_name text,
  purchaser_email text,
  personal_message text,
  purchase_method text not null default 'manual'
    check (purchase_method in ('manual', 'square')),
  provider_payment_id text unique,
  note text,
  active boolean not null default true,
  expires_at timestamptz,
  issued_by uuid references public.staff_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_cards_created_at_idx
  on public.gift_cards (created_at desc);

create index if not exists gift_cards_recipient_email_idx
  on public.gift_cards (lower(recipient_email));

create table if not exists public.gift_card_transactions (
  id uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null
    references public.gift_cards (id) on delete restrict,
  transaction_type text not null
    check (
      transaction_type in (
        'issued',
        'redeemed',
        'adjustment',
        'redemption_reversed'
      )
    ),
  amount_cents integer not null check (amount_cents > 0),
  balance_after_cents integer not null check (balance_after_cents >= 0),
  checkout_id uuid references public.checkouts (id) on delete restrict,
  related_transaction_id uuid
    references public.gift_card_transactions (id) on delete restrict,
  note text,
  acted_by uuid references public.staff_profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists gift_card_transactions_card_idx
  on public.gift_card_transactions (gift_card_id, created_at desc);

create unique index if not exists gift_card_redemption_checkout_idx
  on public.gift_card_transactions (checkout_id)
  where transaction_type = 'redeemed';

create unique index if not exists gift_card_reversal_source_idx
  on public.gift_card_transactions (related_transaction_id)
  where transaction_type = 'redemption_reversed';

create or replace function public.redeem_gift_card(
  p_code_hash text,
  p_checkout_id uuid,
  p_amount_cents integer,
  p_acted_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  card public.gift_cards%rowtype;
  existing_transaction public.gift_card_transactions%rowtype;
  next_balance integer;
begin
  if p_amount_cents <= 0 then
    return jsonb_build_object('error', 'invalid_amount');
  end if;

  select *
    into existing_transaction
    from public.gift_card_transactions
   where checkout_id = p_checkout_id
     and transaction_type = 'redeemed';

  if found then
    select *
      into card
      from public.gift_cards
     where id = existing_transaction.gift_card_id;

    return jsonb_build_object(
      'gift_card_id', card.id,
      'last_four', card.last_four,
      'balance_cents', card.balance_cents,
      'transaction_id', existing_transaction.id,
      'idempotent', true
    );
  end if;

  select *
    into card
    from public.gift_cards
   where code_hash = p_code_hash
   for update;

  if not found then
    return jsonb_build_object('error', 'gift_card_not_found');
  end if;

  if not card.active then
    return jsonb_build_object('error', 'gift_card_inactive');
  end if;

  if card.expires_at is not null and card.expires_at <= now() then
    return jsonb_build_object('error', 'gift_card_expired');
  end if;

  if card.balance_cents < p_amount_cents then
    return jsonb_build_object(
      'error', 'gift_card_insufficient_balance',
      'balance_cents', card.balance_cents
    );
  end if;

  next_balance := card.balance_cents - p_amount_cents;

  update public.gift_cards
     set balance_cents = next_balance,
         updated_at = now()
   where id = card.id;

  insert into public.gift_card_transactions (
    gift_card_id,
    transaction_type,
    amount_cents,
    balance_after_cents,
    checkout_id,
    acted_by
  )
  values (
    card.id,
    'redeemed',
    p_amount_cents,
    next_balance,
    p_checkout_id,
    p_acted_by
  )
  returning * into existing_transaction;

  return jsonb_build_object(
    'gift_card_id', card.id,
    'last_four', card.last_four,
    'balance_cents', next_balance,
    'transaction_id', existing_transaction.id,
    'idempotent', false
  );
end;
$$;

create or replace function public.adjust_gift_card(
  p_gift_card_id uuid,
  p_amount_cents integer,
  p_note text,
  p_acted_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  card public.gift_cards%rowtype;
  next_balance integer;
begin
  if p_amount_cents = 0 then
    return jsonb_build_object('error', 'invalid_amount');
  end if;

  select *
    into card
    from public.gift_cards
   where id = p_gift_card_id
   for update;

  if not found then
    return jsonb_build_object('error', 'gift_card_not_found');
  end if;

  next_balance := card.balance_cents + p_amount_cents;
  if next_balance < 0 then
    return jsonb_build_object(
      'error', 'gift_card_insufficient_balance',
      'balance_cents', card.balance_cents
    );
  end if;

  update public.gift_cards
     set balance_cents = next_balance,
         updated_at = now()
   where id = card.id;

  insert into public.gift_card_transactions (
    gift_card_id,
    transaction_type,
    amount_cents,
    balance_after_cents,
    note,
    acted_by
  )
  values (
    card.id,
    'adjustment',
    abs(p_amount_cents),
    next_balance,
    nullif(trim(p_note), ''),
    p_acted_by
  );

  return jsonb_build_object(
    'gift_card_id', card.id,
    'balance_cents', next_balance
  );
end;
$$;

alter table public.gift_cards enable row level security;
alter table public.gift_card_transactions enable row level security;

drop policy if exists "Managers can view gift cards"
  on public.gift_cards;
create policy "Managers can view gift cards"
  on public.gift_cards for select to authenticated
  using (
    exists (
      select 1
        from public.staff_profiles profile
       where profile.id = auth.uid()
         and profile.active
         and profile.role in ('owner', 'manager')
    )
  );

drop policy if exists "Managers can view gift card transactions"
  on public.gift_card_transactions;
create policy "Managers can view gift card transactions"
  on public.gift_card_transactions for select to authenticated
  using (
    exists (
      select 1
        from public.staff_profiles profile
       where profile.id = auth.uid()
         and profile.active
         and profile.role in ('owner', 'manager')
    )
  );

revoke all on table public.gift_cards from anon, authenticated;
revoke all on table public.gift_card_transactions from anon, authenticated;
grant select on table public.gift_cards to authenticated;
grant select on table public.gift_card_transactions to authenticated;

revoke all on function public.redeem_gift_card(text, uuid, integer, uuid)
  from public, anon, authenticated;
revoke all on function public.adjust_gift_card(uuid, integer, text, uuid)
  from public, anon, authenticated;
grant execute on function public.redeem_gift_card(text, uuid, integer, uuid)
  to service_role;
grant execute on function public.adjust_gift_card(uuid, integer, text, uuid)
  to service_role;
