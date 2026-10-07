-- YAVIYA PostgreSQL/Supabase production foundation.
-- Monetary amounts are stored in the smallest unit as integers. No float money.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  residence_country char(2) not null default 'CD',
  currency char(3) not null default 'CDF' check (currency in ('CDF', 'XAF', 'USD', 'EUR')),
  preferred_language text not null default 'fr' check (preferred_language in ('fr', 'en')),
  privacy_version text,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('buyer', 'seller', 'courier', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.account_identifiers (
  sequence_id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('buyer', 'seller', 'courier')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace view public.account_identifier_labels
with (security_invoker = true)
as
select user_id, role,
  case role
    when 'buyer' then 'YVC-'
    when 'seller' then 'YVYS-'
    when 'courier' then 'YVYC-'
  end || lpad(sequence_id::text, 6, '0') as account_id
from public.account_identifiers;

create or replace function private.create_buyer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'buyer')
  on conflict do nothing;
  insert into public.account_identifiers (user_id, role) values (new.id, 'buyer')
  on conflict do nothing;
  return new;
end;
$$;

create trigger auth_user_creates_buyer
after insert on auth.users
for each row execute function private.create_buyer_profile();

create table public.stores (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 2 and 120),
  country char(2) not null check (country in ('CD', 'CG')),
  city text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger stores_updated_at before update on public.stores
for each row execute function private.set_updated_at();
create index stores_owner_idx on public.stores(owner_id);
create index stores_market_idx on public.stores(country, city, status);

create table public.store_members (
  store_id bigint not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'catalogue')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name_fr text not null unique,
  name_en text not null,
  sort_order integer not null,
  active boolean not null default true
);

insert into public.categories (slug, name_fr, name_en, sort_order) values
  ('alimentation-epicerie', 'Alimentation & épicerie', 'Food & groceries', 1),
  ('automobile', 'Automobile', 'Automotive', 2),
  ('beaute-soins', 'Beauté & soins', 'Beauty & care', 3),
  ('bebe-enfants', 'Bébé & enfants', 'Baby & kids', 4),
  ('industrie-commerce', 'Industrie & commerce', 'Industry & commerce', 5),
  ('maison-cuisine', 'Maison & cuisine', 'Home & kitchen', 6),
  ('mode', 'Mode', 'Fashion', 7),
  ('musique-divertissement', 'Musique & divertissement', 'Music & entertainment', 8),
  ('sante-bien-etre', 'Santé & bien-être', 'Health & wellbeing', 9),
  ('sports-plein-air', 'Sports & plein air', 'Sports & outdoors', 10),
  ('voyage-bagages', 'Voyage & bagages', 'Travel & luggage', 11),
  ('electronique', 'Électronique', 'Electronics', 12)
on conflict (slug) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order;

create table public.subcategories (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id) on delete cascade,
  slug text not null,
  name_fr text not null,
  name_en text not null,
  active boolean not null default true,
  unique (category_id, slug),
  unique (id, category_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,
  store_id bigint not null references public.stores(id),
  owner_id uuid not null references public.profiles(id),
  category_id bigint not null references public.categories(id),
  subcategory_id bigint,
  country char(2) not null check (country in ('CD', 'CG')),
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null check (currency in ('CDF', 'XAF', 'USD', 'EUR')),
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  visible boolean not null default false,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country, legacy_id),
  foreign key (subcategory_id, category_id)
    references public.subcategories(id, category_id)
);

create trigger products_updated_at before update on public.products
for each row execute function private.set_updated_at();
create index products_catalogue_idx on public.products(country, category_id, status, visible);
create index products_store_idx on public.products(store_id, updated_at desc);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  alt_text text not null default '',
  sort_order smallint not null check (sort_order between 0 and 7),
  created_at timestamptz not null default now(),
  unique (product_id, sort_order),
  unique (storage_path)
);

create table public.wishlist_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_id uuid not null references public.profiles(id),
  country char(2) not null check (country in ('CD', 'CG')),
  city text not null,
  commune text not null,
  delivery_address text not null,
  delivery_method text not null check (delivery_method in ('pickup', 'home', 'relay', 'express')),
  status text not null default 'pending_seller' check (status in ('pending_seller', 'accepted', 'preparing', 'ready', 'assigned', 'in_transit', 'delivered', 'received', 'cancelled', 'refunded')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'authorized', 'paid', 'held', 'partially_refunded', 'refunded', 'failed', 'cancelled')),
  currency char(3) not null check (currency in ('CDF', 'XAF', 'USD', 'EUR')),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  delivery_fee_minor bigint not null check (delivery_fee_minor >= 0),
  total_minor bigint generated always as (subtotal_minor + delivery_fee_minor) stored,
  request_key text not null unique,
  buyer_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_updated_at before update on public.orders
