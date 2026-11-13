create schema if not exists core;
grant usage on schema core to authenticated, service_role;

alter type public.freewill_instrument set schema core;
alter table public.freewill_tracks set schema core;
alter table public.freewill_instrument_progress set schema core;
alter table public.freewill_stage_preparation set schema core;
alter table public.freewill_admins set schema core;

-- Snapshot shape: [{title, instruments: {drums: {rdy, rec}, bass: {...}, ...}}].
-- Array positions identify original seed rows even after renames.
create or replace function public.seed_freewill_tracker(snapshot jsonb) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(snapshot) is distinct from 'array' or jsonb_array_length(snapshot) <> 10 then
    raise exception 'The FREEWILL seed requires ten tracks';
  end if;

  insert into core.freewill_tracks (order_index, title)
  select position, item->>'title'
  from jsonb_array_elements(snapshot) with ordinality as seed(item, position)
  on conflict (order_index) do nothing;

  insert into core.freewill_instrument_progress (track_id, instrument, rdy_completed, rec_completed)
  select
    track.id,
    group_name.instrument,
    (seed.item->'instruments'->group_name.instrument::text->>'rdy')::boolean,
    (seed.item->'instruments'->group_name.instrument::text->>'rec')::boolean
  from jsonb_array_elements(snapshot) with ordinality as seed(item, position)
  join core.freewill_tracks as track on track.order_index = seed.position
  cross join unnest(enum_range(null::core.freewill_instrument)) as group_name(instrument)
  on conflict (track_id, instrument) do nothing;

  insert into core.freewill_stage_preparation (track_id)
  select id from core.freewill_tracks where order_index between 1 and 10
  on conflict (track_id) do nothing;
end;
$$;

revoke all on function public.seed_freewill_tracker(jsonb) from public, anon, authenticated;
grant execute on function public.seed_freewill_tracker(jsonb) to service_role;

notify pgrst, 'reload schema';
