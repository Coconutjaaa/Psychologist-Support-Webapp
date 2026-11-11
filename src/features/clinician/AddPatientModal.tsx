import { useState, type FormEvent } from "react";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { withKhun } from "../../lib/labels";
import type { NewPatientInput } from "../../types";

export default function AddPatientModal({ onSave, onClose }: { onSave: (input: NewPatientInput) => Promise<unknown>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const years = Number(age);
    if (!name.trim()) return setError("กรุณากรอกชื่อ");
    if (!years || years < 1 || years > 120) return setError("กรุณากรอกอายุให้ถูกต้อง");
    setSaving(true);
    await onSave({ name: withKhun(name.trim()), age: years, occupation: occupation.trim() || "ไม่ระบุอาชีพ" });
    setSaving(false);
  };
  return (
    <Modal title="เพิ่มผู้รับคำปรึกษา" subtitle="ข้อมูลพื้นฐานสำหรับเปิดเคสใหม่" onClose={onClose}>
      <form className="modal-body" onSubmit={submit} noValidate>
        <div className="field"><label className="field-label" htmlFor="pt-name">ชื่อเล่น</label><input id="pt-name" autoFocus value={name} placeholder="เช่น บี" onChange={(event) => { setName(event.target.value); setError(""); }} /></div>
        <div className="field-row">
          <div className="field"><label className="field-label" htmlFor="pt-age">อายุ</label><input id="pt-age" type="number" min={1} max={120} value={age} onChange={(event) => { setAge(event.target.value); setError(""); }} /></div>
          <div className="field"><label className="field-label" htmlFor="pt-job">อาชีพ</label><input id="pt-job" value={occupation} placeholder="ไม่บังคับ" onChange={(event) => setOccupation(event.target.value)} /></div>
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>ยกเลิก</button><button type="submit" className="primary-button" disabled={saving}><Icon name="plus" size={17} />เพิ่ม</button></div>
      </form>
    </Modal>
  );
}
