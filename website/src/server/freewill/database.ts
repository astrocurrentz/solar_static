import { createClient } from '@supabase/supabase-js';
import {
  groupStatuses,
  instruments,
  type Album,
  type Edit,
  type Instrument,
  type Status,
  type Track,
} from '../../data/freewill';

type StatusColumns = Partial<
  Record<`${Status}_completed`, boolean> &
    Record<`${Status}_date` | `${Status}_note`, string | null>
>;

type TrackRow = {
  id: string;
  title: string;
  order_index: number;
  freewill_instrument_progress: (StatusColumns & { instrument: Instrument })[];
  freewill_stage_preparation: StatusColumns | null;
};

function database() {
  const url = process.env.FREEWILL_SUPABASE_URL;
  const key = process.env.FREEWILL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error('FREEWILL database configuration is missing');

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readStatus(row: StatusColumns, status: Status) {
  const completed = row[`${status}_completed`];
  if (typeof completed !== 'boolean')
    throw new Error('Incomplete FREEWILL seed');
  return {
    completed,
    date: row[`${status}_date`] ?? null,
    note: row[`${status}_note`] ?? null,
  };
}

function readTrack(row: TrackRow): Track {
  const progress = {} as Track['progress'];
  for (const group of instruments) {
    const entry = row.freewill_instrument_progress.find(
      (item) => item.instrument === group,
    );
    if (!entry) throw new Error('Incomplete FREEWILL instrument seed');
    progress[group] = {
      rdy: readStatus(entry, 'rdy'),
      rec: readStatus(entry, 'rec'),
    };
  }
  if (!row.freewill_stage_preparation)
    throw new Error('Incomplete FREEWILL stage seed');
  const [prg, cue] = groupStatuses.stage;
  progress.stage = {
    prg: readStatus(row.freewill_stage_preparation, prg),
    cue: readStatus(row.freewill_stage_preparation, cue),
  };
  return { id: row.id, order: row.order_index, title: row.title, progress };
}

export async function loadAlbum(): Promise<Album> {
  const { data, error } = await database()
    .from('freewill_tracks')
    .select(
      `
      id, title, order_index,
      freewill_instrument_progress(instrument, rdy_completed, rdy_date, rdy_note, rec_completed, rec_date, rec_note),
      freewill_stage_preparation(prg_completed, prg_date, prg_note, cue_completed, cue_date, cue_note)
    `,
    )
    .order('order_index')
    .overrideTypes<TrackRow[], { merge: false }>();
  if (error) throw error;
  if (data.length !== 10) throw new Error('Incomplete FREEWILL track seed');
  return { tracks: data.map(readTrack) };
}

export async function saveEdit(edit: Edit) {
  const client = database();
  const updated_at = new Date().toISOString();
  const result = await (async () => {
    if (edit.field === 'title') {
      return client
        .from('freewill_tracks')
        .update({ title: edit.value, updated_at })
        .eq('id', edit.trackId)
        .select('id')
        .maybeSingle();
    }
    const patch = { [`${edit.status}_${edit.field}`]: edit.value, updated_at };
    if (edit.group === 'stage') {
      return client
        .from('freewill_stage_preparation')
        .update(patch)
        .eq('track_id', edit.trackId)
        .select('id')
        .maybeSingle();
    }
    return client
      .from('freewill_instrument_progress')
      .update(patch)
      .eq('track_id', edit.trackId)
      .eq('instrument', edit.group)
      .select('id')
      .maybeSingle();
  })();
  if (result.error) throw result.error;
  return result.data !== null;
}
