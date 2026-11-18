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

-- 1. Create the membership_plans table with unique title as Primary Key
create table if not exists public.membership_plans (
  title text primary key,
  description text not null default 'Custom Promo',
  activity text not null default 'Gym', -- 'ALL' for built-in default tiers, or locked to a specific activity
  promo_type text not null check (promo_type in ('daily_pass', 'time_based')),
  pass_count integer, -- Number of passes for 'daily_pass' promos (NULL for 'time_based')
  duration_days integer not null, -- 0 for single Daily Pass, 360 for pass bundles, N*30 for months
  price numeric not null default 0,
  student_price numeric, -- Optional student price
  is_custom boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.membership_plans enable row level security;

create policy "Allow public membership_plans reads"
  on public.membership_plans for select to anon using (true);

create policy "Allow public membership_plans inserts"
  on public.membership_plans for insert to anon with check (true);

create policy "Allow public membership_plans updates"
  on public.membership_plans for update to anon using (true) with check (true);

create policy "Allow public membership_plans deletes"
  on public.membership_plans for delete to anon using (true);

-- 2. Seed the two default plans so existing members('Daily Pass', '1 Month') satisfy the FK
insert into public.membership_plans (title, description, activity, promo_type, pass_count, duration_days, price, student_price, is_custom)
values
  ('Daily Pass', 'Valid today', 'ALL', 'daily_pass', 1, 0, 100, 100, false),
  ('1 Month', 'Short term', 'ALL', 'time_based', null, 30, 1000, 800, false)
on conflict (title) do nothing;

-- Safety backfill: if any existing members have a custom plan string not yet in membership_plans, insert a placeholder
insert into public.membership_plans (title, description, activity, promo_type, pass_count, duration_days, price, student_price, is_custom)
select distinct m.plan, 'Legacy Plan', m.activity, 'time_based', null, 30, m.price, null, true
from public.members m
where not exists (
  select 1 from public.membership_plans mp where mp.title = m.plan
);

-- 3. Alter public.members to add remaining_passes and the foreign key on plan -> membership_plans(title)
alter table public.members add column if not exists remaining_passes integer;

do $$ begin if not exists ( select 1 from pg_constraint where conname = 'members_plan_fkey' ) then alter table public.members add constraint members_plan_fkey foreign key (plan) references public.membership_plans(title) on update cascade on delete restrict; end if; end $$;
-- Collect home addresses while keeping historical emails and memberships intact.
alter table public.members add column if not exists address text not null default '';
do $$ begin
  if exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='members' and column_name='email') then
    alter table public.members alter column email set default '';
  end if;
end $$;
-- Daily Pass remains in the catalog for historical references; the UI no longer offers it.

-- One pass per Philippine attendance date, shared across scanner devices.
alter table public.members add column if not exists last_pass_date date;
-- Recognize previous check-ins without refunding any historical deductions.
update public.members m set last_pass_date = (
  select max((a.checked_in_at at time zone 'Asia/Manila')::date)
  from public.attendance a
  where a.member_id=m.id and a.activity=m.activity
    and (a.checked_in_at at time zone 'Asia/Manila')::date >= m.registration_date
) where m.remaining_passes is not null and m.last_pass_date is null;

create or replace function public.check_in_pass_once_per_day(p_member_id text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  m public.members%rowtype;
  a public.attendance%rowtype;
  gym_date date := (now() at time zone 'Asia/Manila')::date;
  already_today boolean;
begin
  select * into m from public.members where id=p_member_id for update;
  if not found then raise exception 'Member not found.'; end if;
  if m.remaining_passes is null then raise exception 'This membership has no pass allowance.'; end if;
  if m.expiry_date < gym_date then raise exception 'Membership expired.'; end if;
  already_today := coalesce(m.last_pass_date = gym_date, false);
  if not already_today then
    if m.remaining_passes <= 0 then raise exception 'No passes remaining.'; end if;
    update public.members set remaining_passes=remaining_passes-1,
      last_pass_date=gym_date, check_ins=check_ins+1
      where id=p_member_id returning * into m;
  end if;
  -- Reuse today's attendance for reentry, including records made before this migration.
  if already_today then
    select * into a from public.attendance
      where member_id=m.id and activity=m.activity
        and (checked_in_at at time zone 'Asia/Manila')::date=gym_date
      order by checked_in_at desc limit 1;
  end if;
  if a.id is null then
    insert into public.attendance(id,member_id,member_name,activity,attendance_date,checked_in_at)
      values(m.id || '-pass-' || gym_date::text,m.id,m.name,m.activity,gym_date,now())
      on conflict(id) do nothing;
    select * into a from public.attendance where id=m.id || '-pass-' || gym_date::text;
  end if;
  return jsonb_build_object('member',to_jsonb(m),'attendance',to_jsonb(a),'consumed',not already_today);
end;
$$;
