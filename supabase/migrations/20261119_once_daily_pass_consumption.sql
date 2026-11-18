begin;
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
commit;
