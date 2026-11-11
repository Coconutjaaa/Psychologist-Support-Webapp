import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import Icon from "../../components/Icon";
import { useApiAction, useToast } from "../../components/Toast";
import { appName } from "../../config";
import useDismiss from "../../hooks/useDismiss";
import { nowTime, todayIso } from "../../lib/date";
import type { PatientMessage } from "../../types";

const quickReplies = [
  ["ระดับ 2 — เล็กน้อย", "ความกังวลอยู่ที่ระดับ 2 ค่ะ"],
  ["ระดับ 3 — ปานกลาง", "ความกังวลอยู่ที่ระดับ 3 ค่ะ"],
];

/** The patient's check-in chat with the bot. Owns its message list after the first load. */
export default function CheckinChat({ initialMessages, clinicianName, dayLabel }: { initialMessages: PatientMessage[]; clinicianName: string; dayLabel: (date: string) => string }) {
  const notify = useToast();
  const run = useApiAction();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  useDismiss(menuRef, menuOpen, () => setMenuOpen(false));
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length, typing]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || typing) return;
    // Show the patient's message straight away; the bot's reply arrives from the API.
    setMessages((current) => [...current, { from: "user", text: message, date: todayIso(), time: nowTime() }]);
    setDraft("");
    setTyping(true);
    await run(() => api.me.sendMessage(message), (reply) => setMessages((current) => [...current, reply]));
    setTyping(false);
  };
  const clearChat = () => {
    setMenuOpen(false);
    void run(() => api.me.clearChat(), (fresh) => { setMessages(fresh); notify("ล้างประวัติแชทแล้ว"); });
  };
  const sendSummary = () => {
    setMenuOpen(false);
    void run(() => api.me.sendSummary(), () => notify(`ส่งสรุปบันทึกถึง ${clinicianName} แล้ว`));
  };

  return (
    <section className="chat-card">
      <div className="chat-head">
        <div><span className="bot-avatar"><Icon name="sparkle" size={19} /></span><div><strong>บันทึกอาการกับ {appName}</strong><p><i />ข้อมูลจะส่งถึง {clinicianName} เพื่อใช้เป็นข้อมูลประกอบการรักษาในอนาคต</p></div></div>
        <div className="menu-wrap" ref={menuRef}>
          <button className="ghost-button" aria-label="ตัวเลือกแชท" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="more" /></button>
          {menuOpen && (
            <div className="dropdown" role="menu">
              <button role="menuitem" onClick={sendSummary}><Icon name="send" size={16} />ส่งสรุปถึง {clinicianName}</button>
              <button role="menuitem" className="danger" onClick={clearChat}><Icon name="trash" size={16} />ล้างประวัติแชท</button>
            </div>
          )}
        </div>
      </div>
      <div className="privacy-note"><Icon name="info" size={16} />{appName} ช่วยบันทึกและสรุปอาการ แต่ไม่ใช่บริการฉุกเฉิน หากคุณรู้สึกไม่ปลอดภัย กรุณาโทรสายด่วนสุขภาพจิต 1323</div>
      <div className="messages" ref={listRef}>
        {messages.map((message, index) => (
          <div key={index}>
            {message.date !== messages[index - 1]?.date && <div className="day-divider"><span>{dayLabel(message.date)}</span></div>}
            <div className={`message ${message.from}`}>
              {message.from === "bot" && <span className="mini-bot"><Icon name="sparkle" size={15} /></span>}
              <div>{message.text}<small>{message.from === "user" ? "อ่านแล้ว · " : ""}{message.time}</small></div>
            </div>
          </div>
        ))}
        {typing && <div className="message bot"><span className="mini-bot"><Icon name="sparkle" size={15} /></span><div className="typing"><i><span /><span /><span /></i>กำลังพิมพ์…</div></div>}
      </div>
      <div className="quick-replies">
        {quickReplies.map(([label, text]) => <button onClick={() => { setDraft(text); draftRef.current?.focus(); }} key={label}>{label}</button>)}
      </div>
      <div className="composer">
        <textarea ref={draftRef} value={draft} aria-label="ข้อความ" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(draft); } }} placeholder="พิมพ์สิ่งที่อยากบันทึก..." />
        <button onClick={() => send(draft)} disabled={typing} aria-label="ส่งข้อความ"><Icon name="send" size={19} /></button>
      </div>
    </section>
  );
}
