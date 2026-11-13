create type public.freewill_instrument as enum ('drums', 'bass', 'keys', 'guitars');

create table public.freewill_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  order_index integer not null unique check (order_index > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.freewill_instrument_progress (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.freewill_tracks on delete cascade,
  instrument public.freewill_instrument not null,
  rdy_completed boolean not null default false,
  rdy_date date,
  rdy_note text check (char_length(rdy_note) <= 200),
  rec_completed boolean not null default false,
  rec_date date,
  rec_note text check (char_length(rec_note) <= 200),
  updated_at timestamptz not null default now(),
  unique (track_id, instrument)
);

create table public.freewill_stage_preparation (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null unique references public.freewill_tracks on delete cascade,
  prg_completed boolean not null default false,
  prg_date date,
  prg_note text check (char_length(prg_note) <= 200),
  cue_completed boolean not null default false,
  cue_date date,
  cue_note text check (char_length(cue_note) <= 200),
  updated_at timestamptz not null default now()
);

alter table public.freewill_tracks enable row level security;
alter table public.freewill_instrument_progress enable row level security;
alter table public.freewill_stage_preparation enable row level security;

revoke all on public.freewill_tracks, public.freewill_instrument_progress,
  public.freewill_stage_preparation from public, anon, authenticated;
grant select, insert, update on public.freewill_tracks,
  public.freewill_instrument_progress, public.freewill_stage_preparation to service_role;

-- Snapshot shape: [{title, instruments: {drums: {rdy, rec}, bass: {...}, ...}}].
-- Array positions identify original seed rows even after renames.
create function public.seed_freewill_tracker(snapshot jsonb) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(snapshot) is distinct from 'array' or jsonb_array_length(snapshot) <> 10 then
    raise exception 'The FREEWILL seed requires ten tracks';
  end if;

  insert into public.freewill_tracks (order_index, title)
  select position, item->>'title'
  from jsonb_array_elements(snapshot) with ordinality as seed(item, position)
  on conflict (order_index) do nothing;

  insert into public.freewill_instrument_progress (track_id, instrument, rdy_completed, rec_completed)
  select
    track.id,
    group_name.instrument,
    (seed.item->'instruments'->group_name.instrument::text->>'rdy')::boolean,
    (seed.item->'instruments'->group_name.instrument::text->>'rec')::boolean
  from jsonb_array_elements(snapshot) with ordinality as seed(item, position)
  join public.freewill_tracks as track on track.order_index = seed.position
  cross join unnest(enum_range(null::public.freewill_instrument)) as group_name(instrument)
  on conflict (track_id, instrument) do nothing;

  insert into public.freewill_stage_preparation (track_id)
  select id from public.freewill_tracks where order_index between 1 and 10
  on conflict (track_id) do nothing;
end;
$$;

revoke all on function public.seed_freewill_tracker(jsonb) from public, anon, authenticated;
grant execute on function public.seed_freewill_tracker(jsonb) to service_role;
