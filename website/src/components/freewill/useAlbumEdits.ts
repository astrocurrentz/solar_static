import { useRef, useState } from 'react';
import {
  applyEdit,
  freewillApi,
  type Album,
  type Edit,
} from '../../data/freewill';

type Entry = { edit: Edit; phase: 'queued' | 'saving' | 'failed' };

function editKey(edit: Edit) {
  return edit.field === 'title'
    ? `${edit.trackId}/title`
    : `${edit.trackId}/${edit.group}/${edit.status}/${edit.field}`;
}

export function useAlbumEdits(onExpired: () => void) {
  const [saved, setSaved] = useState<Album | null>(null);
  const [edits, setEdits] = useState<Entry[]>([]);
  const pending = useRef(new Map<string, Entry>());
  const running = useRef(false);

  function publish() {
    setEdits([...pending.current.values()]);
  }

  async function drain() {
    if (running.current) return;
    running.current = true;
    try {
      let next = [...pending.current].find(
        ([, entry]) => entry.phase === 'queued',
      );
      while (next) {
        const [key, entry] = next;
        entry.phase = 'saving';
        publish();
        try {
          const response = await fetch(`${freewillApi}edit`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry.edit),
          });
          if (response.status === 401 || response.status === 403) {
            for (const item of pending.current.values()) item.phase = 'failed';
            setSaved(null);
            onExpired();
            break;
          }
          if (!response.ok) throw new Error();
          const { edit } = (await response.json()) as { edit: Edit };
          setSaved((album) => album && applyEdit(album, edit));
          if (pending.current.get(key) === entry) pending.current.delete(key);
        } catch {
          if (pending.current.get(key) === entry) entry.phase = 'failed';
        }
        next = [...pending.current].find(
          ([, entry]) => entry.phase === 'queued',
        );
      }
    } finally {
      running.current = false;
      publish();
    }
  }

  function update(edit: Edit) {
    const key = editKey(edit);
    pending.current.set(key, { edit, phase: 'queued' });
    publish();
    void drain();
  }

  function retry() {
    for (const entry of pending.current.values()) {
      if (entry.phase === 'failed') entry.phase = 'queued';
    }
    publish();
    void drain();
  }

  return {
    album:
      saved &&
      edits.reduce((album, entry) => applyEdit(album, entry.edit), saved),
    setSaved,
    update,
    retry,
    saving: edits.some((entry) => entry.phase !== 'failed'),
    failed: edits.some((entry) => entry.phase === 'failed'),
  };
}
