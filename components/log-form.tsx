"use client";

import type { EntryDraft } from "@/lib/entry";

export function LogForm({
  draft,
  error,
  editing,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: EntryDraft;
  error: string;
  editing: boolean;
  onChange: (draft: EntryDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="grid gap-4 rounded-lg border border-line bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label className="grid gap-2 text-sm text-muted">
          Date
          <input
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          What shipped
          <input
            value={draft.shipped}
            onChange={(event) =>
              onChange({ ...draft, shipped: event.target.value })
            }
            className={fieldClass}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm text-muted">
        Link
        <input
          value={draft.link}
          onChange={(event) => onChange({ ...draft, link: event.target.value })}
          placeholder="https://"
          className={fieldClass}
        />
      </label>
      <label className="grid gap-2 text-sm text-muted">
        Note
        <textarea
          value={draft.note}
          onChange={(event) => onChange({ ...draft, note: event.target.value })}
          rows={3}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-stamp">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-stamp px-3 py-2 text-sm font-medium text-background"
        >
          {editing ? "Save" : "Add"}
        </button>
        {editing ? (
          <button type="button" onClick={onCancel} className="text-sm text-muted">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

const fieldClass =
  "w-full rounded-md border border-line bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-stamp";
