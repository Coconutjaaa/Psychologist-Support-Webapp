import { useState } from "react";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { appName } from "../../config";
import { thaiLongDate } from "../../lib/date";
import { appointmentIcs, downloadFile } from "../../lib/download";
import type { Appointment } from "../../types";

/** The patient's next appointment, with "add to calendar" (.ics) and "request reschedule". */
export default function AppointmentDialog({ appointment, clinicianName, onRequestReschedule, onClose }: {
  appointment?: Appointment; clinicianName: string; onRequestReschedule: (appointmentId: string) => Promise<unknown>; onClose: () => void;
}) {
  const notify = useToast();
  const [requesting, setRequesting] = useState(false);
  const requestReschedule = async (id: string) => {
    setRequesting(true);
    await onRequestReschedule(id);
    setRequesting(false);
  };
  return (
    <Modal title="นัดหมายครั้งถัดไป" subtitle={`กับ ${clinicianName}`} onClose={onClose}>
      <div className="modal-body">
        {appointment ? (
          <>
            <div className="appt-detail"><span><Icon name="calendar" /></span><div><strong>{thaiLongDate(appointment.date)}</strong><small>{appointment.time} น. · {appointment.mode}{appointment.note && ` · ${appointment.note}`}</small></div></div>
            {appointment.rescheduleRequested && <p className="auth-notice modal-notice">ส่งคำขอเลื่อนนัดแล้ว รอ {clinicianName} ยืนยันวันใหม่</p>}
            <div className="modal-foot">
              <button className="secondary-button" onClick={() => { downloadFile(`${appName.toLowerCase()}-appointment.ics`,appointmentIcs(appointment, clinicianName), "text/calendar"); notify("ดาวน์โหลดไฟล์ปฏิทินแล้ว"); }}><Icon name="download" size={16} />เพิ่มลงปฏิทิน</button>
              <button className="primary-button" disabled={appointment.rescheduleRequested || requesting} onClick={() => requestReschedule(appointment.id)}>
                <Icon name="clock" size={16} />{appointment.rescheduleRequested ? "ส่งคำขอแล้ว" : "ขอเลื่อนนัด"}
              </button>
            </div>
          </>
        ) : <p className="empty-note">ยังไม่มีนัดหมาย {clinicianName} จะแจ้งนัดหมายครั้งถัดไปผ่านแอปนี้</p>}
      </div>
    </Modal>
  );
}
