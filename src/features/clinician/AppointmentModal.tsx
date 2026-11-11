import { useState, type FormEvent } from "react";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { todayIso } from "../../lib/date";
import type { Appointment, AppointmentInput, AppointmentMode, Patient } from "../../types";

const modes: AppointmentMode[] = ["ที่คลินิก", "ออนไลน์"];

/** Creates an appointment, or reschedules one when `initial.id` is set (the patient can't be changed then). */
export default function AppointmentModal({ patients, initial, onSave, onClose }: {
  patients: Patient[]; initial: Partial<Appointment>; onSave: (input: AppointmentInput) => Promise<unknown>; onClose: () => void;
}) {
  const [patientId, setPatientId] = useState(initial.patientId ?? patients[0]?.id ?? "");
  const [date, setDate] = useState(initial.date ?? "");
  const [time, setTime] = useState(initial.time ?? "10:00");
  const [mode, setMode] = useState<AppointmentMode>(initial.mode ?? "ที่คลินิก");
  const [note, setNote] = useState(initial.note ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!date || !time) return setError("กรุณาเลือกวันและเวลา");
    if (date < todayIso()) return setError("ไม่สามารถนัดหมายย้อนหลังได้");
    setSaving(true);
    await onSave({ id: initial.id, patientId, date, time, mode, note: note.trim() });
    setSaving(false);
  };
  return (
    <Modal title={initial.id ? "เลื่อนนัดหมาย" : "นัดหมายครั้งถัดไป"} subtitle="นัดหมายจะแสดงในแอปของผู้รับคำปรึกษาทันที" onClose={onClose}>
      <form className="modal-body" onSubmit={submit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="ap-patient">ผู้รับคำปรึกษา</label>
          <select id="ap-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)} disabled={!!initial.id}>
            {patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.name} · {patient.hn}</option>)}
          </select>
        </div>
        <div className="field-row">
          <div className="field"><label className="field-label" htmlFor="ap-date">วันที่</label><input id="ap-date" type="date" min={todayIso()} value={date} onChange={(event) => { setDate(event.target.value); setError(""); }} /></div>
          <div className="field"><label className="field-label" htmlFor="ap-time">เวลา</label><input id="ap-time" type="time" value={time} onChange={(event) => { setTime(event.target.value); setError(""); }} /></div>
        </div>
        <div className="field">
          <span className="field-label">รูปแบบ</span>
          <div className="role-options">
            {modes.map((item) => (
              <button type="button" className={mode === item ? "active" : ""} aria-pressed={mode === item} onClick={() => setMode(item)} key={item}><Icon name={item === "ออนไลน์" ? "video" : "pin"} size={17} />{item}</button>
            ))}
          </div>
        </div>
        <div className="field"><label className="field-label" htmlFor="ap-note">หมายเหตุ</label><input id="ap-note" value={note} placeholder="เช่น Session 4 · ติดตามการนอน" onChange={(event) => setNote(event.target.value)} /></div>
        {error && <p className="field-error">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="secondary-button" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="primary-button" disabled={saving}><Icon name="calendar" size={17} />บันทึกนัดหมาย</button>
        </div>
      </form>
    </Modal>
  );
}
