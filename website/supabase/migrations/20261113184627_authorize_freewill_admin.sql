create table public.freewill_admins (
  user_id uuid primary key references auth.users on delete cascade
);

alter table public.freewill_admins enable row level security;
revoke all on public.freewill_admins from public, anon, authenticated;
grant select on public.freewill_admins to authenticated;

create policy freewill_admin_membership on public.freewill_admins
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.freewill_tracks, public.freewill_instrument_progress,
  public.freewill_stage_preparation to authenticated;
grant update (title, updated_at) on public.freewill_tracks to authenticated;
grant update (rdy_completed, rdy_date, rdy_note, rec_completed, rec_date, rec_note, updated_at)
  on public.freewill_instrument_progress to authenticated;
grant update (prg_completed, prg_date, prg_note, cue_completed, cue_date, cue_note, updated_at)
  on public.freewill_stage_preparation to authenticated;

do $$
declare
  table_name text;
  admin_check text := '(select auth.uid()) in (select user_id from public.freewill_admins)';
begin
  foreach table_name in array array['freewill_tracks', 'freewill_instrument_progress', 'freewill_stage_preparation']
  loop
    execute format('create policy freewill_admin_read on public.%I for select to authenticated using (%s)', table_name, admin_check);
    execute format('create policy freewill_admin_edit on public.%I for update to authenticated using (%s) with check (%s)', table_name, admin_check, admin_check);
  end loop;
end
$$;
