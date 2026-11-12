import { useRef, useState } from "react";
import { api } from "../../api";
import Icon from "../../components/Icon";
import { useApiAction, useToast } from "../../components/Toast";
import { features } from "../../config";
import useResource from "../../hooks/useResource";
import type { Appointment, KgChatMessage, KgEdge, KgGraph, KgNode, Patient, TranscriptUpload } from "../../types";
import GraphTab from "./GraphTab";
import KgChat from "./KgChat";
import type { GraphView } from "./KnowledgeGraph";
import NodeEditModal from "./NodeEditModal";
import NotesTab from "./NotesTab";
import OverviewTab from "./OverviewTab";
import SessionsTab from "./SessionsTab";
import TranscriptModal, { type TranscriptTarget } from "./TranscriptModal";

const tabs = ["ภาพรวม", "Sessions", "Knowledge Graph", "บันทึก"] as const;
type Tab = (typeof tabs)[number];

/** One patient's case: header, KG chat, and the four tabs. Remounted (key = patient id) when switching patients. */
export default function PatientWorkspace({ patient, appointment, chat, onChatChange, onSchedule, onShowList, onGraphChange }: {
  patient: Patient; appointment?: Appointment; chat: KgChatMessage[]; onShowList?: () => void;
  onChatChange: (update: (messages: KgChatMessage[]) => KgChatMessage[]) => void; onSchedule: (appointment?: Appointment) => void;
  /** The Knowledge Graph after a correction was saved. */
  onGraphChange: (graph: KgGraph) => void;
}) {
  const notify = useToast();
  const run = useApiAction();
  const notes = useResource(() => api.notes.list(patient.id), [patient.id]);
  const uploads = useResource(() => api.transcripts.list(patient.id), [patient.id]);
  const [tab, setTab] = useState<Tab>("Knowledge Graph");
  // Graph state lives here so the chat and the Sessions tab can point the graph at a node or session.
  const [selected, setSelected] = useState(() => patient.nodes.find((node) => node.type === "อารมณ์")?.id ?? patient.nodes[0]?.id ?? "");
  const [session, setSession] = useState("ทั้งหมด");
  const [view, setView] = useState<GraphView>("แผนผัง");
  const [transcript, setTranscript] = useState<TranscriptTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = patient.nodes.find((node) => node.id === editingId);
  const uploadRef = useRef<HTMLInputElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const chooseFile = () => uploadRef.current?.click();
  const showInGraph = (nodeId: string) => {
    setTab("Knowledge Graph"); setView("แผนผัง"); setSession("ทั้งหมด"); setSelected(nodeId);
    window.requestAnimationFrame(() => graphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const showSessionInGraph = (number: number) => { setSession(`Session ${number}`); setView("แผนผัง"); setTab("Knowledge Graph"); };
  const openTranscript = (number: number, highlight?: string) => setTranscript({ session: number, highlight });
  const upload = (file: File) =>
    run(() => api.transcripts.upload(patient.id, file), (saved: TranscriptUpload) => {
      uploads.mutate((list) => [saved, ...list]);
      notify(`อัปโหลด ${file.name} แล้ว · รอประมวลผลเพื่ออัปเดต Knowledge Graph`);
    });
  const saveNode = (node: KgNode, edges: KgEdge[]) =>
    run(() => api.kg.saveNode(patient.id, node, edges), (graph) => {
      onGraphChange(graph);
      setEditingId(null);
      // The node may have moved to a later session than the one on screen; show every session so it stays visible.
      if (node.since > (session === "ทั้งหมด" ? Infinity : Number(session.replace("Session ", "")))) setSession("ทั้งหมด");
      notify("บันทึกการแก้ไข Knowledge Graph แล้ว");
    });
  const removeNode = (node: KgNode) =>
    run(() => api.kg.removeNode(patient.id, node.id), (graph) => {
      onGraphChange(graph);
      setEditingId(null);
      setSelected(graph.nodes[0]?.id ?? "");
      notify(`ลบประเด็น ${node.label} ออกจาก Knowledge Graph แล้ว`);
    });

  const uploadCount = uploads.data?.length ?? 0;
  const noteCount = notes.data?.length ?? 0;

  return (
    <>
      <div className="patient-header">
        <div className="patient-identity">
          {onShowList && <button className="square-button" aria-label="แสดงรายชื่อผู้รับคำปรึกษา" title="แสดงรายชื่อผู้รับคำปรึกษา" onClick={onShowList}><Icon name="sidebarOpen" size={18} /></button>}
          <span className={`avatar avatar-${patient.color} large`}>{patient.initials}</span>
          <div><div className="title-line"><h1>{patient.name}</h1><span className={`watch-badge ${patient.status === "ควรติดตาม" ? "" : patient.status === "ปกติ" ? "badge-ok" : "badge-new"}`}>{patient.status}</span></div><p>อายุ {patient.age} ปี · {patient.occupation} · {patient.hn}</p></div>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={chooseFile}><Icon name="upload" />อัปโหลด Transcript</button>
          <input ref={uploadRef} type="file" accept=".txt,.pdf,.doc,.docx" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
          {features.appointments && <button className="primary-button" onClick={() => onSchedule()}><Icon name="calendar" />นัดหมายครั้งถัดไป</button>}
        </div>
      </div>
      <nav className="tabs">
        {tabs.map((item) => (
          <button className={tab === item ? "active" : ""} aria-current={tab === item ? "page" : undefined} onClick={() => setTab(item)} key={item}>
            {item}{item === "Sessions" && <> <span>{patient.sessions.length + uploadCount}</span></>}{item === "บันทึก" && noteCount > 0 && <> <span>{noteCount}</span></>}
          </button>
        ))}
      </nav>
      <div className="content">
        <KgChat patient={patient} messages={chat} onChange={onChatChange} onCite={showInGraph} onOpenTranscript={openTranscript} />
        {tab === "ภาพรวม" && <OverviewTab patient={patient} appointment={appointment} onSchedule={onSchedule} onOpenTranscript={(number) => setTranscript({ session: number })} />}
        {tab === "Sessions" && <SessionsTab patient={patient} uploads={uploads} onUpload={chooseFile} onOpenTranscript={(number) => setTranscript({ session: number })} onOpenUpload={(item) => setTranscript({ upload: item })} onShowInGraph={showSessionInGraph} />}
        {tab === "Knowledge Graph" && (
          <GraphTab ref={graphRef} patient={patient} selected={selected} onSelect={setSelected} session={session} onSession={setSession} view={view} onView={setView} onOpenTranscript={openTranscript} onUpload={chooseFile} onEdit={setEditingId} />
        )}
        {tab === "บันทึก" && <NotesTab patientId={patient.id} notes={notes} />}
      </div>
      {transcript && <TranscriptModal patient={patient} target={transcript} onClose={() => setTranscript(null)} />}
      {editing && <NodeEditModal patient={patient} node={editing} onSave={saveNode} onRemove={() => removeNode(editing)} onClose={() => setEditingId(null)} />}
    </>
  );
}
