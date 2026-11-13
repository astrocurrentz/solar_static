import { getProgress, groups, groupStatuses, type Album } from '../model';

function csvField(value: string | number | boolean | null) {
  const text = String(value ?? '');
  // Neutralize spreadsheet formulas in editable titles and notes.
  const safe =
    typeof value === 'string' && /^\s*[=+\-@\t\r\n]/u.test(text)
      ? `'${text}`
      : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createCsv(album: Album) {
  const rows = [
    [
      'track_id',
      'order',
      'title',
      'group',
      'status',
      'completed',
      'completion_date',
      'note',
    ]
      .map(csvField)
      .join(','),
  ];
  for (const track of album.tracks) {
    for (const group of groups) {
      for (const status of groupStatuses[group]) {
        const { completed, date, note } = getProgress(track, group, status);
        rows.push(
          [
            track.id,
            track.order,
            track.title,
            group,
            status.toUpperCase(),
            completed,
            date,
            note,
          ]
            .map(csvField)
            .join(','),
        );
      }
    }
  }
  return `\ufeff${rows.join('\r\n')}\r\n`;
}
