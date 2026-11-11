import { useState } from "react";
import { api } from "../../api";
import LoadState from "../../components/LoadState";
import { features } from "../../config";
import { useApiAction, useToast } from "../../components/Toast";
import useResource from "../../hooks/useResource";
import usePersistentState from "../../hooks/usePersistentState";
import { byDateTime, thaiDate, todayIso } from "../../lib/date";
import type { Appointment, AppointmentInput, KgChatMessage, NewPatientInput, Session } from "../../types";
import PatientWorkspace from "../workspace/PatientWorkspace";
import AddPatientModal from "./AddPatientModal";
import AppointmentModal from "./AppointmentModal";
import ClinicianNav, { type Page } from "./ClinicianNav";
import DashboardPage from "./DashboardPage";
import PatientList from "./PatientList";
import SchedulePage from "./SchedulePage";
import SupportModal from "./SupportModal";

type Dialog = { kind: "appointment"; initial: Partial<Appointment> } | { kind: "patient" } | { kind: "support" } | null;

/** The clinician side: loads the caseload and appointments, switches pages and owns the dialogs. */
export default function ClinicianApp({ session }: { session: Session }) {
  const notify = useToast();
  const run = useApiAction();
  const patients = useResource(() => api.patients.list(), []);
  // With appointments switched off the backend is never asked for them (it may not have the endpoint yet).
  const appointments = useResource(() => (features.appointments ? api.appointments.list() : Promise.resolve<Appointment[]>([])), []);
  const [page, setPage] = useState<Page>("overview");
  const [listHidden, setListHidden] = usePersistentState("patient-list-hidden", false);
  const [activeId, setActiveId] = useState("a");
  const [dialog, setDialog] = useState<Dialog>(null);
  // KG chat history per patient. Kept in memory only, so switching patients keeps each conversation until sign-out.
  const [chats, setChats] = useState<Record<string, KgChatMessage[]>>({});

  if (!patients.data || !appointments.data) return <LoadState resources={[patients, appointments]} />;

  const patientList = patients.data;
  const today = todayIso();
  const allAppointments = [...appointments.data].sort(byDateTime);
  const upcoming = allAppointments.filter((appointment) => appointment.date >= today);
  const active = patientList.find((patient) => patient.id === activeId) ?? patientList[0];
  const nameOf = (patientId: string) => patientList.find((patient) => patient.id === patientId)?.name ?? "";

  const openPatient = (id: string) => { setActiveId(id); setPage("patients"); };
  const schedule = (initial: Partial<Appointment>) => setDialog({ kind: "appointment", initial });

  const saveAppointment = (input: AppointmentInput) =>
    run(() => api.appointments.save(input), (saved) => {
      appointments.mutate((list) => (list.some((item) => item.id === saved.id) ? list.map((item) => (item.id === saved.id ? saved : item)) : [...list, saved]));
      notify(`${input.id ? "เลื่อนนัด" : "นัดหมาย"}${nameOf(saved.patientId)} วันที่ ${thaiDate(saved.date)} เวลา ${saved.time} น. แล้ว`);
      setDialog(null);
    });
  const cancelAppointment = (appointment: Appointment) =>
    run(() => api.appointments.cancel(appointment.id), () => {
      appointments.mutate((list) => list.filter((item) => item.id !== appointment.id));
      notify(`ยกเลิกนัดหมาย${nameOf(appointment.patientId)} แล้ว`);
    });
  const addPatient = (input: NewPatientInput) =>
    run(() => api.patients.create(input), (patient) => {
      patients.mutate((list) => [...list, patient]);
      setActiveId(patient.id);
      setDialog(null);
      notify(`เพิ่ม${patient.name}แล้ว`);
    });
  const sendSupport = (message: string) =>
    run(() => api.support.send(message), () => {
      setDialog(null);
      notify("ส่งข้อความถึงทีมสนับสนุนแล้ว ทีมงานจะติดต่อกลับภายใน 1 วันทำการ");
    });

  return (
    // Split sidebar: a slim icon rail for sections, plus a secondary panel (the patient list) that can be hidden.
    <div className={`app-shell ${page === "patients" && !listHidden ? "" : "no-list"}`}>
      <ClinicianNav page={page} patientCount={patientList.length} listHidden={listHidden} onPage={setPage} onToggleList={() => setListHidden(!listHidden)} onHelp={() => setDialog({ kind: "support" })} />

      {page === "patients" && active && (
        <>
          {!listHidden && <PatientList patients={patientList} activeId={active.id} onSelect={setActiveId} onAdd={() => setDialog({ kind: "patient" })} onHide={() => setListHidden(true)} />}
          <main className="workspace">
            <PatientWorkspace
              key={active.id}
              patient={active}
              appointment={upcoming.find((appointment) => appointment.patientId === active.id)}
              chat={chats[active.id] ?? []}
              onChatChange={(update) => setChats((current) => ({ ...current, [active.id]: update(current[active.id] ?? []) }))}
              onSchedule={(appointment) => schedule(appointment ?? { patientId: active.id })}
              onShowList={listHidden ? () => setListHidden(false) : undefined}
            />
          </main>
        </>
      )}
      {page === "overview" && <main className="workspace"><DashboardPage name={session.name} patients={patientList} upcoming={upcoming} onOpen={openPatient} onSchedule={() => schedule({})} onGo={setPage} /></main>}
      {page === "schedule" && features.appointments && <main className="workspace"><SchedulePage patients={patientList} appointments={allAppointments}onOpen={openPatient} onSchedule={schedule} onCancel={cancelAppointment} /></main>}

      {dialog?.kind === "appointment" && <AppointmentModal patients={patientList} initial={dialog.initial} onClose={() => setDialog(null)} onSave={saveAppointment} />}
      {dialog?.kind === "patient" && <AddPatientModal onClose={() => setDialog(null)} onSave={addPatient} />}
      {dialog?.kind === "support" && <SupportModal onClose={() => setDialog(null)} onSend={sendSupport} />}
    </div>
  );
}
