import { useEffect, useRef } from 'react';
import {
  freewillCopy as copy,
  getProgress,
  groupStatuses,
  noteLimit,
  titleLimit,
  type Edit,
  type Group,
  type Status,
  type Track,
} from '../model';

type Props = {
  track: Track;
  group: Group | null;
  status?: Status;
  update: (edit: Edit) => void;
  onClose: () => void;
};

export function TrackDetails({ track, group, status, update, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="freewill-dialog"
      onClose={onClose}
      aria-labelledby="freewill-details-heading"
    >
      <div className="freewill-dialog-heading">
        <h2 id="freewill-details-heading">
          {group ? `${track.title} / ${copy.groups[group]}` : copy.editName}
        </h2>
        <button type="button" onClick={() => dialog.current?.close()}>
          {copy.close}
        </button>
      </div>
      {group ? (
        <div className="freewill-details-fields">
          {(status ? [status] : groupStatuses[group]).map((code) => {
            const progress = getProgress(track, group, code);
            return (
              <fieldset key={code}>
                <legend>
                  {code.toUpperCase()} · {copy.statuses[code]}
                </legend>
                <label>
                  {copy.date}
                  <input
                    type="date"
                    defaultValue={progress.date ?? ''}
                    min="0001-01-01"
                    max="9999-12-31"
                    onBlur={(event) => {
                      const input = event.currentTarget;
                      const value = input.value || null;
                      if (input.validity.valid && value !== progress.date) {
                        update({
                          trackId: track.id,
                          group,
                          status: code,
                          field: 'date',
                          value,
                        });
                      }
                    }}
                  />
                </label>
                <label>
                  {copy.note}
                  <textarea
                    rows={3}
                    maxLength={noteLimit}
                    defaultValue={progress.note ?? ''}
                    onBlur={(event) => {
                      const value = event.currentTarget.value || null;
                      if (value !== progress.note)
                        update({
                          trackId: track.id,
                          group,
                          status: code,
                          field: 'note',
                          value,
                        });
                    }}
                  />
                </label>
              </fieldset>
            );
          })}
        </div>
      ) : (
        <label>
          {copy.trackName}
          <input
            defaultValue={track.title}
            maxLength={titleLimit}
            required
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            onBlur={(event) => {
              const input = event.currentTarget;
              const value = input.value.trim();
              if (value && value !== track.title)
                update({ trackId: track.id, field: 'title', value });
              input.value = value || track.title;
            }}
          />
        </label>
      )}
    </dialog>
  );
}
