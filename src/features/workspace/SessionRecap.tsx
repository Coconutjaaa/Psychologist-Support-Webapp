import { useState } from "react";
import { api } from "../../api";
import Icon from "../../components/Icon";
import LoadState from "../../components/LoadState";
import useResource from "../../hooks/useResource";
import { thaiDate } from "../../lib/date";
import { toneOf } from "../../lib/labels";
import type { Patient } from "../../types";

/** "155" → "2 ชม. 35 นาที" */
function totalTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours} ชม.`, (rest || !hours) && `${rest} นาที`].filter(Boolean).join(" ");
}

/** Insights are written "Session 2: …"; the row already names the session, so drop that prefix. */
const withoutSessionPrefix = (text: string) => text.replace(/^Session[^:]*:\s*/, "");

/**
 * Overview block: every session in order with its key insight, the gist of its summary and the KG themes it
 * introduced. Each row expands to the full summary (key points, what was done, homework, next focus);
 * the latest session starts expanded.
 */
export default function SessionRecap({ patient, onOpenTranscript }: { patient: Patient; onOpenTranscript: (session: number) => void }) {
  const { sessions } = patient;
  const summaries = useResource(() => api.transcripts.summaries(patient.id), [patient.id]);
  const [expanded, setExpanded] = useState<number[]>(() => sessions.slice(-1).map((item) => item.number));
  const toggle = (number: number) => setExpanded((list) => (list.includes(number) ? list.filter((item) => item !== number) : [...list, number]));
  const minutes = sessions.reduce((sum, item) => sum + item.duration, 0);

  return (
    <section className="panel span-all">
      <div className="panel-head">
        <h2>สรุป Session</h2>
        {sessions.length > 0 && <span className="chip chip-muted">{sessions.length} ครั้ง · รวม {totalTime(minutes)}</span>}
      </div>
      {!sessions.length && <p className="empty-note">ยังไม่มี Session · อัปโหลด Transcript หลังการพูดคุยครั้งแรกเพื่อเริ่มสรุป</p>}
      {sessions.length > 0 && !summaries.data && <div className="panel-body"><LoadState resources={[summaries]} compact /></div>}
      {sessions.map((item, index) => {
        const summary = summaries.data?.find((entry) => entry.session === item.number);
        const newThemes = patient.nodes.filter((node) => node.since === item.number);
        const latest = index === sessions.length - 1;
        const open = expanded.includes(item.number);
        return (
          <article className={`recap-row ${latest ? "latest" : ""}`} key={item.number}>
            <span className="session-num">S{item.number}</span>
            <div className="recap-copy">
              <small>Session {item.number} · {thaiDate(item.date)} · {item.duration} นาที{latest && " · ล่าสุด"}</small>
              <p className="recap-insight">{withoutSessionPrefix(item.insight)}</p>
              {summary && <p className="recap-gist">{summary.gist}</p>}
              {summaries.data && !summary && <p className="recap-gist muted-text">ยังไม่มีสรุปของ Session นี้ · ระบบจะสรุปเมื่อประมวลผล Transcript เสร็จ</p>}
              {summary && open && (
                <div className="recap-detail" id={`recap-${item.number}`}>
                  <div><h3>ประเด็นสำคัญ</h3><ul>{summary.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></div>
                  <div className="recap-columns">
                    <div><h3>สิ่งที่ทำใน Session</h3><ul>{summary.interventions.map((point) => <li key={point}>{point}</li>)}</ul></div>
                    <div><h3>การบ้าน</h3><ul>{summary.homework.map((point) => <li key={point}>{point}</li>)}</ul></div>
                  </div>
                  {summary.nextFocus && <div><h3>เป้าหมายครั้งถัดไป</h3><p>{summary.nextFocus}</p></div>}
                </div>
              )}
              {summary && (
                <button className="text-button recap-toggle" aria-expanded={open} aria-controls={`recap-${item.number}`} onClick={() => toggle(item.number)}>
                  {open ? "ย่อสรุป" : "ดูสรุปเต็ม"} <Icon name="chevron" size={14} />
                </button>
              )}
              {newThemes.length > 0 && (
                <div className="recap-tags">
                  <small>ประเด็นใหม่ใน KG</small>
                  {newThemes.map((node) => <span className={`kg-tag tone-${toneOf[node.type]}`} key={node.id}>{node.type} · {node.label}</span>)}
                </div>
              )}
            </div>
            <div className="recap-side">
              <button className="text-button" onClick={() => onOpenTranscript(item.number)}>เปิด Transcript <Icon name="arrow" size={15} /></button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
