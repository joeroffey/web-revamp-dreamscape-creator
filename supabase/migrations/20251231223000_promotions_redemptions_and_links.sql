-- Promotions & reporting: track real redemption usage across bookings, gift cards, and memberships

-- 1) Link discount codes to transactions (optional)
alter table public.bookings
  add column if not exists discount_code_id uuid null references public.discount_codes(id) on delete set null,
  add column if not exists discount_amount integer not null default 0,
  add column if not exists final_amount integer null;

alter table public.gift_cards
  add column if not exists discount_code_id uuid null references public.discount_codes(id) on delete set null,
  add column if not exists discount_amount integer not null default 0,
  add column if not exists final_amount integer null;

alter table public.memberships
  add column if not exists discount_code_id uuid null references public.discount_codes(id) on delete set null,
  add column if not exists discount_amount integer not null default 0,
  add column if not exists price_amount integer null;

-- 2) Create a ledger for real promo usage/savings (no placeholders)
create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  entity_type text not null check (entity_type in ('booking','gift_card','membership')),
  entity_id uuid not null,
  original_amount integer not null,
  discount_amount integer not null,
  final_amount integer not null
);

create index if not exists discount_redemptions_discount_code_id_idx on public.discount_redemptions(discount_code_id);
create index if not exists discount_redemptions_created_at_idx on public.discount_redemptions(created_at);

-- 3) Ensure final_amount is populated (best-effort)
update public.bookings set final_amount = (price_amount - discount_amount) where final_amount is null;
update public.gift_cards set final_amount = (amount - discount_amount) where final_amount is null;

-- 4) RLS: lock down redemptions to admins (align with existing admin policy style)
alter table public.discount_redemptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='discount_redemptions' and policyname='Admin can view redemptions'
  ) then
    create policy "Admin can view redemptions"
      on public.discount_redemptions
      for select
      using (public.is_admin(auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='discount_redemptions' and policyname='Admin can manage redemptions'
  ) then
    create policy "Admin can manage redemptions"
      on public.discount_redemptions
      for all
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end $$;
