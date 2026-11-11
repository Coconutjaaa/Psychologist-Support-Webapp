import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import Icon from "../../components/Icon";
import { useApiAction } from "../../components/Toast";
import { appName } from "../../config";
import { toneOf } from "../../lib/labels";
import type { KgChatMessage, Patient } from "../../types";

const suggestions = ["สรุปเคสนี้ให้หน่อย", "อะไรเป็นตัวกระตุ้นอาการหลัก?", "ปัจจัยปกป้องมีอะไรบ้าง?", "อาการเปลี่ยนไปอย่างไรตั้งแต่ Session แรก?"];

/** "ถาม <appName> เกี่ยวกับเคสนี้": questions answered from the patient's Knowledge Graph (api.kg.ask), with citations. */
export default function KgChat({ patient, messages, onChange, onCite, onOpenTranscript }: {
  patient: Patient; messages: KgChatMessage[]; onChange: (update: (messages: KgChatMessage[]) => KgChatMessage[]) => void;
  onCite: (nodeId: string) => void; onOpenTranscript: (session: number, nodeId: string) => void;
}) {
  const run = useApiAction();
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const byId = new Map(patient.nodes.map((node) => [node.id, node]));
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length, thinking]);
  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || thinking) return;
    setDraft("");
    onChange((current) => [...current, { id: Date.now(), from: "user", text }]);
    setThinking(true);
    await run(() => api.kg.ask(patient.id, text), (answer) => onChange((current) => [...current, { id: Date.now(), from: "ai", text: "", answer }]));
    setThinking(false);
  };
  const composer = (autoFocus: boolean) => (
    <div className="search-box">
      <Icon name="search" />
      <input value={draft} autoFocus={autoFocus} aria-label="ถามคำถามเกี่ยวกับเคสนี้" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) ask(draft); }} placeholder={`เช่น ${patient.askExample ?? "อะไรเป็นตัวกระตุ้นอาการหลัก?"}`} />
      <button onClick={() => ask(draft)} disabled={thinking} aria-label="ส่งคำถาม"><Icon name="arrow" size={18} /></button>
    </div>
  );
  const chips = <div className="kg-suggestions">{suggestions.map((item) => <button onClick={() => ask(item)} disabled={thinking} key={item}>{item}</button>)}</div>;

  if (!messages.length) {
    return (
      <section>
        <div className="ai-search">
          <div className="ai-symbol"><Icon name="sparkle" size={22} /></div>
          <div className="ai-copy"><strong>ถาม {appName} เกี่ยวกับเคสนี้</strong><span>คำตอบอ้างอิงจาก Transcript และ Knowledge Graph เท่านั้น</span></div>
          {composer(false)}
        </div>
        {chips}
      </section>
    );
  }
  return (
    <section className="kg-chat-card">
      <div className="kg-chat-head">
        <div className="ai-symbol"><Icon name="sparkle" size={20} /></div>
        <div className="ai-copy"><strong>ถาม {appName} เกี่ยวกับเคสนี้</strong><span>ค้นจาก Knowledge Graph ของ{patient.name} · {patient.nodes.length} ประเด็น · {patient.sessions.length} Session</span></div>
        <button className="secondary-button" onClick={() => onChange(() => [])}><Icon name="refresh" size={15} />เริ่มใหม่</button>
      </div>
      <div className="kg-messages" ref={listRef}>
        {messages.map((message) => message.from === "user" ? (
          <div className="kg-msg user" key={message.id}><div>{message.text}</div></div>
        ) : message.answer && (
          <div className="kg-msg" key={message.id}>
            <span className="mini-bot"><Icon name="sparkle" size={15} /></span>
            <div className="kg-answer">
              <p>{message.answer.text}</p>
              {message.answer.bullets.length > 0 && <ul>{message.answer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              {message.answer.evidence.length > 0 && (
                <div className="kg-evidence">
                  {message.answer.evidence.map((node) => (
                    <button onClick={() => onOpenTranscript(node.session, node.id)} key={node.id}><span>{node.quote}</span><small>Session {node.session} · {node.time} · เปิด Transcript</small></button>
                  ))}
                </div>
              )}
              {message.answer.sources.length > 0 && (
                <div className="kg-sources">
                  <small>อ้างอิงใน KG:</small>
                  {message.answer.sources.map((id) => byId.get(id)).map((node) => node && (
                    <button className={`kg-source tone-${toneOf[node.type]}`} onClick={() => onCite(node.id)} title="แสดงใน Knowledge Graph" key={node.id}>{node.type} · {node.label}</button>
                  ))}
                </div>
              )}
              <small className="kg-meta">{message.answer.meta}</small>
            </div>
          </div>
        ))}
        {thinking && <div className="kg-msg"><span className="mini-bot"><Icon name="sparkle" size={15} /></span><div className="typing"><i><span /><span /><span /></i>กำลังค้นหาใน Knowledge Graph…</div></div>}
      </div>
      {chips}
      <div className="kg-composer">{composer(true)}</div>
    </section>
  );
}
