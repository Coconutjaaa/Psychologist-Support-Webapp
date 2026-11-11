import { useState, type FormEvent } from "react";
import { api } from "../../api";
import Icon from "../../components/Icon";
import LoadState from "../../components/LoadState";
import { useApiAction, useToast } from "../../components/Toast";
import type { Resource } from "../../hooks/useResource";
import { thaiDate } from "../../lib/date";
import type { Note } from "../../types";

/** "บันทึก" tab: clinician-only notes on the case. */
export default function NotesTab({ patientId, notes }: { patientId: string; notes: Resource<Note[]> }) {
  const notify = useToast();
  const run = useApiAction();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    await run(() => api.notes.create(patientId, text), (note) => {
      notes.mutate((list) => [note, ...list]);
      setDraft("");
      notify("บันทึกโน้ตแล้ว");
    });
    setSaving(false);
  };
  const remove = (note: Note) =>
    run(() => api.notes.remove(patientId, note.id), () => {
      notes.mutate((list) => list.filter((item) => item.id !== note.id));
      notify("ลบบันทึกแล้ว");
    });

  return (
    <div className="tab-body">
      <form className="note-form" onSubmit={add}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="บันทึกใหม่" placeholder="บันทึกสิ่งที่สังเกตได้ แผนการรักษา หรือการบ้านสำหรับครั้งถัดไป..." />
        <div><small><Icon name="info" size={14} />บันทึกนี้เห็นเฉพาะนักจิตวิทยา</small><button className="primary-button" type="submit" disabled={!draft.trim() || saving}>บันทึก</button></div>
      </form>
      {!notes.data ? <LoadState resources={[notes]} compact /> : (
        <div className="note-list">
          {notes.data.map((note) => (
            <article className="note-card" key={note.id}>
              <div><small>{thaiDate(note.date)}</small><p>{note.text}</p></div>
              <button className="icon-button danger" aria-label="ลบบันทึก" onClick={() => remove(note)}><Icon name="trash" size={17} /></button>
            </article>
          ))}
          {!notes.data.length && <p className="empty-note">ยังไม่มีบันทึก</p>}
        </div>
      )}
    </div>
  );
}
