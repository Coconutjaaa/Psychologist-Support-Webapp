import { api } from "../api";
import { features } from "../config";
import useResource from "../hooks/useResource";
import { initials, roleLabels } from "../lib/labels";
import type { Preferences, Role, Session } from "../types";
import Icon from "./Icon";
import LoadState from "./LoadState";
import Modal from "./Modal";
import { useApiAction, useToast } from "./Toast";

/** Notification switches per role: [preference id, title, description]. */
const preferenceOptions: Record<Role, [key: string, title: string, text: string][]> = {
  clinician: [
    ["notifyCheckin", "แจ้งเตือนเมื่อผู้รับคำปรึกษาบันทึกอาการ", "รับการแจ้งเตือนเมื่อมีบันทึกอารมณ์หรือข้อความใหม่"],
    ["autoSummary", "สรุป Transcript อัตโนมัติ", "สร้างสรุปและอัปเดต Knowledge Graph หลังอัปโหลด"],
    ["weeklyEmail", "อีเมลสรุปรายสัปดาห์", "สรุปความเปลี่ยนแปลงของผู้รับคำปรึกษาทุกวันจันทร์"],
  ],
  patient: [
    ["dailyReminder", "เตือนให้บันทึกอารมณ์ทุกวัน", "แจ้งเตือนเวลา 20:00 น."],
    ...(features.appointments ? [["appointmentReminder", "เตือนก่อนถึงนัดหมาย", "แจ้งเตือนล่วงหน้า 1 วัน"] as [string, string, string]] : []),
    ["shareWithClinician", "แชร์บันทึกกับนักจิตวิทยา", "ให้นักจิตวิทยาที่ดูแลเห็นสรุปบันทึกของคุณ"],
  ],
};

export default function SettingsModal({ session, avatarClass, onClose }: { session: Session; avatarClass: string; onClose: () => void }) {
  const notify = useToast();
  const run = useApiAction();
  const preferences = useResource(() => api.settings.get(), []);
  // Each switch saves straight away; "เสร็จสิ้น" only closes the dialog.
  const toggle = (key: string, on: boolean) => {
    const next: Preferences = { ...preferences.data, [key]: on };
    preferences.mutate(() => next);
    void run(() => api.settings.save(next));
  };
  return (
    <Modal title="การตั้งค่า" subtitle="ตั้งค่าบัญชีและการแจ้งเตือน" onClose={onClose}>
      <div className="modal-body">
        <div className="profile-row">
          <span className={`avatar ${avatarClass}`}>{initials(session.name)}</span>
          <div><strong>{session.name}</strong><small>{session.email}</small></div>
          <span className="role-chip">{roleLabels[session.role]}</span>
        </div>
        {!preferences.data ? <LoadState resources={[preferences]} compact /> : preferenceOptions[session.role].map(([key, title, text]) => (
          <label className="setting-row" key={key}>
            <div><strong>{title}</strong><small>{text}</small></div>
            <input type="checkbox" className="switch" role="switch" checked={preferences.data?.[key] ?? true} onChange={(event) => toggle(key, event.target.checked)} />
          </label>
        ))}
        {api.resetDemoData && (
          <div className="danger-zone">
            <div><strong>รีเซ็ตข้อมูลทดลอง</strong><small>ล้าง{features.appointments && "นัดหมาย "}บันทึก แชท และข้อมูลที่เพิ่มไว้ในเบราว์เซอร์นี้</small></div>
            <button className="secondary-button" onClick={() => { api.resetDemoData?.(); window.location.reload(); }}><Icon name="refresh" size={15} />รีเซ็ต</button>
          </div>
        )}
        <div className="modal-foot"><button className="primary-button" onClick={() => { onClose(); notify("บันทึกการตั้งค่าแล้ว"); }}>เสร็จสิ้น</button></div>
      </div>
    </Modal>
  );
}