for each row execute function private.set_updated_at();
create index orders_buyer_idx on public.orders(buyer_id, created_at desc);
create index orders_market_idx on public.orders(country, status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  store_id bigint not null references public.stores(id),
  seller_id uuid not null references public.profiles(id),
  title_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  commission_rate numeric(5, 4) not null default 0 check (commission_rate between 0 and 1),
  seller_status text not null default 'pending' check (seller_status in ('pending', 'accepted', 'preparing', 'ready', 'cancelled')),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_seller_idx on public.order_items(seller_id, created_at desc);

create table public.order_participants (
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('buyer', 'seller', 'courier', 'admin')),
  store_id bigint references public.stores(id),
  created_at timestamptz not null default now(),
  primary key (order_id, user_id, role)
);
create index order_participants_user_idx on public.order_participants(user_id, order_id);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  courier_id uuid references public.profiles(id),
  status text not null default 'unassigned' check (status in ('unassigned', 'offered', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')),
  fee_minor bigint not null check (fee_minor >= 0),
  courier_payout_minor bigint not null default 0 check (courier_payout_minor >= 0),
  proof_storage_path text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger deliveries_updated_at before update on public.deliveries
for each row execute function private.set_updated_at();
create index deliveries_courier_idx on public.deliveries(courier_id, status, created_at desc);

create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_role text not null check (sender_role in ('buyer', 'seller', 'courier', 'admin')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index order_messages_thread_idx on public.order_messages(order_id, created_at);

create table public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  buyer_id uuid not null references public.profiles(id),
  store_id bigint not null references public.stores(id),
  score smallint not null check (score between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (order_id, buyer_id, store_id)
);

create table public.courier_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  buyer_id uuid not null references public.profiles(id),
  courier_id uuid not null references public.profiles(id),
  score smallint not null check (score between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (order_id, buyer_id),
  check (buyer_id <> courier_id)
);
create index courier_reviews_courier_idx on public.courier_reviews(courier_id, created_at desc);

create table public.identity_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('seller', 'courier')),
  issuing_country char(2) not null,
  document_type text not null check (document_type in ('identity', 'passport', 'licence-c')),
  document_storage_path text not null,
  document_mime text not null check (document_mime in ('image/jpeg', 'image/png')),
  company_name text not null default '',
  company_rccm text not null default '',
  unregistered boolean not null default false,
  seller_plan text,
  courier_plan text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  review_note text not null default '',
  reviewed_by uuid references public.profiles(id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (user_id, kind)
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text not null check (provider in ('mpesa', 'orange_money', 'airtel_money', 'card', 'cash')),
  provider_reference text,
  operation text not null check (operation in ('authorize', 'capture', 'hold', 'release', 'refund', 'reverse', 'cash_confirm')),
  status text not null check (status in ('created', 'pending', 'succeeded', 'failed', 'cancelled')),
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null check (currency in ('CDF', 'XAF', 'USD', 'EUR')),
  idempotency_key text not null unique,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference, operation)
);
create trigger payment_transactions_updated_at before update on public.payment_transactions
for each row execute function private.set_updated_at();
create index payment_transactions_order_idx on public.payment_transactions(order_id, created_at desc);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  payment_transaction_id uuid references public.payment_transactions(id),
  requested_by uuid not null references public.profiles(id),
  reason text not null,
  amount_minor bigint not null check (amount_minor > 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'processing', 'succeeded', 'rejected', 'failed')),
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger refunds_updated_at before update on public.refunds
for each row execute function private.set_updated_at();

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  store_id bigint references public.stores(id),
  courier_id uuid references public.profiles(id),
  payment_transaction_id uuid references public.payment_transactions(id),
  entry_type text not null check (entry_type in ('sale', 'commission', 'delivery_fee', 'seller_payable', 'courier_payable', 'refund', 'chargeback', 'payout')),
  direction text not null check (direction in ('debit', 'credit')),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null check (currency in ('CDF', 'XAF', 'USD', 'EUR')),
  reference text not null,
  created_at timestamptz not null default now()
);
create index ledger_order_idx on public.ledger_entries(order_id, created_at);
create index ledger_store_idx on public.ledger_entries(store_id, created_at desc);

