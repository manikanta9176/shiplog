"use client";

import type { Entry } from "@/lib/entry";

export function DayList({
  days,
  copiedDate,
  onEdit,
  onDelete,
  onCopy,
}: {
  days: { date: string; entries: Entry[] }[];
  copiedDate: string;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  onCopy: (date: string, entries: Entry[]) => void;
}) {
  if (days.length === 0) {
    return <p className="text-muted">Nothing shipped yet.</p>;
  }

  return (
    <div className="grid gap-8">
      {days.map((day) => (
        <section key={day.date} className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-sm tracking-wide text-stamp">{day.date}</h2>
            <button
              type="button"
              onClick={() => onCopy(day.date, day.entries)}
              className="text-sm text-muted hover:text-foreground"
            >
              {copiedDate === day.date ? "Copied" : "Copy day"}
            </button>
          </div>
          <ul className="grid gap-3">
            {day.entries.map((entry) => (
              <li key={entry.id} className="border-t border-line pt-3">
                <p>{entry.shipped}</p>
                {entry.link ? (
                  <a
                    href={entry.link}
                    className="font-mono text-sm text-stamp underline"
                  >
                    {entry.link}
                  </a>
                ) : null}
                {entry.note ? (
                  <p className="mt-1 text-sm text-muted">{entry.note}</p>
                ) : null}
                <div className="mt-2 flex gap-3 text-sm text-muted">
                  <button type="button" onClick={() => onEdit(entry)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(entry.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
