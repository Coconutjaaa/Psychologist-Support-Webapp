import { api } from "../../api";
import Icon from "../../components/Icon";
import { appName, features } from "../../config";
import useResource from "../../hooks/useResource";
import { thaiDate, thaiLongDate } from "../../lib/date";
import { moodLabels } from "../../lib/labels";
import type { Appointment, Patient } from "../../types";
import SessionRecap from "./SessionRecap";

/**
 * "ภาพรวม" tab: profile, next appointment (when `features.appointments`), severity per session, a recap of every
 * session and the latest check-ins from the patient's app.
 */
export default function OverviewTab({ patient, appointment, onSchedule, onOpenTranscript }: {
  patient: Patient; appointment?: Appointment; onSchedule: (appointment?: Appointment) => void; onOpenTranscript: (session: number) => void;
}) {
  const checkins = useResource(() => api.checkins.forPatient(patient.id), [patient.id]).data;
  const recentMoods = Object.entries(checkins?.moods ?? {}).sort(([a], [b]) => b.localeCompare(a)).slice(0, 4);
  const diary = (checkins?.messages ?? []).filter((message) => message.from === "user").slice(-3).reverse();
  const last = patient.sessions[patient.sessions.length - 1];
  return (
    <div className="tab-body overview-grid">
      <section className="panel">
        <div className="panel-head"><h2>ข้อมูลผู้รับคำปรึกษา</h2></div>
        <dl className="panel-body info-list">
          <div><dt>อายุ</dt><dd>{patient.age} ปี</dd></div>
          <div><dt>อาชีพ</dt><dd>{patient.occupation}</dd></div>
          <div><dt>เลขประจำตัว</dt><dd>{patient.hn}</dd></div>
          <div><dt>เริ่มรับคำปรึกษา</dt><dd>{patient.sessions[0] ? thaiDate(patient.sessions[0].date) : "ยังไม่เริ่ม"}</dd></div>
          <div><dt>จำนวน Session</dt><dd>{patient.sessions.length} ครั้ง</dd></div>
          <div><dt>ความรุนแรงล่าสุด</dt><dd>{last ? `${last.severity}/5` : "-"}</dd></div>
        </dl>
      </section>
      {features.appointments && (
        <section className="panel">
          <div className="panel-head"><h2>นัดหมายถัดไป</h2>{appointment?.rescheduleRequested && <span className="chip chip-amber">ขอเลื่อนนัด</span>}</div>
          <div className="panel-body">
            {appointment ? (
              <>
                <div className="appt-detail"><span><Icon name="calendar" /></span><div><strong>{thaiLongDate(appointment.date)}</strong><small>{appointment.time} น. · {appointment.mode}{appointment.note && ` · ${appointment.note}`}</small></div></div>
                <div className="panel-actions"><button className="secondary-button" onClick={() => onSchedule(appointment)}><Icon name="clock" size={16} />เลื่อนนัด</button><button className="primary-button" onClick={() => onSchedule()}><Icon name="plus" size={16} />เพิ่มนัดหมาย</button></div>
              </>
            ) : (
              <>
                <p className="muted-text">ยังไม่มีนัดหมายครั้งถัดไป</p>
                <div className="panel-actions"><button className="primary-button" onClick={() => onSchedule()}><Icon name="calendar" size={16} />นัดหมาย</button></div>
              </>
            )}
          </div>
        </section>
      )}
      <section className="panel">
        <div className="panel-head"><h2>ความรุนแรงตาม Session</h2>{last && <span className="chip chip-green">ล่าสุด {last.severity}/5</span>}</div>
        <div className="panel-body">
          {patient.sessions.length ? (
            <div className="severity-bars">
              {patient.sessions.map((item) => <div key={item.number}><b>{item.severity}</b><span style={{ height: `${(item.severity / 5) * 100}%` }} /><small>S{item.number}</small></div>)}
            </div>
          ) : <p className="muted-text">ยังไม่มีข้อมูล Session</p>}
        </div>
      </section>
      {/* Full width. With appointments on, the grid's dense flow moves the next panel up beside "ความรุนแรง". */}
      <SessionRecap patient={patient} onOpenTranscript={onOpenTranscript} />
      {/* Without the appointment panel this is the odd one out, so it spans the full row. */}
      <section className={`panel ${features.appointments ? "" : "span-all"}`}>
        <div className="panel-head"><h2>บันทึกจากแอปผู้รับคำปรึกษา</h2></div>
        <div className="panel-body feed">
          {!patient.email && <p className="muted-text">{patient.name}ยังไม่ได้เชื่อมต่อบัญชีแอป {appName}</p>}
          {recentMoods.map(([date, score]) => (
            <div className="feed-item" key={date}><span className="feed-icon"><Icon name="activity" size={15} /></span><div><p>บันทึกอารมณ์: <b>{score}/5 · {moodLabels[score]}</b></p><small>{thaiDate(date)}</small></div></div>
          ))}
          {diary.map((message, index) => (
            <div className="feed-item" key={index}><span className="feed-icon"><Icon name="chat" size={15} /></span><div><p>“{message.text}”</p><small>{thaiDate(message.date)} · {message.time} น.</small></div></div>
          ))}
          {patient.email && checkins && !recentMoods.length && !diary.length && <p className="muted-text">ยังไม่มีบันทึกใหม่</p>}
        </div>
      </section>
    </div>
  );
}
