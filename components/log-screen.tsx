"use client";

import { useState, useSyncExternalStore } from "react";
import { DayList } from "@/components/day-list";
import { LogForm } from "@/components/log-form";
import {
  groupByDay,
  markdownForDay,
  removeEntry,
  upsertEntry,
  validateDraft,
  type Entry,
  type EntryDraft,
} from "@/lib/entry";
import {
  getEntriesSnapshot,
  getServerEntriesSnapshot,
  subscribe,
  writeEntries,
} from "@/lib/storage";

const emptyDraft = (date = ""): EntryDraft => ({
  date,
  shipped: "",
  link: "",
  note: "",
});

export function LogScreen() {
  const entries = useSyncExternalStore(
    subscribe,
    getEntriesSnapshot,
    getServerEntriesSnapshot,
  );
  const today = useSyncExternalStore(subscribeToday, todayLocal, () => "");
  const [draft, setDraft] = useState<EntryDraft>(emptyDraft());
  const [editing, setEditing] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [copiedDate, setCopiedDate] = useState("");
  const date = draft.date || today;

  function save() {
    const result = validateDraft({ ...draft, date });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const entry: Entry = editing
      ? { ...editing, ...result.value }
      : {
          ...result.value,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
    const next = upsertEntry(entries, entry);
    if (!writeEntries(next)) {
      setError("This browser could not store the log.");
      return;
    }

    setEditing(null);
    setError("");
    setDraft(emptyDraft());
  }

  function remove(id: string) {
    const next = removeEntry(entries, id);
    if (!writeEntries(next)) {
      setError("This browser could not store the log.");
      return;
    }
    if (editing?.id === id) {
      setEditing(null);
      setDraft(emptyDraft());
    }
  }

  async function copyDay(date: string, dayEntries: Entry[]) {
    try {
      await navigator.clipboard.writeText(markdownForDay(date, dayEntries));
      setCopiedDate(date);
      window.setTimeout(() => setCopiedDate(""), 1200);
    } catch {
      setCopiedDate("");
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-8 px-4 py-10">
      <header className="grid gap-2">
        <h1 className="text-4xl tracking-tight">shiplog</h1>
        <p className="text-muted">
          Write what shipped. It stays in this browser, and you can copy a day
          as Markdown.
        </p>
      </header>
      <LogForm
        draft={{ ...draft, date }}
        error={error}
        editing={editing !== null}
        onChange={setDraft}
        onSubmit={save}
        onCancel={() => {
          setEditing(null);
          setError("");
          setDraft(emptyDraft());
        }}
      />
      <DayList
        days={groupByDay(entries)}
        copiedDate={copiedDate}
        onEdit={(entry) => {
            setEditing(entry);
            setError("");
            setDraft({
              date: entry.date,
              shipped: entry.shipped,
              link: entry.link,
              note: entry.note,
            });
          }}
          onDelete={remove}
        onCopy={copyDay}
      />
    </main>
  );
}

function subscribeToday(): () => void {
  return () => {};
}

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
