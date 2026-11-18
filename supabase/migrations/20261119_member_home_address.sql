begin;
-- Collect home addresses while keeping historical emails and memberships intact.
alter table public.members add column if not exists address text not null default '';
do $$ begin
  if exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='members' and column_name='email') then
    alter table public.members alter column email set default '';
  end if;
end $$;
-- Daily Pass remains in the catalog for historical references; the UI no longer offers it.
commit;
