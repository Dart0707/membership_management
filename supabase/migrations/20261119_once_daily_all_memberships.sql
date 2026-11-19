begin;
-- Count attendance once per member per Philippine calendar day, for all plans.
alter table public.members add column if not exists last_pass_date date;
alter table public.members add column if not exists last_check_in_date date;
-- Preserve historical totals. Recognize existing attendance for re-entry after rollout.
update public.members m set last_check_in_date = (
 select max((a.checked_in_at at time zone 'Asia/Manila')::date)
 from public.attendance a where a.member_id=m.id and a.activity=m.activity
   and (a.checked_in_at at time zone 'Asia/Manila')::date >= m.registration_date
) where m.last_check_in_date is null;

create or replace function public.check_in_member_once_per_day(p_member_id text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
 m public.members%rowtype;
 a public.attendance%rowtype;
 gym_date date := (now() at time zone 'Asia/Manila')::date;
 already_today boolean;
begin
 select * into m from public.members where id=p_member_id for update;
 if not found then raise exception 'Member not found.'; end if;
 if m.expiry_date < gym_date then raise exception 'Membership expired.'; end if;
 already_today := coalesce(m.last_check_in_date=gym_date,false)
   or (m.remaining_passes is not null and coalesce(m.last_pass_date=gym_date,false));
 if not already_today then
   if m.remaining_passes is not null and m.remaining_passes <= 0 then raise exception 'No passes remaining.'; end if;
   update public.members set check_ins=check_ins+1, last_check_in_date=gym_date,
     remaining_passes=case when remaining_passes is null then null else remaining_passes-1 end,
     last_pass_date=case when remaining_passes is null then last_pass_date else gym_date end
     where id=p_member_id returning * into m;
 end if;
 if already_today then
   select * into a from public.attendance where member_id=m.id and activity=m.activity
     and (checked_in_at at time zone 'Asia/Manila')::date=gym_date
     order by checked_in_at desc limit 1;
 end if;
 if a.id is null then
   insert into public.attendance(id,member_id,member_name,activity,attendance_date,checked_in_at)
     values(m.id || '-attendance-' || gym_date::text,m.id,m.name,m.activity,gym_date,now())
     on conflict(id) do nothing;
   select * into a from public.attendance where id=m.id || '-attendance-' || gym_date::text;
 end if;
 return jsonb_build_object('member',to_jsonb(m),'attendance',to_jsonb(a),'already_today',already_today);
end;
$$;

-- Keep the previous RPC available for clients that have not refreshed yet.
create or replace function public.check_in_pass_once_per_day(p_member_id text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb;
begin
 result := public.check_in_member_once_per_day(p_member_id);
 return result || jsonb_build_object('consumed',not (result->>'already_today')::boolean
   and (result->'member'->>'remaining_passes') is not null);
end;
$$;
commit;
