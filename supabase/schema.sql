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
