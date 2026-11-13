import { useState } from 'react';
import {
  freewillApi,
  freewillCopy as copy,
  getAlbumMetrics,
  getProgress,
  getTrackCounts,
  groups,
  groupStatuses,
  instruments,
  statuses,
  type Album,
  type Edit,
  type Group,
  type Status,
  type Track,
} from '../../data/freewill';
import { TrackDetails } from './TrackDetails';

type Props = {
  album: Album;
  update: (edit: Edit) => void;
  retry: () => void;
  saving: boolean;
  failed: boolean;
  onExpired: () => void;
};

type Details = { trackId: string; group: Group | null; status?: Status };
type Filter = {
  track: string;
  group: Group | '';
  status: Status | '';
  incomplete: boolean;
};

const initialFilter: Filter = {
  track: '',
  group: '',
  status: '',
  incomplete: false,
};
const formats = ['csv', 'json', 'pdf'] as const;

function Metric({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const percentage = total ? Math.round((count / total) * 1000) / 10 : 0;
  return (
    <div className="freewill-metric">
      <dt>{label}</dt>
      <dd>
        <div>
          <strong>
            {count}
            <span>/{total}</span>
          </strong>
          <span>{percentage}%</span>
        </div>
        <progress aria-label={label} value={count} max={total || 1} />
      </dd>
    </div>
  );
}

function TrackIndicators({ track }: { track: Track }) {
  const { rdy, rec, stage } = getTrackCounts(track);
  return (
    <span className="freewill-indicators">
      <span>{copy.readyCount(rdy)}</span>
      <span data-complete={rec === 4}>{copy.recordingCount(rec)}</span>
      <span data-complete={stage}>
        {stage ? copy.stageReady : copy.stagePending}
      </span>
    </span>
  );
}

function visibleStatuses(track: Track, group: Group, filter: Filter) {
  return groupStatuses[group].filter(
    (status) =>
      (!filter.status || status === filter.status) &&
      (!filter.incomplete || !getProgress(track, group, status).completed),
  );
}

function FilterBar({
  album,
  filter,
  setFilter,
}: {
  album: Album;
  filter: Filter;
  setFilter: (filter: Filter) => void;
}) {
  return (
    <div className="freewill-filters" role="group" aria-label={copy.filters}>
      <label>
        {copy.track}
        <select
          aria-label={copy.track}
          value={filter.track}
          onChange={(event) =>
            setFilter({ ...filter, track: event.target.value })
          }
        >
          <option value="">{copy.allTracks}</option>
          {album.tracks.map((track) => (
            <option value={track.id} key={track.id}>
              {track.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        {copy.instrumentFilter}
        <select
          aria-label={copy.instrumentFilter}
          value={filter.group}
          onChange={(event) =>
            setFilter({
              ...filter,
              group: event.target.value as Filter['group'],
            })
          }
        >
          <option value="">{copy.allGroups}</option>
          {groups.map((group) => (
            <option value={group} key={group}>
              {copy.groups[group]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {copy.statusFilter}
        <select
          aria-label={copy.statusFilter}
          value={filter.status}
          onChange={(event) =>
            setFilter({
              ...filter,
              status: event.target.value as Filter['status'],
            })
          }
        >
          <option value="">{copy.allStatuses}</option>
          {statuses.map((status) => (
            <option value={status} key={status}>
              {status.toUpperCase()} · {copy.statuses[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="freewill-incomplete">
        <input
          type="checkbox"
          checked={filter.incomplete}
          onChange={(event) =>
            setFilter({ ...filter, incomplete: event.target.checked })
          }
        />
        {copy.incomplete}
      </label>
      <button type="button" onClick={() => setFilter(initialFilter)}>
        {copy.reset}
      </button>
    </div>
  );
}

export function Dashboard({
  album,
  update,
  retry,
  saving,
  failed,
  onExpired,
}: Props) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [details, setDetails] = useState<Details | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const columns = groups.filter(
    (group) =>
      (!filter.group || group === filter.group) &&
      (!filter.status ||
        (groupStatuses[group] as readonly Status[]).includes(filter.status)),
  );
  const tracks = album.tracks.filter(
    (track) =>
      (!filter.track || track.id === filter.track) &&
      columns.some((group) => visibleStatuses(track, group, filter).length),
  );
  const activeTrack = album.tracks.find(
    (track) => track.id === details?.trackId,
  );

  async function download(format: (typeof formats)[number]) {
    setExporting(true);
    setExportError(false);
    try {
      const response = await fetch(`${freewillApi}export?format=${format}`);
      if (response.status === 401 || response.status === 403) {
        onExpired();
        return;
      }
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `freewill-album.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  function controls(track: Track, group: Group) {
    const codes = visibleStatuses(track, group, filter);
    if (!codes.length) return null;
    return (
      <div className="freewill-controls">
        {codes.map((status) => {
          const item = getProgress(track, group, status);
          return (
            <label
              className="freewill-check"
              key={status}
              title={copy.statuses[status]}
            >
              <input
                type="checkbox"
                checked={item.completed}
                aria-label={`${track.title}, ${copy.groups[group]}, ${copy.statuses[status]}`}
                onChange={(event) =>
                  update({
                    trackId: track.id,
                    group,
                    status,
                    field: 'completed',
                    value: event.target.checked,
                  })
                }
              />
              {status.toUpperCase()}
            </label>
          );
        })}
        <button
          type="button"
          className="freewill-text-button"
          aria-label={`${copy.details}: ${track.title}, ${copy.groups[group]}`}
          onClick={() =>
            setDetails({
              trackId: track.id,
              group,
              status: filter.status || undefined,
            })
          }
        >
          {copy.details}
        </button>
      </div>
    );
  }

  function titleButton(track: Track) {
    return (
      <button
        type="button"
        className="freewill-text-button"
        aria-label={`${copy.editName}: ${track.title}`}
        onClick={() => setDetails({ trackId: track.id, group: null })}
      >
        {copy.editName}
      </button>
    );
  }

  return (
    <>
      <section aria-labelledby="freewill-album-progress">
        <h2 id="freewill-album-progress">{copy.albumProgress}</h2>
        <dl className="freewill-metrics">
          {getAlbumMetrics(album).map((metric) => (
            <Metric key={metric.label} {...metric} />
          ))}
        </dl>
      </section>
      <section aria-labelledby="freewill-checklist">
        <div className="freewill-section-heading">
          <h2 id="freewill-checklist">{copy.checklist}</h2>
          <span
            className={failed ? 'freewill-error' : 'freewill-save'}
            role="status"
          >
            {saving ? copy.saving : failed ? copy.saveError : copy.saved}
          </span>
          {failed && (
            <button type="button" onClick={retry}>
              {copy.retryEdits}
            </button>
          )}
        </div>
        <FilterBar album={album} filter={filter} setFilter={setFilter} />
        {!tracks.length ? (
          <p className="freewill-panel">{copy.empty}</p>
        ) : (
          <>
            <table
              className="freewill-table"
              aria-labelledby="freewill-checklist"
            >
              <thead>
                <tr>
                  <th scope="col">{copy.track}</th>
                  {columns.map((group) => (
                    <th scope="col" key={group}>
                      {copy.groups[group]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id}>
                    <th scope="row">
                      <span className="freewill-track-title">
                        {track.title}
                      </span>
                      <TrackIndicators track={track} />
                      {titleButton(track)}
                    </th>
                    {columns.map((group) => (
                      <td key={group}>{controls(track, group)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="freewill-mobile">
              {tracks.map((track) => (
                <details key={track.id}>
                  <summary>
                    <span className="freewill-track-title">{track.title}</span>
                    <TrackIndicators track={track} />
                  </summary>
                  <div className="freewill-mobile-content">
                    {titleButton(track)}
                    {columns
                      .filter(
                        (group) =>
                          visibleStatuses(track, group, filter).length > 0,
                      )
                      .map((group) => (
                        <div className="freewill-mobile-group" key={group}>
                          <strong>{copy.groups[group]}</strong>
                          {controls(track, group)}
                        </div>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
        <dl className="freewill-legend">
          {statuses.map((status) => (
            <div key={status}>
              <dt>{status.toUpperCase()}</dt>
              <dd>{copy.statuses[status]}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="freewill-instrument-progress">
        <h2 id="freewill-instrument-progress">{copy.instrumentProgress}</h2>
        <dl className="freewill-metrics freewill-metrics-instruments">
          {instruments.map((group) => (
            <Metric
              key={group}
              label={copy.groups[group]}
              count={
                album.tracks.filter(
                  (track) => track.progress[group].rec.completed,
                ).length
              }
              total={album.tracks.length}
            />
          ))}
        </dl>
      </section>
      <section aria-labelledby="freewill-exports">
        <h2 id="freewill-exports">{copy.exportLabel}</h2>
        <div className="freewill-export-buttons">
          {formats.map((format) => (
            <button
              key={format}
              type="button"
              disabled={exporting || saving || failed}
              onClick={() => void download(format)}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
        {exportError && (
          <p className="freewill-error" role="alert">
            {copy.exportError}
          </p>
        )}
      </section>
      {details && activeTrack && (
        <TrackDetails
          track={activeTrack}
          group={details.group}
          status={details.status}
          update={update}
          onClose={() => setDetails(null)}
        />
      )}
    </>
  );
}
