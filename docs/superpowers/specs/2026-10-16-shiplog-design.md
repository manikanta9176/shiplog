# shiplog design

Date: 2026-10-16

shiplog is a personal end-of-day log. You write what shipped, keep it on this computer, and copy a day as Markdown. Entries stay in this browser. There is no account and no server.

devbench and devnow are separate repos. They are out of scope here.

## Decisions

- One Next.js App Router app, TypeScript, Tailwind CSS, pnpm.
- Entries are stored in `localStorage` under the key `shiplog.entries`.
- No API routes, no database, no accounts, no environment variables.
- Validation, grouping, editing, deletion, and Markdown rendering live in plain functions under `lib/`, with Vitest tests. The page collects input and renders the result.
- Deploy target is Vercel from `github.com/manikanta9176/shiplog`.

Sync across computers is a later version.

## v1 behavior

The page has one form and a list.

The form fields are:

| Field | Rule |
| --- | --- |
| Date | `YYYY-MM-DD`. Defaults to today in the browser's local calendar. The user can change it. |
| What shipped | Required. One line. Leading and trailing whitespace is removed before save. |
| Link | Optional. Empty is allowed. A non-empty value must be an `http` or `https` URL. |
| Note | Optional. Empty is allowed. |

Saving checks the fields in this order and shows the first failure: a date that is not a real `YYYY-MM-DD` calendar day shows `Enter a date`; a blank shipped line shows `Write what shipped`; a non-empty link that is not an `http` or `https` URL with a host shows `Enter an http or https link`. A failed check does not write anything.

A saved entry has this shape:

```ts
type Entry = {
  id: string
  date: string
  shipped: string
  link: string
  note: string
  createdAt: string
}
```

`id` is a UUID from `crypto.randomUUID()`. `createdAt` is an ISO-8601 timestamp taken at the moment of creation. `link` and `note` are empty strings when the user leaves them blank.

The list is grouped by `date`. The newest date is first. Inside a day, the newest `createdAt` is first. A day with no entries is not shown.

Edit opens the same form with that entry's values. Saving an edit updates `date`, `shipped`, `link`, and `note`. `id` and `createdAt` stay the same, so the entry keeps its place inside the day unless the date changed. Delete removes that entry. Both actions ask for nothing beyond the button press.

"Copy day" writes Markdown for that day only:

```md
## 2026-10-16

- Shipped the toolbox — https://example.com
  Optional note
```

A missing link omits the ` — ` and the URL. A missing note omits the indented line. Entries inside the day stay in the same order as the list.

When there are no entries, the page shows `Nothing shipped yet.` The copy control is absent.

## Architecture

```
app/layout.tsx
app/page.tsx
app/error.tsx
components/log-form.tsx
components/day-list.tsx
lib/entry.ts
lib/entry.test.ts
lib/storage.ts
```

`lib/entry.ts` exports:

```ts
export type Entry = {
  id: string
  date: string
  shipped: string
  link: string
  note: string
  createdAt: string
}

export type EntryDraft = {
  date: string
  shipped: string
  link: string
  note: string
}

export type EntryResult =
  | { ok: true; value: EntryDraft }
  | { ok: false; error: string }

export function validateDraft(draft: EntryDraft): EntryResult
export function groupByDay(entries: Entry[]): { date: string; entries: Entry[] }[]
export function markdownForDay(date: string, entries: Entry[]): string
export function upsertEntry(entries: Entry[], entry: Entry): Entry[]
export function removeEntry(entries: Entry[], id: string): Entry[]
```

`validateDraft` trims every field. It returns the trimmed draft on success. It does not create an `id`.

`lib/storage.ts` reads and writes the `Entry[]` in `localStorage`. A missing or unparseable value is an empty list. The page calls storage only from event handlers. Tests do not touch `localStorage`.

Data flow: form values → `validateDraft` → build or update an `Entry` → `upsertEntry` → `localStorage` → `groupByDay` → render. Copy calls `markdownForDay` and `navigator.clipboard.writeText`. No `fetch`.

## Error handling

- `validateDraft` returns `{ ok: false, error }` for a bad date, an empty shipped line, or a bad link. The page shows that string under the form.
- `storage.ts` catches a failed `localStorage` read or write and returns or keeps the empty list. The page shows `This browser could not store the log.`
- Unexpected UI failures use `app/error.tsx` with the text `This log hit a problem` and a link back to `/`.

## Testing

Vitest covers `lib/entry.ts` only.

- `validateDraft`: trims a valid draft, rejects whitespace-only shipped text, rejects `2026/10/16`, rejects `2026-02-31`, rejects `notes://x`, accepts an empty link, accepts `https://example.com`. A draft with both a bad date and a blank shipped line returns `Enter a date`.
- `groupByDay`: two dates, newest date first; two entries on one date, newest `createdAt` first.
- `markdownForDay`: one entry with a link and a note, one entry with neither.
- `upsertEntry`: adds a new id and replaces an existing id without changing `createdAt`.
- `removeEntry`: removes the matching id and leaves the others.

`pnpm test` must pass before the app is called done. `pnpm build` must succeed with no environment variables.

## Success

A developer can add what shipped today, see it under today's date after a reload, edit it, delete it, and copy that day as Markdown. The text remains in this browser.
