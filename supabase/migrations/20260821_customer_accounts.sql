begin;

alter table public.customers
  add column if not exists auth_user_id uuid
    references auth.users (id) on delete set null;

create unique index if not exists customers_auth_user_id_idx
  on public.customers (auth_user_id)
  where auth_user_id is not null;

alter table public.appointments
  add column if not exists customer_user_id uuid
    references auth.users (id) on delete set null;

create index if not exists appointments_customer_user_id_idx
  on public.appointments (customer_user_id, starts_at desc)
  where customer_user_id is not null;

alter table public.gift_cards
  add column if not exists purchaser_user_id uuid
    references auth.users (id) on delete set null,
  add column if not exists recipient_user_id uuid
    references auth.users (id) on delete set null;

create index if not exists gift_cards_purchaser_user_id_idx
  on public.gift_cards (purchaser_user_id, created_at desc)
  where purchaser_user_id is not null;

create index if not exists gift_cards_recipient_user_id_idx
  on public.gift_cards (recipient_user_id, created_at desc)
  where recipient_user_id is not null;

update public.customers
set email = lower(trim(email))
where email is not null;

update public.appointments
set customer_email = lower(trim(customer_email))
where customer_email is not null;

update public.gift_cards
set
  purchaser_email = lower(trim(purchaser_email)),
  recipient_email = lower(trim(recipient_email))
where purchaser_email is not null
   or recipient_email is not null;

comment on column public.customers.auth_user_id is
  'Supabase Auth user linked to this customer profile.';
comment on column public.appointments.customer_user_id is
  'Authenticated customer who created the online appointment.';
comment on column public.gift_cards.purchaser_user_id is
  'Authenticated customer who purchased the gift card.';
comment on column public.gift_cards.recipient_user_id is
  'Authenticated customer who received the gift card.';

commit;
