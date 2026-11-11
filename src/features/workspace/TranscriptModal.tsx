import { api } from "../../api";
import Icon from "../../components/Icon";
import LoadState from "../../components/LoadState";
import Modal from "../../components/Modal";
import useResource from "../../hooks/useResource";
import { thaiDate } from "../../lib/date";
import { toneOf } from "../../lib/labels";
import type { Patient, TranscriptLine, TranscriptUpload } from "../../types";

/** Either a processed session (optionally highlighting one quoted node) or a raw uploaded file. */
export type TranscriptTarget = { session?: number; highlight?: string; upload?: TranscriptUpload };

/** The whole transcript of a session, with the lines the Knowledge Graph quotes tagged; or the text of an uploaded file. */
export default function TranscriptModal({ patient, target, onClose }: { patient: Patient; target: TranscriptTarget; onClose: () => void }) {
  const { session, highlight, upload } = target;
  const lines = useResource(
    () => (session !== undefined && !upload ? api.transcripts.session(patient.id, session) : Promise.resolve<TranscriptLine[]>([])),
    [patient.id, session, upload],
  );

  if (upload) {
    return (
      <Modal wide title={`Transcript · ${upload.name}`} subtitle={`อัปโหลดเมื่อ ${thaiDate(upload.date)} · รอระบบประมวลผลเพื่ออัปเดต Knowledge Graph`} onClose={onClose}>
        <div className="modal-body">
          {upload.text ? <pre className="transcript-raw">{upload.text}</pre> : <p className="empty-note">แสดงตัวอย่างได้เฉพาะไฟล์ .txt — ไฟล์นี้ถูกเก็บไว้เพื่อรอประมวลผล</p>}
        </div>
      </Modal>
    );
  }

  const record = patient.sessions.find((item) => item.number === session);
  // A KG node quotes the line at its own timestamp in its session.
  const quotedAt = (time: string) => patient.nodes.filter((node) => node.session === session && node.time === time);
  return (
    <Modal wide title={`Transcript · Session ${session}`} subtitle={record && `${patient.name} · ${thaiDate(record.date)} · ${record.duration} นาที · ${record.summary}`} onClose={onClose}>
      <div className="modal-body">
        {!lines.data ? <LoadState resources={[lines]} compact /> : (
          <>
            <p className="transcript-note"><Icon name="info" size={15} />บทสนทนาทั้ง Session · ป้ายสีใต้ข้อความคือช่วงที่ Knowledge Graph อ้างอิง</p>
            <div className="transcript">
              {lines.data.map((line, index) => {
                const nodes = quotedAt(line.time);
                const highlighted = nodes.some((node) => node.id === highlight);
                return (
                  <div className={`transcript-line ${line.speaker} ${highlighted ? "highlight" : ""}`} key={index} ref={highlighted ? (element) => { element?.scrollIntoView({ block: "center" }); } : undefined}>
                    <span className="transcript-time">{line.time}</span>
                    <div>
                      <small>{line.speaker === "clinician" ? "นักจิตวิทยา" : patient.name}</small>
                      <p>{line.text}</p>
                      {nodes.map((node) => <span className={`kg-tag tone-${toneOf[node.type]}`} key={node.id}>{node.type} · {node.label}</span>)}
                    </div>
                  </div>
                );
              })}
              {!lines.data.length && <p className="empty-note">ยังไม่มี Transcript ของ Session นี้</p>}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
