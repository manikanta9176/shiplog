import type { Entry } from "./entry";

const storageKey = "shiplog.entries";
const listeners = new Set<() => void>();
let cachedRaw = "";
let cachedEntries: Entry[] = [];
const serverEntries: Entry[] = [];

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEntriesSnapshot(): Entry[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedEntries = parseEntries(raw);
  }
  return cachedEntries;
}

export function getServerEntriesSnapshot(): Entry[] {
  return serverEntries;
}

export function writeEntries(entries: Entry[]): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries));
    cachedRaw = "";
    listeners.forEach((listener) => listener());
    return true;
  } catch {
    return false;
  }
}

function readRaw(): string {
  try {
    return localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

function parseEntries(raw: string): Entry[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<Entry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    typeof entry.shipped === "string" &&
    typeof entry.link === "string" &&
    typeof entry.note === "string" &&
    typeof entry.createdAt === "string"
  );
}
