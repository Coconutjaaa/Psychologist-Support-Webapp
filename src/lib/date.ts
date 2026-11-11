// Dates travel as local ISO dates ("2026-09-01") and 24-hour times ("14:30"), which sort correctly as strings.

const pad = (value: number) => String(value).padStart(2, "0");

export const iso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function fromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export const todayIso = () => iso(new Date());

export function nowTime() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** The last `count` days as ISO dates, oldest first, ending `endOffset` days from today (0 = today). */
export const recentDays = (count: number, endOffset = 0) => Array.from({ length: count }, (_, index) => iso(addDays(new Date(), endOffset - count + 1 + index)));

/** Sort comparator for anything with `date` and `time`, earliest first. */
export const byDateTime = (a: { date: string; time: string }, b: { date: string; time: string }) => (a.date + a.time).localeCompare(b.date + b.time);

/** "1 ก.ย. 2569" by default; pass Intl options for other formats. */
export function thaiDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("th-TH", options).format(fromIso(value));
}

/** "วันอังคารที่ 1 กันยายน 2569" */
export function thaiLongDate(value: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).formatToParts(fromIso(value)).map((part) => [part.type, part.value]),
  );
  return `${parts.weekday}ที่ ${parts.day} ${parts.month} ${parts.year}`;
}
