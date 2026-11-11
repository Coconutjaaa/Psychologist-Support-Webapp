import { appName, emailDomain } from "../config";
import type { Appointment } from "../types";
import { fromIso, iso } from "./date";

/** Saves `content` as a file through the browser's download prompt. */
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SESSION_MINUTES = 50;

/** An iCalendar (.ics) file for one appointment, so patients can add it to their calendar app. */
export function appointmentIcs(appointment: Appointment, clinicianName: string) {
  const start = fromIso(appointment.date);
  const [hours, minutes] = appointment.time.split(":").map(Number);
  start.setHours(hours, minutes);
  const end = new Date(start.getTime() + SESSION_MINUTES * 60_000);
  const stamp = (date: Date) => `${iso(date).replace(/-/g, "")}T${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${appName}//TH`,
    "BEGIN:VEVENT",
    `UID:${appointment.id}@${emailDomain}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:นัดหมายกับ ${clinicianName}`,
    `LOCATION:${appointment.mode}`,
    `DESCRIPTION:${appointment.note}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
