import { describe, expect, test } from "vitest";
import {
  groupByDay,
  markdownForDay,
  removeEntry,
  upsertEntry,
  validateDraft,
  type Entry,
} from "./entry";

const valid = {
  date: "2026-10-16",
  shipped: "  Shipped the toolbox  ",
  link: "  https://example.com  ",
  note: "  Optional note  ",
};

describe("validateDraft", () => {
  test("trims a valid draft", () => {
    expect(validateDraft(valid)).toEqual({
      ok: true,
      value: {
        date: "2026-10-16",
        shipped: "Shipped the toolbox",
        link: "https://example.com",
        note: "Optional note",
      },
    });
  });

  test("rejects whitespace-only shipped text", () => {
    expect(validateDraft({ ...valid, shipped: "   " })).toEqual({
      ok: false,
      error: "Write what shipped",
    });
  });

  test("rejects a slash date", () => {
    expect(validateDraft({ ...valid, date: "2026/10/16" })).toEqual({
      ok: false,
      error: "Enter a date",
    });
  });

  test("rejects a calendar day that does not exist", () => {
    expect(validateDraft({ ...valid, date: "2026-02-31" })).toEqual({
      ok: false,
      error: "Enter a date",
    });
  });

  test("rejects a non-http link", () => {
    expect(validateDraft({ ...valid, link: "notes://x" })).toEqual({
      ok: false,
      error: "Enter an http or https link",
    });
  });

  test("accepts an empty link", () => {
    const result = validateDraft({ ...valid, link: "  " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.link).toBe("");
  });

  test("accepts an https link", () => {
    const result = validateDraft({ ...valid, link: "https://example.com" });
    expect(result.ok).toBe(true);
  });

  test("returns the date error before the shipped error", () => {
    expect(
      validateDraft({ ...valid, date: "nope", shipped: "   " }),
    ).toEqual({ ok: false, error: "Enter a date" });
  });
});

describe("groupByDay", () => {
  test("puts the newest date first and the newest entry first inside a day", () => {
    const older: Entry = {
      id: "1",
      date: "2026-10-15",
      shipped: "Yesterday",
      link: "",
      note: "",
      createdAt: "2026-10-15T18:00:00.000Z",
    };
    const morning: Entry = {
      id: "2",
      date: "2026-10-16",
      shipped: "Morning",
      link: "",
      note: "",
      createdAt: "2026-10-16T09:00:00.000Z",
    };
    const evening: Entry = {
      id: "3",
      date: "2026-10-16",
      shipped: "Evening",
      link: "",
      note: "",
      createdAt: "2026-10-16T18:00:00.000Z",
    };

    expect(groupByDay([older, morning, evening])).toEqual([
      { date: "2026-10-16", entries: [evening, morning] },
      { date: "2026-10-15", entries: [older] },
    ]);
  });
});

describe("markdownForDay", () => {
  test("includes a link and a note", () => {
    expect(
      markdownForDay("2026-10-16", [
        {
          id: "1",
          date: "2026-10-16",
          shipped: "Shipped the toolbox",
          link: "https://example.com",
          note: "Optional note",
          createdAt: "2026-10-16T18:00:00.000Z",
        },
      ]),
    ).toBe(
      "## 2026-10-16\n\n- Shipped the toolbox — https://example.com\n  Optional note",
    );
  });

  test("omits a missing link and note", () => {
    expect(
      markdownForDay("2026-10-16", [
        {
          id: "1",
          date: "2026-10-16",
          shipped: "Shipped the toolbox",
          link: "",
          note: "",
          createdAt: "2026-10-16T18:00:00.000Z",
        },
      ]),
    ).toBe("## 2026-10-16\n\n- Shipped the toolbox");
  });
});

describe("upsertEntry", () => {
  const existing: Entry = {
    id: "1",
    date: "2026-10-16",
    shipped: "First",
    link: "",
    note: "",
    createdAt: "2026-10-16T09:00:00.000Z",
  };

  test("adds a new id", () => {
    const added: Entry = { ...existing, id: "2", shipped: "Second" };
    expect(upsertEntry([existing], added)).toEqual([existing, added]);
  });

  test("replaces an existing id without changing createdAt", () => {
    const edited: Entry = {
      ...existing,
      shipped: "Edited",
      createdAt: "2026-10-16T20:00:00.000Z",
    };
    expect(upsertEntry([existing], edited)).toEqual([
      { ...edited, createdAt: existing.createdAt },
    ]);
  });
});

describe("removeEntry", () => {
  test("removes the matching id and leaves the others", () => {
    const first: Entry = {
      id: "1",
      date: "2026-10-16",
      shipped: "First",
      link: "",
      note: "",
      createdAt: "2026-10-16T09:00:00.000Z",
    };
    const second: Entry = { ...first, id: "2", shipped: "Second" };
    expect(removeEntry([first, second], "1")).toEqual([second]);
  });
});
