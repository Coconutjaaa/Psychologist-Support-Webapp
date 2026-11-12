import Icon from "../../components/Icon";
import LoadState from "../../components/LoadState";
import type { Resource } from "../../hooks/useResource";
import { thaiDate } from "../../lib/date";
import type { Patient, TranscriptUpload } from "../../types";

/** "Sessions" tab: uploaded transcripts waiting to be processed, then past sessions (newest first). */
export default function SessionsTab({ patient, uploads, onUpload, onOpenTranscript, onOpenUpload, onShowInGraph }: {
  patient: Patient; uploads: Resource<TranscriptUpload[]>; onUpload: () => void;
  onOpenTranscript: (session: number) => void; onOpenUpload: (upload: TranscriptUpload) => void; onShowInGraph: (session: number) => void;
}) {
  if (!uploads.data) return <div className="tab-body"><LoadState resources={[uploads]} compact /></div>;
  return (
    <div className="tab-body session-list">
      {uploads.data.map((item) => (
        <article className="session-card pending" key={item.id}>
          <span className="session-num"><Icon name="file" size={18} /></span>
          <div className="session-copy"><strong>{item.name}</strong><small>อัปโหลดเมื่อ {thaiDate(item.date)} · {Math.max(1, Math.round(item.size / 1024))} KB</small><p><span className="chip chip-amber">รอประมวลผล</span> ระบบจะสรุปและเพิ่มประเด็นลงใน Knowledge Graph เมื่อประมวลผลเสร็จ</p></div>
          <div className="session-actions"><button className="secondary-button" onClick={() => onOpenUpload(item)}><Icon name="file" size={16} />เปิดไฟล์</button></div>
        </article>
      ))}
      {[...patient.sessions].reverse().map((item) => (
        <article className="session-card" key={item.number}>
          <span className="session-num">S{item.number}</span>
          <div className="session-copy"><strong>Session {item.number} · {thaiDate(item.date)}</strong><small>{item.duration} นาที</small><p>{item.summary}</p></div>
          <div className="session-actions">
            <button className="secondary-button" onClick={() => onOpenTranscript(item.number)}><Icon name="file" size={16} />เปิด Transcript</button>
            <button className="text-button" onClick={() => onShowInGraph(item.number)}>ดูใน Knowledge Graph <Icon name="arrow" size={15} /></button>
          </div>
        </article>
      ))}
      {!patient.sessions.length && !uploads.data.length && (
        <div className="panel empty-state">
          <span><Icon name="file" size={22} /></span><strong>ยังไม่มี Session</strong><p>อัปโหลด Transcript หลังการพูดคุยครั้งแรกเพื่อเริ่มบันทึก Session</p>
          <button className="secondary-button" onClick={onUpload}><Icon name="upload" size={17} />อัปโหลด Transcript</button>
        </div>
      )}
    </div>
  );
}
