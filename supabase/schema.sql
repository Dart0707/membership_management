create table if not exists public.members (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  plan text not null,
  activity text not null default 'Gym',
  is_student boolean not null default false,
  price numeric not null default 0,
  registration_date date not null,
  expiry_date date not null,
  check_ins integer not null default 0
);

alter table public.members add column if not exists activity text not null default 'Gym';
alter table public.members add column if not exists is_student boolean not null default false;
alter table public.members add column if not exists price numeric not null default 0;

alter table public.members enable row level security;

create policy "Allow public member reads"
  on public.members for select
  to anon
  using (true);

create policy "Allow public member inserts"
  on public.members for insert
  to anon
  with check (true);

create policy "Allow public member updates"
  on public.members for update
  to anon
  using (true)
  with check (true);

create policy "Allow public member deletes"
  on public.members for delete
  to anon
  using (true);

create table if not exists public.attendance (
  id text primary key,
  member_id text not null references public.members(id) on delete cascade,
  member_name text not null,
  activity text not null,
  attendance_date date not null,
  checked_in_at timestamptz not null default now()
);

alter table public.attendance enable row level security;

create policy "Allow public attendance reads"
  on public.attendance for select
  to anon
  using (true);

create policy "Allow public attendance inserts"
  on public.attendance for insert
  to anon
  with check (true);
