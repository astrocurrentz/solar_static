export const instruments = ['drums', 'bass', 'keys', 'guitars'] as const;
export const groups = [...instruments, 'stage'] as const;
export const statuses = ['rdy', 'rec', 'prg', 'cue'] as const;
export type Instrument = (typeof instruments)[number];
export type Group = (typeof groups)[number];
export type Status = (typeof statuses)[number];

export const groupStatuses = {
  drums: ['rdy', 'rec'],
  bass: ['rdy', 'rec'],
  keys: ['rdy', 'rec'],
  guitars: ['rdy', 'rec'],
  stage: ['prg', 'cue'],
} as const satisfies Record<Group, readonly Status[]>;

export const noteLimit = 200;
export const titleLimit = 120;

export type Progress = {
  completed: boolean;
  date: string | null;
  note: string | null;
};

export type Track = {
  id: string;
  order: number;
  title: string;
  progress: Record<Instrument, Record<'rdy' | 'rec', Progress>> & {
    stage: Record<'prg' | 'cue', Progress>;
  };
};

export type Album = { tracks: Track[] };

type ProgressEdit = {
  trackId: string;
  group: Group;
  status: Status;
} & (
  | { field: 'completed'; value: boolean }
  | { field: 'date' | 'note'; value: string | null }
);

export type Edit =
  { trackId: string; field: 'title'; value: string } | ProgressEdit;

export const freewillCopy = {
  title: 'FREEWILL Album Tracker',
  album: 'FREEWILL',
  subtitle: 'Debut album / Production tracker',
  listing: 'Production and stage preparation for the debut album.',
  groups: {
    drums: 'Drums',
    bass: 'Bass',
    keys: 'Keys',
    guitars: 'Guitars',
    stage: 'Program & Cue',
  },
  statuses: {
    rdy: 'Performance Ready',
    rec: 'Recording Complete',
    prg: 'Programming Complete',
    cue: 'Cue Ready',
  },
  stageReady: 'Stage Setup Ready',
  stagePending: 'Stage Setup Pending',
  albumProgress: 'Album progress',
  instrumentProgress: 'Recording by instrument',
  track: 'Track',
  checklist: 'Track checklist',
  filters: 'Filters',
  instrumentFilter: 'Instrument',
  statusFilter: 'Status',
  allTracks: 'All tracks',
  allGroups: 'All instruments and stage',
  allStatuses: 'All statuses',
  incomplete: 'Incomplete only',
  reset: 'Reset filters',
  empty: 'No statuses match these filters.',
  details: 'Details',
  editName: 'Edit track name',
  trackName: 'Track name',
  date: 'Completion date',
  note: 'Note',
  close: 'Close',
  email: 'Email',
  password: 'Password',
  setPassword: 'Set your password',
  confirmPassword: 'Confirm password',
  passwordRequirements: 'Use at least 12 characters.',
  passwordMismatch: 'The passwords do not match.',
  passwordError: 'The password could not be saved. Try a different password.',
  inviteError:
    'This sign-in link could not be used. Try a fresh invite or sign in with your password.',

  signIn: 'Sign in',
  signingIn: 'Signing in…',
  signOut: 'Sign out',
  signedOut: 'Your session ended. Sign in to continue.',
  signInError: 'Sign-in failed. Check your email and password and try again.',
  loading: 'Loading tracker…',
  loadError: 'The tracker could not be loaded.',
  retry: 'Retry',
  retryEdits: 'Retry unsaved edits',
  saving: 'Saving…',
  saved: 'All changes saved',
  saveError: 'Some edits could not be saved.',
  exportError: 'The export could not be downloaded. Try again.',
  exportLabel: 'Export album',
  printNote: 'Full notes are available in CSV and JSON.',
  recordingCount: (count: number) => `REC ${count}/4`,
  readyCount: (count: number) => `RDY ${count}/4`,
};

export function getProgress(track: Track, group: Group, status: Status) {
  return (track.progress[group] as Partial<Record<Status, Progress>>)[status]!;
}

export function getTrackCounts(track: Track) {
  return {
    rdy: instruments.filter((group) => track.progress[group].rdy.completed)
      .length,
    rec: instruments.filter((group) => track.progress[group].rec.completed)
      .length,
    stage:
      track.progress.stage.prg.completed && track.progress.stage.cue.completed,
  };
}

export function getAlbumMetrics(album: Album) {
  const { tracks } = album;
  const counts = tracks.map(getTrackCounts);
  return [
    {
      label: freewillCopy.statuses.rdy,
      count: counts.reduce((sum, track) => sum + track.rdy, 0),
      total: tracks.length * instruments.length,
    },
    {
      label: freewillCopy.statuses.rec,
      count: counts.reduce((sum, track) => sum + track.rec, 0),
      total: tracks.length * instruments.length,
    },
    {
      label: freewillCopy.statuses.prg,
      count: tracks.filter((track) => track.progress.stage.prg.completed)
        .length,
      total: tracks.length,
    },
    {
      label: freewillCopy.statuses.cue,
      count: tracks.filter((track) => track.progress.stage.cue.completed)
        .length,
      total: tracks.length,
    },
    {
      label: freewillCopy.stageReady,
      count: counts.filter((track) => track.stage).length,
      total: tracks.length,
    },
  ];
}

export function applyEdit(album: Album, edit: Edit): Album {
  return {
    tracks: album.tracks.map((track) => {
      if (track.id !== edit.trackId) return track;
      if (edit.field === 'title') return { ...track, title: edit.value };
      const group = track.progress[edit.group];
      const progress = getProgress(track, edit.group, edit.status);
      return {
        ...track,
        progress: {
          ...track.progress,
          [edit.group]: {
            ...group,
            [edit.status]: { ...progress, [edit.field]: edit.value },
          },
        },
      };
    }),
  };
}
