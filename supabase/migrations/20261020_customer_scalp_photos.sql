-- Scalp check photos shown on the customer profile (up to 6 per customer).

begin;

alter table public.customer_care_profiles
  add column if not exists scalp_photos text[] not null default '{}'::text[];

alter table public.customer_care_profiles
  drop constraint if exists customer_care_profiles_scalp_photos_limit;

alter table public.customer_care_profiles
  add constraint customer_care_profiles_scalp_photos_limit
  check (coalesce(array_length(scalp_photos, 1), 0) <= 6);

commit;
