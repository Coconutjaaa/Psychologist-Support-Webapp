import { useState } from "react";
import Icon from "../../components/Icon";
import { moodLabels } from "../../lib/labels";

/** "วันนี้คุณรู้สึกอย่างไร?": pick a score 1–5 and save it as today's mood. */
export default function MoodCheckin({ savedScore, onSave }: { savedScore?: number; onSave: (score: number) => Promise<unknown> }) {
  const [mood, setMood] = useState<number | null>(savedScore ?? null);
  const [saving, setSaving] = useState(false);
  const saved = mood !== null && savedScore === mood;
  const save = async () => {
    if (!mood) return;
    setSaving(true);
    await onSave(mood);
    setSaving(false);
  };
  return (
    <section className="daily-checkin">
      <div className="daily-copy">
        <span className="daily-icon"><Icon name={saved ? "check" : "activity"} /></span>
        <div>
          <h2>{saved ? "บันทึกอารมณ์วันนี้แล้ว" : "วันนี้คุณรู้สึกอย่างไร?"}</h2>
          <p>{saved ? "ข้อมูลถูกบันทึกและจะรวมอยู่ในสรุปสำหรับนักจิตวิทยา" : "เลือกคะแนนที่ตรงกับความรู้สึกของคุณมากที่สุด"}</p>
        </div>
      </div>
      <div className="mood-picker" role="group" aria-label="เลือกระดับอารมณ์">
        {[1, 2, 3, 4, 5].map((score) => (
          <button className={mood === score ? "active" : ""} aria-pressed={mood === score} onClick={() => setMood(score)} key={score}>
            <span>{score}</span><small>{moodLabels[score]}</small>
          </button>
        ))}
      </div>
      <button className="save-checkin" disabled={!mood || saved || saving} onClick={save}>{saved ? "บันทึกแล้ว" : savedScore ? "อัปเดต" : "บันทึก"}</button>
    </section>
  );
}
