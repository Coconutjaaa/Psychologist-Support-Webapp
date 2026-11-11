import type { NodeType, Role } from "../types";

// Display labels and colours shared by several screens.

export const roleLabels: Record<Role, string> = { clinician: "นักจิตวิทยา", patient: "ผู้เข้ารับคำปรึกษา" };

/** Mood scores 1–5 (index 0 is unused). */
export const moodLabels = ["", "แย่มาก", "ไม่ค่อยดี", "ปานกลาง", "ค่อนข้างดี", "ดีมาก"];

/** CSS tone (`tone-*` classes in index.css) for each Knowledge Graph node type. */
export const toneOf: Record<NodeType, string> = { เหตุการณ์: "lavender", ความคิด: "amber", อารมณ์: "rose", พฤติกรรม: "sky", อาการ: "coral", ปัจจัยปกป้อง: "mint" };

/** Avatar text for a Thai display name: "ดร" for doctors, otherwise the first consonant after "คุณ". */
export function initials(name: string) {
  if (name.startsWith("ดร")) return "ดร";
  // Skip leading vowels so "คุณเอ" shows "อ", not "เ".
  return [...name.replace(/^คุณ\s*/, "")].find((char) => !"เแโใไ ".includes(char)) ?? "?";
}

/** Adds the polite prefix "คุณ" unless the name already has it. */
export const withKhun = (name: string) => (name.startsWith("คุณ") ? name : `คุณ${name}`);