create table public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id bigint references public.stores(id) on delete cascade,
  method text not null check (method in ('mpesa', 'orange_money', 'airtel_money', 'bank')),
  account_name text not null,
  account_token_ciphertext text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, store_id, method)
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.profiles(id),
  store_id bigint references public.stores(id),
  payout_account_id uuid not null references public.payout_accounts(id),
  period_start date not null,
  period_end date not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null check (currency in ('CDF', 'XAF', 'USD', 'EUR')),
  status text not null default 'scheduled' check (status in ('scheduled', 'processing', 'paid', 'failed', 'cancelled')),
  provider_reference text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (period_end >= period_start)
);
create index payouts_beneficiary_idx on public.payouts(beneficiary_id, created_at desc);

create table public.coupon_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('demo_credit', 'earn', 'redeem', 'expire', 'adjustment')),
  delta integer not null,
  reference text not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, reference)
);
create index coupon_events_user_idx on public.coupon_events(user_id, created_at desc);

create table public.product_view_events (
  country char(2) not null check (country in ('CD', 'CG')),
  product_id uuid not null references public.products(id) on delete cascade,
  visitor_hash text not null,
  bucket timestamptz not null,
  viewed_at timestamptz not null default now(),
  primary key (country, product_id, visitor_hash, bucket)
);
create index product_view_period_idx on public.product_view_events(country, product_id, viewed_at);

create table public.faq_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  question text not null,
  resolved boolean not null,
  updated_at timestamptz not null default now()
);

-- Authorization helpers are SECURITY DEFINER and have a fixed search_path.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function private.is_store_member(target_store_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores s
    where s.id = target_store_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.store_members sm
    where sm.store_id = target_store_id and sm.user_id = auth.uid()
  );
$$;

create or replace function private.is_store_owner(target_store_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores s
    where s.id = target_store_id and s.owner_id = auth.uid()
  );
$$;

create or replace function private.can_access_order(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_admin()
    or exists (select 1 from public.orders o where o.id = target_order_id and o.buyer_id = auth.uid())
    or exists (select 1 from public.order_participants p where p.order_id = target_order_id and p.user_id = auth.uid());
$$;

create or replace function private.validate_courier_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.orders o
    join public.deliveries d on d.order_id = o.id
    where o.id = new.order_id
      and o.buyer_id = new.buyer_id
      and d.courier_id = new.courier_id
      and o.status in ('delivered', 'received')
  ) then
    raise exception 'Courier review must target the courier assigned to a delivered order';
  end if;
  return new;
end;
$$;

create trigger courier_review_matches_delivery before insert or update on public.courier_reviews
for each row execute function private.validate_courier_review();

-- Row Level Security: backend webhooks use the service role; clients receive least privilege.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.account_identifiers enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_participants enable row level security;
alter table public.deliveries enable row level security;
alter table public.order_messages enable row level security;
alter table public.seller_reviews enable row level security;
alter table public.courier_reviews enable row level security;
alter table public.identity_checks enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.refunds enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payout_accounts enable row level security;
alter table public.payouts enable row level security;
alter table public.coupon_events enable row level security;
alter table public.product_view_events enable row level security;
alter table public.faq_feedback enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or private.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy roles_self_read on public.user_roles for select using (user_id = auth.uid() or private.is_admin());
create policy identifiers_self_read on public.account_identifiers for select using (user_id = auth.uid() or private.is_admin());

create policy stores_public_read on public.stores for select using (status = 'approved' or private.is_store_member(id) or private.is_admin());
create policy stores_owner_insert on public.stores for insert
with check (owner_id = auth.uid() and status = 'pending' and not verified);
create policy stores_member_update on public.stores for update
using (private.is_store_owner(id))
with check (private.is_store_owner(id) and status in ('pending', 'rejected') and not verified);
create policy store_members_read on public.store_members for select using (private.is_store_member(store_id) or private.is_admin());
create policy store_members_owner_write on public.store_members for all using (private.is_store_owner(store_id)) with check (private.is_store_owner(store_id));

