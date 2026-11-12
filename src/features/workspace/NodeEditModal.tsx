import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../api";
import Icon from "../../components/Icon";
import LoadState from "../../components/LoadState";
import Modal from "../../components/Modal";
import useResource from "../../hooks/useResource";
import { nodeTypes } from "../../lib/labels";
import type { KgEdge, KgNode, NodeType, Patient, TranscriptLine } from "../../types";
import { columns, ROWS } from "./graphLayout";

/** An edge in the form, seen from the node being edited: "out" is node → other, "in" is other → node. */
type EdgeDraft = { key: number; direction: "out" | "in"; other: string; relation: string };
type Problem = { field: "label" | "position" | "quote" | "edges"; message: string };

const rows = Array.from({ length: ROWS }, (_, index) => index);

/**
 * Corrects one Knowledge Graph node when what was extracted from the transcript is wrong: its content, place in the
 * diagram, transcript evidence and every edge that touches it. Can also delete the node.
 */
export default function NodeEditModal({ patient, node, onSave, onRemove, onClose }: {
  patient: Patient; node: KgNode; onSave: (node: KgNode, edges: KgEdge[]) => Promise<unknown>; onRemove: () => Promise<unknown>; onClose: () => void;
}) {
  const [label, setLabel] = useState(node.label);
  const [type, setType] = useState<NodeType>(node.type);
  const [category, setCategory] = useState(node.category);
  const [score, setScore] = useState(node.score ?? "");
  const [col, setCol] = useState(node.col);
  const [row, setRow] = useState(node.row);
  const [since, setSince] = useState(node.since);
  const [session, setSession] = useState(node.session);
  const [time, setTime] = useState(node.time);
  const [quote, setQuote] = useState(node.quote);
  const [drafts, setDrafts] = useState(() => patient.edges.flatMap(([from, to, relation], key): EdgeDraft[] =>
    from === node.id ? [{ key, direction: "out", other: to, relation }] : to === node.id ? [{ key, direction: "in", other: from, relation }] : []));
  const [problem, setProblem] = useState<Problem | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nextKey = useRef(patient.edges.length);
  const pickerRef = useRef<HTMLDivElement>(null);
  const lines = useResource(() => api.transcripts.session(patient.id, session), [patient.id, session]);

  // Bring the line currently used as evidence into view once the transcript loads.
  useEffect(() => {
    const picker = pickerRef.current;
    const active = picker?.querySelector<HTMLElement>(".active");
    if (picker && active) picker.scrollTop = active.offsetTop - (picker.clientHeight - active.offsetHeight) / 2;
  }, [lines.data]);

  const byId = new Map(patient.nodes.map((item) => [item.id, item]));
  const others = patient.nodes.filter((item) => item.id !== node.id);
  const occupant = (atCol: number, atRow: number) => others.find((item) => item.col === atCol && item.row === atRow);
  const relationNames = [...new Set(patient.edges.map(([, , relation]) => relation))];
  const edgeCount = patient.edges.filter(([from, to]) => from === node.id || to === node.id).length;
  const name = label.trim() || node.label;

  const changeCol = (next: number) => {
    setCol(next);
    // Keep the row if it is free in the new column, otherwise move to the first free one.
    if (occupant(next, row)) setRow(rows.find((item) => !occupant(next, item)) ?? row);
  };
  const changeSession = (next: number) => {
    setSession(next);
    setTime(next === node.session ? node.time : "");
    setQuote(next === node.session ? node.quote : "");
  };
  const pickLine = (line: TranscriptLine) => { setTime(line.time); setQuote(`“${line.text}”`); setProblem(null); };
  const updateDraft = (key: number, change: Partial<EdgeDraft>) => setDrafts((list) => list.map((item) => (item.key === key ? { ...item, ...change } : item)));
  const addDraft = () => { setDrafts((list) => [...list, { key: nextKey.current++, direction: "out", other: "", relation: "" }]); setProblem(null); };
  const removeDraft = (key: number) => { setDrafts((list) => list.filter((item) => item.key !== key)); setProblem(null); };

  const edges: KgEdge[] = drafts.map((item) => (item.direction === "out" ? [node.id, item.other, item.relation.trim()] : [item.other, node.id, item.relation.trim()]));

  function check(): Problem | null {
    if (!label.trim()) return { field: "label", message: "กรุณากรอกชื่อประเด็น" };
    const taken = occupant(col, row);
    if (taken) return { field: "position", message: `ตำแหน่งนี้มีประเด็น ${taken.label} อยู่แล้ว · เลือกคอลัมน์หรือแถวอื่น` };
    if (!time) return { field: "quote", message: "เลือกข้อความใน Transcript ที่เป็นหลักฐานของประเด็นนี้" };
    if (!quote.trim()) return { field: "quote", message: "กรุณากรอกข้อความที่แสดงเป็นหลักฐาน" };
    if (drafts.some((item) => !item.other)) return { field: "edges", message: "เลือกประเด็นที่เชื่อมให้ครบทุกเส้น" };
    if (drafts.some((item) => !item.relation.trim())) return { field: "edges", message: "กรอกความสัมพันธ์ให้ครบทุกเส้น เช่น กระตุ้น หรือ ช่วยลด" };
    const seen = new Set<string>();
    const labelOf = (id: string) => (id === node.id ? name : byId.get(id)?.label);
    for (const [from, to] of edges) {
      if (seen.has(`${from}>${to}`)) return { field: "edges", message: `มีเส้นเชื่อมจาก ${labelOf(from)} ไป ${labelOf(to)} ซ้ำกัน` };
      seen.add(`${from}>${to}`);
    }
    return null;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = check();
    if (found) return setProblem(found);
    setSaving(true);
    await onSave({ ...node, label: label.trim(), type, category: category.trim() || type, score: score.trim() || undefined, col, row, since, session, time, quote: quote.trim() }, edges);
    setSaving(false);
  };
  const remove = async () => {
    setSaving(true);
    await onRemove();
    setSaving(false);
  };
  const invalid = (field: Problem["field"]) => (problem?.field === field ? "invalid" : "");

  return (
    <Modal wide title="แก้ไขประเด็นใน Knowledge Graph" subtitle="ใช้เมื่อข้อมูลที่ระบบสรุปจาก Transcript ไม่ถูกต้อง · ประเด็นที่แก้แล้วจะมีป้ายว่าแก้ไขโดยนักจิตวิทยา" onClose={onClose}>
      {/* Any typing clears the error message; button-driven changes clear it themselves. */}
      <form className="modal-body node-form" onSubmit={submit} onChange={() => setProblem(null)} noValidate>
        <div className={`field ${invalid("label")}`}>
          <label className="field-label" htmlFor="kg-label">ชื่อประเด็น</label>
          <input id="kg-label" value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="kg-type">ประเภท</label>
            <select id="kg-type" value={type} onChange={(event) => setType(event.target.value as NodeType)}>
              {nodeTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="kg-category">หมวดหมู่</label>
            <input id="kg-category" value={category} placeholder={type} onChange={(event) => setCategory(event.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className={`field ${invalid("position")}`}>
            <label className="field-label" htmlFor="kg-col">คอลัมน์ในแผนผัง</label>
            <select id="kg-col" value={col} onChange={(event) => changeCol(Number(event.target.value))}>
              {columns.map((item, index) => <option value={index} key={item}>{item}</option>)}
            </select>
          </div>
          <div className={`field ${invalid("position")}`}>
            <label className="field-label" htmlFor="kg-row">แถว</label>
            <select id="kg-row" value={row} onChange={(event) => setRow(Number(event.target.value))}>
              {rows.map((item) => {
                const taken = occupant(col, item);
                return <option value={item} disabled={!!taken} key={item}>แถว {item + 1}{taken ? ` · ${taken.label}` : " · ว่าง"}</option>;
              })}
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="kg-since">พบครั้งแรก</label>
            <select id="kg-since" value={since} onChange={(event) => setSince(Number(event.target.value))}>
              {patient.sessions.map((item) => <option value={item.number} key={item.number}>Session {item.number}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="kg-score">แนวโน้มล่าสุด <small>(ไม่บังคับ)</small></label>
            <input id="kg-score" value={score} placeholder="เช่น ความถี่ลดลง 5 → 2" onChange={(event) => setScore(event.target.value)} />
          </div>
        </div>

        <section className="edit-section">
          <div className="edit-section-head">
            <h3>หลักฐานจากบทสนทนา</h3>
            <label className="session-select">
              <span>Session</span>
              <select value={session} onChange={(event) => changeSession(Number(event.target.value))}>
                {patient.sessions.map((item) => <option value={item.number} key={item.number}>Session {item.number}</option>)}
              </select>
            </label>
          </div>
          <p className="edit-hint">เลือกข้อความใน Transcript ที่เป็นหลักฐาน แล้วตัดให้เหลือเฉพาะส่วนที่เกี่ยวข้องได้</p>
          {!lines.data ? <LoadState resources={[lines]} compact /> : lines.data.length ? (
            <div className="line-picker" ref={pickerRef}>
              {lines.data.map((line, index) => (
                <button type="button" className={`${line.speaker} ${line.time === time ? "active" : ""}`} aria-pressed={line.time === time} onClick={() => pickLine(line)} key={index}>
                  <span className="transcript-time">{line.time}</span>
                  <span><small>{line.speaker === "clinician" ? "นักจิตวิทยา" : patient.name}</small>{line.text}</span>
                </button>
              ))}
            </div>
          ) : <p className="empty-note">ยังไม่มี Transcript ของ Session นี้</p>}
          <div className={`field ${invalid("quote")}`}>
            <label className="field-label" htmlFor="kg-quote">ข้อความที่แสดงเป็นหลักฐาน{time && <small> · Session {session} · {time}</small>}</label>
            <textarea id="kg-quote" value={quote} placeholder="เลือกข้อความจาก Transcript ด้านบน" onChange={(event) => setQuote(event.target.value)} />
          </div>
        </section>

        <section className="edit-section">
          <div className="edit-section-head"><h3>เส้นเชื่อม</h3><small>{drafts.length} เส้น</small></div>
          {drafts.length > 0 ? (
            <div className="edge-rows">
              {drafts.map((item) => {
                const other = byId.get(item.other)?.label ?? "…";
                const [from, to] = item.direction === "out" ? [name, other] : [other, name];
                const incomplete = problem?.field === "edges" && (!item.other || !item.relation.trim());
                return (
                  <div className={`edge-row ${incomplete ? "invalid" : ""}`} key={item.key}>
                    <div className="edge-controls">
                      <select aria-label="ทิศทาง" value={item.direction} onChange={(event) => updateDraft(item.key, { direction: event.target.value as EdgeDraft["direction"] })}>
                        <option value="out">ส่งผลไปยัง</option>
                        <option value="in">ได้รับผลจาก</option>
                      </select>
                      <select aria-label="ประเด็นที่เชื่อม" value={item.other} onChange={(event) => updateDraft(item.key, { other: event.target.value })}>
                        <option value="" disabled>เลือกประเด็น</option>
                        {others.map((option) => <option value={option.id} key={option.id}>{option.type} · {option.label}</option>)}
                      </select>
                      <input aria-label="ความสัมพันธ์" list="kg-relations" value={item.relation} placeholder="ความสัมพันธ์ เช่น กระตุ้น" onChange={(event) => updateDraft(item.key, { relation: event.target.value })} />
                      <button type="button" className="icon-button danger" aria-label="ลบเส้นเชื่อม" title="ลบเส้นเชื่อม" onClick={() => removeDraft(item.key)}><Icon name="trash" size={16} /></button>
                    </div>
                    <p className="edge-preview">
                      <span className={item.direction === "out" ? "current" : ""}>{from}</span><em>—{item.relation.trim() || "…"}→</em><span className={item.direction === "in" ? "current" : ""}>{to}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          ) : <p className="edit-hint">ประเด็นนี้ยังไม่มีเส้นเชื่อม</p>}
          <datalist id="kg-relations">{relationNames.map((item) => <option value={item} key={item} />)}</datalist>
          <button type="button" className="text-button add-edge" onClick={addDraft} disabled={!others.length}><Icon name="plus" size={15} />เพิ่มเส้นเชื่อม</button>
        </section>

        <div className="danger-zone">
          <div>
            <strong>{confirmDelete ? "ยืนยันการลบประเด็นนี้?" : "ลบประเด็นนี้"}</strong>
            <small>{confirmDelete ? `เส้นเชื่อม ${edgeCount} เส้นของประเด็นนี้จะถูกลบด้วย และย้อนกลับไม่ได้` : "ใช้เมื่อระบบดึงประเด็นที่ไม่มีอยู่จริงมาจาก Transcript"}</small>
          </div>
          {confirmDelete ? (
            <>
              <button type="button" className="secondary-button" onClick={() => setConfirmDelete(false)}>ไม่ลบ</button>
              <button type="button" className="secondary-button danger" onClick={remove} disabled={saving}><Icon name="trash" size={15} />ลบประเด็น</button>
            </>
          ) : <button type="button" className="secondary-button" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={15} />ลบ</button>}
        </div>

        {problem && <p className="field-error form-error">{problem.message}</p>}
        <div className="modal-foot">
          <button type="button" className="secondary-button" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="primary-button" disabled={saving}><Icon name="check" size={17} />บันทึกการแก้ไข</button>
        </div>
      </form>
    </Modal>
  );
}
