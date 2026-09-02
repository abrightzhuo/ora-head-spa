begin;

alter table public.staff_profiles
  add column if not exists profile_headline text,
  add column if not exists photo_url text,
  add column if not exists specialties text[] not null default '{}',
  add column if not exists languages text[] not null default '{}',
  add column if not exists experience_years integer
    check (experience_years is null or experience_years between 0 and 80);

commit;
