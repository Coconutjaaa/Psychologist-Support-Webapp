import { useState, type FormEvent } from "react";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { appName } from "../../config";

export default function SupportModal({ onSend, onClose }: { onSend: (message: string) => Promise<unknown>; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    await onSend(message.trim());
    setSending(false);
  };
  return (
    <Modal title="ติดต่อทีมงาน" subtitle={`แจ้งปัญหาการใช้งานหรือขอความช่วยเหลือจากทีม ${appName}`} onClose={onClose}>
      <form className="modal-body" onSubmit={submit}>
        <div className="field"><label className="field-label" htmlFor="support-message">ข้อความ</label><textarea id="support-message" autoFocus value={message} onChange={(event) => setMessage(event.target.value)} placeholder="อธิบายสิ่งที่ต้องการให้ช่วย..." /></div>
        <div className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>ยกเลิก</button><button type="submit" className="primary-button" disabled={!message.trim() || sending}><Icon name="send" size={16} />ส่งข้อความ</button></div>
      </form>
    </Modal>
  );
}