create policy categories_read on public.categories for select using (active or private.is_admin());
create policy subcategories_read on public.subcategories for select using (active or private.is_admin());
create policy products_public_read on public.products for select using ((visible and status = 'approved') or private.is_store_member(store_id) or private.is_admin());
create policy products_store_insert on public.products for insert
with check (owner_id = auth.uid() and private.is_store_member(store_id) and status in ('draft', 'pending') and not visible);
create policy products_store_update on public.products for update
using (private.is_store_member(store_id))
with check (private.is_store_member(store_id) and status in ('draft', 'pending') and not visible);
create policy product_images_read on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and ((p.visible and p.status = 'approved') or private.is_store_member(p.store_id) or private.is_admin())));
create policy product_images_store_write on public.product_images for all using (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id))) with check (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)));

create policy wishlist_self on public.wishlist_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_participant_read on public.orders for select using (private.can_access_order(id));
create policy order_items_participant_read on public.order_items for select using (private.can_access_order(order_id));
create policy participants_self_read on public.order_participants for select using (user_id = auth.uid() or private.is_admin());
create policy deliveries_participant_read on public.deliveries for select using (private.can_access_order(order_id));
create policy deliveries_courier_update on public.deliveries for update using (courier_id = auth.uid() or private.is_admin()) with check (courier_id = auth.uid() or private.is_admin());
create policy messages_participant_read on public.order_messages for select using (private.can_access_order(order_id));
create policy messages_participant_insert on public.order_messages for insert with check (sender_id = auth.uid() and private.can_access_order(order_id));

create policy seller_reviews_public_read on public.seller_reviews for select using (true);
create policy seller_reviews_buyer_insert on public.seller_reviews for insert with check (buyer_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid() and o.status in ('delivered', 'received')));
create policy courier_reviews_public_read on public.courier_reviews for select using (true);
create policy courier_reviews_buyer_insert on public.courier_reviews for insert with check (buyer_id = auth.uid());

create policy identity_self_read on public.identity_checks for select using (user_id = auth.uid() or private.is_admin());
create policy identity_self_submit on public.identity_checks for insert with check (user_id = auth.uid());
create policy identity_self_replace_pending on public.identity_checks for update using (user_id = auth.uid() and status in ('pending', 'rejected')) with check (user_id = auth.uid() and status = 'pending');
create policy payments_buyer_read on public.payment_transactions for select using (private.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy refunds_requester_read on public.refunds for select using (requested_by = auth.uid() or private.can_access_order(order_id));
create policy ledger_store_read on public.ledger_entries for select using (private.is_admin() or (store_id is not null and private.is_store_member(store_id)) or courier_id = auth.uid());
create policy payout_accounts_self_read on public.payout_accounts for select using (user_id = auth.uid() or private.is_admin());
create policy payouts_beneficiary_read on public.payouts for select using (beneficiary_id = auth.uid() or private.is_admin());
create policy coupons_self_read on public.coupon_events for select using (user_id = auth.uid() or private.is_admin());
create policy faq_feedback_own_read on public.faq_feedback for select using (user_id = auth.uid() or private.is_admin());
create policy faq_feedback_submit on public.faq_feedback for insert with check (user_id is null or user_id = auth.uid());

-- Financial tables intentionally have no client insert/update policies. Trusted webhook
-- handlers use the Supabase service role after verifying provider signatures.

-- Explicit Data API grants. RLS chooses rows; grants choose reachable objects.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

grant select on public.stores, public.categories, public.subcategories,
  public.products, public.product_images, public.seller_reviews,
  public.courier_reviews to anon;

grant select on all tables in schema public to authenticated;
grant update (first_name, last_name, phone, email, address, residence_country,
  currency, preferred_language, privacy_version, privacy_accepted_at)
  on public.profiles to authenticated;
grant insert, update on public.stores to authenticated;
grant insert, update, delete on public.store_members to authenticated;
grant insert, update on public.products to authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant insert, update, delete on public.wishlist_items to authenticated;
grant update on public.deliveries to authenticated;
grant insert on public.order_messages, public.seller_reviews,
  public.courier_reviews, public.faq_feedback to authenticated;
grant usage on all sequences in schema public to authenticated;

grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_store_member(bigint) to anon, authenticated;
grant execute on function private.is_store_owner(bigint) to authenticated;
grant execute on function private.can_access_order(uuid) to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema private to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
