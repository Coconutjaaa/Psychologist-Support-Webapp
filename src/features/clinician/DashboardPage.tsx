import { api } from "../../api";
import Icon from "../../components/Icon";
import { features } from "../../config";
import useResource from "../../hooks/useResource";
import { recentDays, thaiDate, thaiLongDate, todayIso } from "../../lib/date";
import type { Appointment, Patient } from "../../types";
import type { Page } from "./ClinicianNav";

/** "ภาพรวม": today's summary, upcoming appointments and patients that need follow-up. */
export default function DashboardPage({ name, patients, upcoming, onOpen, onSchedule, onGo }: {
  name: string; patients: Patient[]; upcoming: Appointment[]; onOpen: (id: string) => void; onSchedule: () => void; onGo: (page: Page) => void;
}) {
  const moodsByPatient = useResource(() => api.checkins.moodsByPatient(), []).data ?? {};
  const today = todayIso();
  const todays = upcoming.filter((appointment) => appointment.date === today);
  const requests = upcoming.filter((appointment) => appointment.rescheduleRequested);
  const watch = patients.filter((patient) => patient.status === "ควรติดตาม");
  const weekStart = recentDays(7)[0];
  const moodEntries = Object.values(moodsByPatient).reduce((sum, moods) => sum + Object.keys(moods).filter((date) => date >= weekStart).length, 0);
  const latestMoods = patients.flatMap((patient) => {
    const latest = Object.entries(moodsByPatient[patient.id] ?? {}).sort(([a], [b]) => b.localeCompare(a))[0];
    return latest ? [{ patient, date: latest[0], score: latest[1] }] : [];
  });
  const patientOf = (id: string) => patients.find((patient) => patient.id === id);

  return (
    <div className="page">
      <div className="page-head">
        <div><span className="eyebrow">{thaiLongDate(today)}</span><h1>สวัสดีค่ะ {name}</h1><p>{features.appointments ? "ภาพรวมผู้รับคำปรึกษาและนัดหมายของคุณ" : "ภาพรวมผู้รับคำปรึกษาของคุณ"}</p></div>
        {features.appointments && <button className="primary-button" onClick={onSchedule}><Icon name="plus" size={17} />เพิ่มนัดหมาย</button>}
      </div>
      <div className={`summary-grid ${features.appointments ? "" : "two"}`}>
        <article className="summary-card"><span className="summary-icon summary-blue"><Icon name="people" /></span><div><small>ผู้รับคำปรึกษา</small><strong>{patients.length} คน</strong><p>ควรติดตาม {watch.length} คน</p></div></article>
        {features.appointments && (
          <>
            <article className="summary-card"><span className="summary-icon summary-green"><Icon name="calendar" /></span><div><small>นัดหมายวันนี้</small><strong>{todays.length} นัด</strong><p>{todays[0] ? `ถัดไป ${todays[0].time} น.` : "ไม่มีนัดวันนี้"}</p></div></article>
            <article className="summary-card"><span className="summary-icon summary-amber"><Icon name="clock" /></span><div><small>คำขอเลื่อนนัด</small><strong>{requests.length} รายการ</strong><p>{requests.length ? "รอการยืนยัน" : "ไม่มีคำขอใหม่"}</p></div></article>
          </>
        )}
        <article className="summary-card"><span className="summary-icon summary-rose"><Icon name="activity" /></span><div><small>บันทึกอารมณ์ 7 วัน</small><strong>{moodEntries} ครั้ง</strong><p>จากแอปผู้รับคำปรึกษา</p></div></article>
      </div>
      <div className={`dash-grid ${features.appointments ? "" : "single"}`}>
        {features.appointments && (
          <section className="panel">
            <div className="panel-head"><h2>นัดหมายที่จะถึง</h2><button className="text-button" onClick={() => onGo("schedule")}>ดูทั้งหมด <Icon name="arrow" size={15} /></button></div>
            {upcoming.slice(0, 5).map((appointment) => {
              const patient = patientOf(appointment.patientId);
              return patient && (
                <button className="list-row" onClick={() => onOpen(patient.id)} key={appointment.id}>
                  <span className={`avatar avatar-${patient.color}`}>{patient.initials}</span>
                  <div><strong>{patient.name}</strong><small>{appointment.date === today ? "วันนี้" : thaiDate(appointment.date, { weekday: "short", day: "numeric", month: "short" })} · {appointment.time} น. · {appointment.note || appointment.mode}</small></div>
                  {appointment.rescheduleRequested ? <span className="chip chip-amber">ขอเลื่อนนัด</span> : <span className="chip"><Icon name={appointment.mode === "ออนไลน์" ? "video" : "pin"} size={13} />{appointment.mode}</span>}
                  <Icon name="chevron" size={15} />
                </button>
              );
            })}
            {!upcoming.length && <p className="empty-note">ยังไม่มีนัดหมาย</p>}
          </section>
        )}
        <section className="panel">
          <div className="panel-head"><h2>ควรติดตาม</h2><button className="text-button" onClick={() => onGo("patients")}>ผู้รับคำปรึกษาทั้งหมด <Icon name="arrow" size={15} /></button></div>
          {watch.map((patient) => {
            const last = patient.sessions[patient.sessions.length - 1];
            return (
              <button className="list-row" onClick={() => onOpen(patient.id)} key={patient.id}>
                <span className={`avatar avatar-${patient.color}`}>{patient.initials}</span>
                <div><strong>{patient.name}</strong><small>{last ? `Session ${last.number}: ${last.summary}` : "ยังไม่มี Session"}</small></div>
                <Icon name="chevron" size={15} />
              </button>
            );
          })}
          {latestMoods.map(({ patient, date, score }) => (
            <button className="list-row" onClick={() => onOpen(patient.id)} key={`mood-${patient.id}`}>
              <span className="summary-icon summary-green"><Icon name="activity" size={17} /></span>
              <div><strong>บันทึกอารมณ์ล่าสุดของ{patient.name}</strong><small>{score}/5 · {date === today ? "วันนี้" : thaiDate(date)}</small></div>
              <Icon name="chevron" size={15} />
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
