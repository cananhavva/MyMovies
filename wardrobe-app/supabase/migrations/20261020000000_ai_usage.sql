-- Per-device daily AI quota for the Edge Function proxy (20 analyses/day by default).
create table if not exists public.ai_usage (
  device_id text not null,
  day date not null,
  count integer not null default 0,
  primary key (device_id, day)
);

-- Only the Edge Functions (service role) touch this table.
alter table public.ai_usage enable row level security;

-- Atomically increments the counter; returns false once the limit is reached.
create or replace function public.consume_ai_quota(p_device_id text, p_day date, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage as u (device_id, day, count)
  values (p_device_id, p_day, 1)
  on conflict (device_id, day)
  do update set count = u.count + 1
  where u.count < p_limit
  returning u.count into new_count;

  return new_count is not null;
end;
$$;

revoke all on function public.consume_ai_quota(text, date, integer) from public, anon, authenticated;

-- Old rows are useless after the day ends; keep a week for abuse investigation.
create index if not exists ai_usage_day_idx on public.ai_usage (day);
