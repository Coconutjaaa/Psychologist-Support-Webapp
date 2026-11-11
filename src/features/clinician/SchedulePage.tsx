import { useState } from "react";
import Icon from "../../components/Icon";
import { addDays, fromIso, iso, thaiDate, thaiLongDate, todayIso } from "../../lib/date";
import type { Appointment, Patient } from "../../types";

const weekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
/** Appointments listed inside a day cell; the rest collapse into "+N นัด". */
const perCell = 2;
/** "2026-11-11" → "2026-11" */
const monthOf = (day: string) => day.slice(0, 7);

/** "ตารางนัดหมาย": a month calendar of appointments. Picking a day lists its appointments with open, reschedule and cancel. */
export default function SchedulePage({ patients, appointments, onOpen, onSchedule, onCancel }: {
  patients: Patient[]; appointments: Appointment[]; onOpen: (id: string) => void; onSchedule: (initial: Partial<Appointment>) => void; onCancel: (appointment: Appointment) => void;
}) {
  const today = todayIso();
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(monthOf(today));

  const first = fromIso(`${month}-01`);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((first.getDay() + daysInMonth) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, index) => iso(addDays(first, index - first.getDay())));
  const byDay = new Map<string, Appointment[]>();
  for (const appointment of appointments) byDay.set(appointment.date, [...(byDay.get(appointment.date) ?? []), appointment]);
  const patientOf = (id: string) => patients.find((patient) => patient.id === id);

  const select = (day: string) => { setSelected(day); setMonth(monthOf(day)); };
  const shiftMonth = (delta: number) => setMonth(monthOf(iso(new Date(first.getFullYear(), first.getMonth() + delta, 1))));
  const upcomingCount = appointments.filter((appointment) => appointment.date >= today).length;
  const dayAppointments = byDay.get(selected) ?? [];
  const canAdd = selected >= today;
  const addLabel = `เพิ่มนัดหมาย${selected === today ? "วันนี้" : `วันที่ ${thaiDate(selected, { day: "numeric", month: "short" })}`}`;

  return (
    <div className="page">
      <div className="page-head">
        <div><span className="eyebrow">ตารางนัดหมาย</span><h1>ปฏิทินนัดหมาย</h1><p>{upcomingCount} นัดหมายที่จะถึง · ผู้รับคำปรึกษาเห็นนัดหมายในแอปของตนเอง</p></div>
        <button className="primary-button" onClick={() => onSchedule(canAdd ? { date: selected } : {})}><Icon name="plus" size={17} />เพิ่มนัดหมาย</button>
      </div>
      <div className="schedule-layout">
        <section className="panel calendar">
          <div className="calendar-head">
            <h2>{thaiDate(`${month}-01`, { month: "long", year: "numeric" })}</h2>
            <div className="calendar-nav">
              <button className="secondary-button" onClick={() => select(today)}>วันนี้</button>
              <button className="icon-button calendar-prev" aria-label="เดือนก่อนหน้า" title="เดือนก่อนหน้า" onClick={() => shiftMonth(-1)}><Icon name="chevron" size={18} /></button>
              <button className="icon-button" aria-label="เดือนถัดไป" title="เดือนถัดไป" onClick={() => shiftMonth(1)}><Icon name="chevron" size={18} /></button>
            </div>
          </div>
          <div className="calendar-grid">
            {weekdays.map((name) => <span className="calendar-weekday" key={name}>{name}</span>)}
            {days.map((day) => {
              const items = byDay.get(day) ?? [];
              const state = [monthOf(day) !== month && "outside", day < today && "past", day === today && "today", day === selected && "selected"].filter(Boolean).join(" ");
              return (
                <button className={`calendar-day ${state}`} aria-pressed={day === selected} aria-label={`${thaiLongDate(day)}${items.length ? ` · ${items.length} นัดหมาย` : ""}`} onClick={() => select(day)} key={day}>
                  <span className="calendar-date">{fromIso(day).getDate()}</span>
                  {items.slice(0, perCell).map((appointment) => {
                    const patient = patientOf(appointment.patientId);
                    return (
                      <span className={`calendar-event event-${patient?.color ?? "blue"}${appointment.rescheduleRequested ? " flagged" : ""}`} key={appointment.id}>
                        <b>{appointment.time}</b> <span>{patient?.name}</span>
                      </span>
                    );
                  })}
                  {items.length > perCell && <span className="calendar-more">+{items.length - perCell} นัด</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel day-panel">
          <div className="panel-head">
            <div className="day-title"><h2>{thaiLongDate(selected)}</h2><small>{selected === today && "วันนี้ · "}{dayAppointments.length ? `${dayAppointments.length} นัดหมาย` : "ไม่มีนัดหมาย"}</small></div>
          </div>
          <div className="panel-body">
            {dayAppointments.map((appointment) => {
              const patient = patientOf(appointment.patientId);
              return patient && (
                <article className="appt-row" key={appointment.id}>
                  <span className="appt-time">{appointment.time}</span>
                  <span className={`avatar avatar-${patient.color}`}>{patient.initials}</span>
                  <div className="appt-copy">
                    <strong>{patient.name}</strong><small>{appointment.note || "นัดหมาย"} · {patient.hn}</small>
                    <div className="appt-tags">
                      {appointment.rescheduleRequested && <span className="chip chip-amber">ขอเลื่อนนัด</span>}
                      <span className="chip"><Icon name={appointment.mode === "ออนไลน์" ? "video" : "pin"} size={13} />{appointment.mode}</span>
                    </div>
                  </div>
                  <div className="appt-actions">
                    <button className="secondary-button" onClick={() => onOpen(patient.id)}>เปิดเคส</button>
                    {appointment.date >= today && (
                      <>
                        <button className="secondary-button" onClick={() => onSchedule(appointment)}>เลื่อนนัด</button>
                        <button className="icon-button danger" aria-label={`ยกเลิกนัดหมาย${patient.name}`} title="ยกเลิกนัดหมาย" onClick={() => onCancel(appointment)}><Icon name="trash" size={17} /></button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
            {!dayAppointments.length && (
              <div className="empty-state">
                <span><Icon name="calendar" size={22} /></span><strong>ไม่มีนัดหมายในวันที่เลือก</strong>
                <p>{canAdd ? "เพิ่มนัดหมายได้จากปุ่มด้านล่าง หรือเลือกวันอื่นในปฏิทิน" : "วันที่เลือกผ่านมาแล้ว เลือกวันอื่นในปฏิทินเพื่อดูนัดหมาย"}</p>
              </div>
            )}
            {canAdd && <button className="secondary-button day-add" onClick={() => onSchedule({ date: selected })}><Icon name="plus" size={17} />{addLabel}</button>}
          </div>
        </section>
      </div>
    </div>
  );
}
