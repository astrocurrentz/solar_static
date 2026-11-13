alter table core.freewill_tracks
  add column arr_completed boolean not null default false,
  add column arr_date date,
  add column arr_note text check (char_length(arr_note) <= 200);

grant update (arr_completed, arr_date, arr_note)
  on core.freewill_tracks to authenticated;

notify pgrst, 'reload schema';
