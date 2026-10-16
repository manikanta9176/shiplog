export type Entry = {
  id: string;
  date: string;
  shipped: string;
  link: string;
  note: string;
  createdAt: string;
};

export type EntryDraft = {
  date: string;
  shipped: string;
  link: string;
  note: string;
};

export type EntryResult =
  | { ok: true; value: EntryDraft }
  | { ok: false; error: string };

export function validateDraft(draft: EntryDraft): EntryResult {
  const date = draft.date.trim();
  const shipped = draft.shipped.trim();
  const link = draft.link.trim();
  const note = draft.note.trim();

  if (!isRealDate(date)) return { ok: false, error: "Enter a date" };
  if (shipped === "") return { ok: false, error: "Write what shipped" };
  if (link !== "" && !isHttpUrl(link)) {
    return { ok: false, error: "Enter an http or https link" };
  }

  return { ok: true, value: { date, shipped, link, note } };
}

export function groupByDay(
  entries: Entry[],
): { date: string; entries: Entry[] }[] {
  const byDate = new Map<string, Entry[]>();
  for (const entry of entries) {
    const day = byDate.get(entry.date) ?? [];
    day.push(entry);
    byDate.set(entry.date, day);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => (left < right ? 1 : left > right ? -1 : 0))
    .map(([date, dayEntries]) => ({
      date,
      entries: [...dayEntries].sort((left, right) =>
        left.createdAt < right.createdAt
          ? 1
          : left.createdAt > right.createdAt
            ? -1
            : 0,
      ),
    }));
}

export function markdownForDay(date: string, entries: Entry[]): string {
  const lines = [`## ${date}`, ""];
  for (const entry of entries) {
    const title = entry.link ? `${entry.shipped} — ${entry.link}` : entry.shipped;
    lines.push(`- ${title}`);
    if (entry.note) lines.push(`  ${entry.note}`);
  }
  return lines.join("\n");
}

export function upsertEntry(entries: Entry[], entry: Entry): Entry[] {
  const existing = entries.find((item) => item.id === entry.id);
  if (!existing) return [...entries, entry];
  return entries.map((item) =>
    item.id === entry.id ? { ...entry, createdAt: item.createdAt } : item,
  );
}

export function removeEntry(entries: Entry[], id: string): Entry[] {
  return entries.filter((entry) => entry.id !== id);
}

function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname !== ""
    );
  } catch {
    return false;
  }
}
