-- YatraOS core schema (roadmap Section 2 data model).
-- Integrates with Supabase Auth: `profiles` extends auth.users rather than
-- being a separate users table, so auth.uid() works directly in RLS.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'traveller' check (role in ('traveller', 'operator', 'vendor')),
  created_at timestamptz not null default now()
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  contact_info text
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  traveller_id uuid not null references profiles (id) on delete cascade,
  city text not null,
  currency text not null default 'INR', -- see data/seed/cities.json for the currency per city
  start_date date not null,
  end_date date not null,
  budget integer not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists nodes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  -- matches the seed data's `category` values, which the graph engine reads
  type text not null check (type in ('transport', 'stay', 'activity', 'eatery', 'meal')),
  name text not null,
  seed_place_id text, -- e.g. "act-01", links a node back to data/seed/<city>.json
  lat double precision,
  lng double precision,
  start_minutes integer, -- minutes from day start; what itinerary_builder emits
  duration_min integer not null default 0,
  cost integer not null default 0,
  status text not null default 'planned' check (status in ('planned', 'confirmed', 'at_risk', 'broken')),
  vendor_id uuid references vendors (id)
);

create table if not exists edges (
  trip_id uuid not null references trips (id) on delete cascade,
  from_node_id uuid not null references nodes (id) on delete cascade,
  to_node_id uuid not null references nodes (id) on delete cascade,
  dependency_type text not null default 'temporal' check (dependency_type in ('temporal', 'logical')),
  buffer_minutes integer not null default 0,
  primary key (from_node_id, to_node_id)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references nodes (id) on delete cascade,
  vendor_id uuid not null references vendors (id),
  confirmation_ref text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled'))
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  amount integer not null,
  razorpay_order_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded'))
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  person_name text not null, -- group members aren't necessarily app users
  node_id uuid references nodes (id) on delete cascade,
  amount integer not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_nodes_trip_id on nodes (trip_id);
create index if not exists idx_edges_trip_id on edges (trip_id);
create index if not exists idx_edges_from on edges (from_node_id);
create index if not exists idx_edges_to on edges (to_node_id);
create index if not exists idx_ledger_trip_id on ledger_entries (trip_id);
create index if not exists idx_trips_traveller on trips (traveller_id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The function is only meant to run from the trigger above. Leaving EXECUTE
-- granted exposes it at /rest/v1/rpc/handle_new_user (Supabase security
-- linter flags this). The trigger runs as table owner, so signup still works.
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_new_user() from public;

-- ---------------------------------------------------------------------------
-- Row Level Security. The backend uses the service-role key and bypasses all
-- of this; these policies exist so the frontend's anon key can read/write a
-- user's own data directly without a backend round-trip, and can never see
-- someone else's trip.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table trips enable row level security;
alter table nodes enable row level security;
alter table edges enable row level security;
alter table ledger_entries enable row level security;
alter table payments enable row level security;
alter table bookings enable row level security;
alter table vendors enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own trips" on trips;
create policy "own trips" on trips
  for all using (auth.uid() = traveller_id) with check (auth.uid() = traveller_id);

-- Child tables inherit access from the trip they belong to.
drop policy if exists "own trip nodes" on nodes;
create policy "own trip nodes" on nodes
  for all using (exists (select 1 from trips t where t.id = nodes.trip_id and t.traveller_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = nodes.trip_id and t.traveller_id = auth.uid()));

drop policy if exists "own trip edges" on edges;
create policy "own trip edges" on edges
  for all using (exists (select 1 from trips t where t.id = edges.trip_id and t.traveller_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = edges.trip_id and t.traveller_id = auth.uid()));

drop policy if exists "own trip ledger" on ledger_entries;
create policy "own trip ledger" on ledger_entries
  for all using (exists (select 1 from trips t where t.id = ledger_entries.trip_id and t.traveller_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = ledger_entries.trip_id and t.traveller_id = auth.uid()));

drop policy if exists "own trip payments" on payments;
create policy "own trip payments" on payments
  for all using (exists (select 1 from trips t where t.id = payments.trip_id and t.traveller_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = payments.trip_id and t.traveller_id = auth.uid()));

drop policy if exists "own trip bookings" on bookings;
create policy "own trip bookings" on bookings
  for all using (
    exists (
      select 1 from nodes n join trips t on t.id = n.trip_id
      where n.id = bookings.node_id and t.traveller_id = auth.uid()
    )
  );

-- Vendor catalogue is public reference data: readable by any signed-in user,
-- writable only via the service-role key (no insert/update policy).
drop policy if exists "vendors readable" on vendors;
create policy "vendors readable" on vendors for select using (true);
