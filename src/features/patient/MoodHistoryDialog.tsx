import Modal from "../../components/Modal";
import { recentDays, thaiDate } from "../../lib/date";
import { moodLabels } from "../../lib/labels";
import type { MoodLog } from "../../types";

/** "ประวัติอารมณ์": the last 14 days, newest first. */
export default function MoodHistoryDialog({ moods, dayLabel, onClose }: { moods: MoodLog; dayLabel: (date: string) => string; onClose: () => void }) {
  const days = recentDays(14).reverse();
  return (
    <Modal title="ประวัติอารมณ์" subtitle="14 วันล่าสุด" onClose={onClose}>
      <div className="modal-body mood-history">
        {days.map((day) => (
          <div key={day}>
            <span>{dayLabel(day)} · {thaiDate(day, { weekday: "short" })}</span>
            {moods[day] ? <span className={`chip ${moods[day] >= 4 ? "chip-green" : moods[day] <= 2 ? "chip-rose" : ""}`}>{moods[day]}/5 · {moodLabels[moods[day]]}</span> : <span className="chip chip-muted">ไม่ได้บันทึก</span>}
          </div>
        ))}
      </div>
    </Modal>
  );
}
