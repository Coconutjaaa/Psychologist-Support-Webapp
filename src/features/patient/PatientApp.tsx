import { useState } from "react";
import { api } from "../../api";
import Icon from "../../components/Icon";
import LoadState from "../../components/LoadState";
import { features } from "../../config";
import { useApiAction, useToast } from "../../components/Toast";
import useResource from "../../hooks/useResource";
import { addDays, iso, thaiDate, thaiLongDate, todayIso } from "../../lib/date";
import type { Session } from "../../types";
import AppointmentDialog from "./AppointmentDialog";
import CheckinChat from "./CheckinChat";
import MoodCheckin from "./MoodCheckin";
import MoodHistoryDialog from "./MoodHistoryDialog";
import PatientSidebar from "./PatientSidebar";

/** The patient side: daily mood check-in, the check-in chat, a weekly summary and the next appointment (when `features.appointments`). */
export default function PatientApp({ session }: { session: Session }) {
  const notify = useToast();
  const run = useApiAction();
  const home = useResource(() => api.me.home(), [session.email]);
  const [dialog, setDialog] = useState<"appointment" | "history" | null>(null);

  if (!home.data) return <main className="patient-app"><LoadState resources={[home]} /></main>;

  const { clinicianName, messages, moods, nextAppointment: next, highlights } = home.data;
  const today = todayIso();
  const dayLabel = (date: string) => (date === today ? "วันนี้" : date === iso(addDays(new Date(), -1)) ? "เมื่อวาน" : thaiDate(date, { day: "numeric", month: "short" }));

  const saveMood = (score: number) =>
    run(() => api.me.saveMood(today, score), () => {
      home.mutate((data) => ({ ...data, moods: { ...data.moods, [today]: score } }));
      notify("บันทึกอารมณ์วันนี้แล้ว");
    });
  const requestReschedule = (appointmentId: string) =>
    run(() => api.me.requestReschedule(appointmentId), (updated) => {
      home.mutate((data) => ({ ...data, nextAppointment: updated }));
      notify(`ส่งคำขอเลื่อนนัดถึง ${clinicianName} แล้ว`);
    });

  return (
    <main className="patient-app">
      <div className="patient-welcome">
        <div><span className="eyebrow">{thaiLongDate(today)}</span><h1>สวัสดีค่ะ {session.name}</h1><p>พื้นที่ส่วนตัวสำหรับพูดคุยและอัปเดตอาการ</p></div>
        {features.appointments && (
          <button className="next-appointment" onClick={() => setDialog("appointment")}>
            <span><Icon name="calendar" /></span>
            <div><small>นัดหมายครั้งถัดไป</small><strong>{next ? `${thaiDate(next.date, { day: "numeric", month: "short" })} · ${next.time} น.` : "ยังไม่มีนัดหมาย"}</strong></div>
            <Icon name="chevron" size={16} />
          </button>
        )}
      </div>
      <MoodCheckin savedScore={moods[today]} onSave={saveMood} />
      <div className="patient-layout">
        <CheckinChat initialMessages={messages} clinicianName={clinicianName} dayLabel={dayLabel} />
        <PatientSidebar moods={moods} highlights={highlights} onShowHistory={() => setDialog("history")} />
      </div>
      <a className="mobile-call" href="tel:1323" aria-label="โทรสายด่วนสุขภาพจิต 1323"><Icon name="phone" /><span>สายด่วน 1323</span></a>

      {dialog === "appointment" && <AppointmentDialog appointment={next} clinicianName={clinicianName} onRequestReschedule={requestReschedule} onClose={() => setDialog(null)} />}
      {dialog === "history" && <MoodHistoryDialog moods={moods} dayLabel={dayLabel} onClose={() => setDialog(null)} />}
    </main>
  );
}
