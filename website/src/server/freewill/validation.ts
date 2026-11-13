import {
  groupStatuses,
  groups,
  noteLimit,
  titleLimit,
  type Edit,
  type Group,
  type Status,
} from '../../data/freewill';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000'))
    return false;
  const parsed = new Date(value);
  return (
    Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value
  );
}

export function parseEdit(input: unknown): Edit | null {
  const { trackId, group, status, field, value } = record(input);
  if (typeof trackId !== 'string' || !uuid.test(trackId)) return null;

  if (field === 'title') {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.trim().length > titleLimit ||
      /[\r\n]/.test(value) ||
      value.includes(String.fromCharCode(0))
    )
      return null;
    return { trackId, field, value: value.trim() };
  }

  if (!groups.includes(group as Group)) return null;
  const editGroup = group as Group;
  if (
    !(groupStatuses[editGroup] as readonly Status[]).includes(status as Status)
  )
    return null;
  const target = { trackId, group: editGroup, status: status as Status };

  if (field === 'completed' && typeof value === 'boolean')
    return { ...target, field, value };
  if (
    field === 'date' &&
    (value === null || (typeof value === 'string' && validDate(value)))
  ) {
    return { ...target, field, value };
  }
  if (
    field === 'note' &&
    (value === null ||
      (typeof value === 'string' &&
        value.length <= noteLimit &&
        !value.includes(String.fromCharCode(0))))
  ) {
    return { ...target, field, value: value || null };
  }
  return null;
}
