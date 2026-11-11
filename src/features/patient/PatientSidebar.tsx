import Icon from "../../components/Icon";
import { fromIso, thaiDate } from "../../lib/date";
import { moodLabels } from "../../lib/labels";
import type { Highlights, MoodLog } from "../../types";
import { weeklyMoodStats } from "./moodStats";

const weekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** Right-hand column of the patient app: weekly mood chart, highlights and the emergency hotline. */
export default function PatientSidebar({ moods, highlights, onShowHistory }: { moods: MoodLog; highlights?: Highlights; onShowHistory: () => void }) {
  const { week, logged, change } = weeklyMoodStats(moods);
  return (
    <aside className="patient-side">
      <section className="mood-card">
        <div className="section-title"><div><Icon name="activity" /><span><strong>ภาพรวมสัปดาห์นี้</strong><small>บันทึก {logged} จาก 7 วัน</small></span></div><button aria-label="ดูประวัติอารมณ์" onClick={onShowHistory}><Icon name="chevron" size={16} /></button></div>
        <div className={`mood-score ${change !== null && change < 0 ? "down" : ""}`}>
          <strong>{change === null ? "เริ่มบันทึก" : change > 0 ? "ดีขึ้น" : change < 0 ? "ลดลง" : "คงที่"}</strong>
          <span>{change === null ? "เพื่อดูแนวโน้มรายสัปดาห์" : "จากสัปดาห์ก่อน"}</span>
          {change !== null && <i>{change > 0 ? "+" : ""}{change}%</i>}
        </div>
        <div className="bars">
          {week.map((day, index) => (
            <div key={day} title={moods[day] ? `${thaiDate(day)} · ${moodLabels[moods[day]]}` : `${thaiDate(day)} · ไม่ได้บันทึก`}>
              <span style={{ height: moods[day] ? `${(moods[day] / 5) * 100}%` : undefined }} className={`${index === 6 ? "today" : ""} ${moods[day] ? "" : "empty"}`} />
              <small>{weekdays[fromIso(day).getDay()]}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="checkin-card">
        <span className="checkin-icon"><Icon name="check" /></span>
        <h2>สิ่งที่ทำได้ดี</h2>
        {highlights ? (
          <>
            <p>{highlights.text}</p>
            {highlights.items.map((item) => <div key={item.label}><span><Icon name={item.icon} size={16} />{item.label}</span><strong>{item.value}</strong></div>)}
          </>
        ) : (
          <>
            <p>เริ่มต้นได้ดี! บันทึกอารมณ์ทุกวันเพื่อให้นักจิตวิทยาเห็นภาพรวมของคุณ</p>
            <div><span><Icon name="activity" size={16} />บันทึกอารมณ์</span><strong>{Object.keys(moods).length} วัน</strong></div>
          </>
        )}
      </section>
      <a className="emergency-card" href="tel:1323" aria-label="โทรสายด่วนสุขภาพจิต 1323">
        <span className="emergency-icon"><Icon name="phone" /></span>
        <div><strong>ต้องการความช่วยเหลือทันที?</strong><p>แตะเพื่อโทร<b>สายด่วนสุขภาพจิต 1323</b> : กรมสุขภาพจิต</p></div>
        <span className="call-now">โทรเลย</span>
      </a>
    </aside>
  );
}
