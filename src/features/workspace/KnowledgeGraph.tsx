import { useLayoutEffect, useRef, useState } from "react";
import Icon from "../../components/Icon";
import useDismiss from "../../hooks/useDismiss";
import { thaiDate } from "../../lib/date";
import { downloadFile } from "../../lib/download";
import { toneOf } from "../../lib/labels";
import type { KgNode, Patient } from "../../types";
import { columns, gridLayout, MIN_WIDTH, NODE_H, roundedPath, route, STAGE_H, type Box } from "./graphLayout";

export type GraphView = "แผนผัง" | "ลำดับเวลา";

/** The Knowledge Graph card: a node diagram with an evidence panel, or a session timeline. */
export default function KnowledgeGraph({ patient, selected, onSelect, session, onSession, view, onView, onOpenTranscript, onUpload }: {
  patient: Patient; selected: string; onSelect: (id: string) => void; session: string; onSession: (session: string) => void;
  view: GraphView; onView: (view: GraphView) => void; onOpenTranscript: (session: number, nodeId?: string) => void; onUpload: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(680);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  useDismiss(menuRef, menuOpen, () => setMenuOpen(false));
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => setCanvasWidth(canvas.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [view, patient.nodes.length]);
  const latest = patient.sessions.length;
  const byId = new Map(patient.nodes.map((node) => [node.id, node]));
  const head = (
    <div className="card-head">
      <div>
        <h2>แผนผังความเข้าใจ</h2>
        <p>เชื่อมโยงสิ่งที่เกิดขึ้น ความคิด อารมณ์ และพฤติกรรม</p>
      </div>
      {patient.nodes.length > 0 && (
        <div className="menu-wrap" ref={menuRef}>
          <button className="ghost-button" aria-label="ตัวเลือกแผนผัง" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="more" /></button>
          {menuOpen && (
            <div className="dropdown" role="menu">
              <button role="menuitem" onClick={() => {
                downloadFile(`knowledge-graph-${patient.hn}.json`, JSON.stringify({ patient: { name: patient.name, hn: patient.hn }, sessions: patient.sessions, nodes: patient.nodes, edges: patient.edges.map(([from, to, relation]) => ({ from, relation, to })) }, null, 2), "application/json");
                setMenuOpen(false);
              }}><Icon name="download" size={16} />ส่งออกข้อมูล KG (.json)</button>
              <button role="menuitem" onClick={() => { onSession("ทั้งหมด"); onView("แผนผัง"); setMenuOpen(false); }}><Icon name="refresh" size={16} />แสดงทุก Session</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
  if (!patient.nodes.length) {
    return (
      <section className="graph-card">
        {head}
        <div className="empty-state">
          <span><Icon name="graph" size={22} /></span>
          <strong>ยังไม่มี Knowledge Graph</strong>
          <p>อัปโหลด Transcript หลังการพูดคุย ระบบจะสร้างแผนผังความเข้าใจของ{patient.name}ให้อัตโนมัติ</p>
          <button className="secondary-button" onClick={onUpload}><Icon name="upload" size={17} />อัปโหลด Transcript</button>
        </div>
      </section>
    );
  }
  const detail = byId.get(selected) ?? patient.nodes[0];
  const sessionNumber = session === "ทั้งหมด" ? latest : Number(session.replace("Session ", ""));
  const visibleNodes = patient.nodes.filter((node) => node.since <= sessionNumber);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = patient.edges.filter(([from, to]) => visibleIds.has(from) && visibleIds.has(to));
  const relations = visibleEdges.filter(([from, to]) => from === detail.id || to === detail.id);
  const sessionNote = patient.sessions[sessionNumber - 1]?.insight;
  const stageWidth = Math.max(canvasWidth, MIN_WIDTH);
  const grid = gridLayout(stageWidth);
  const boxOf = (node: KgNode): Box => ({ x: grid.left(node.col), y: grid.top(node.row), w: grid.nodeW, node });
  const edges = visibleEdges.map(([from, to, relation]) => {
    const source = byId.get(from)!;
    return { key: `${from}-${to}`, relation, protective: source.type === "ปัจจัยปกป้อง", active: from === detail.id || to === detail.id, ...route(boxOf(source), boxOf(byId.get(to)!), grid.gap) };
  });
  const marker = (id: string, color: string) => (
    <marker id={id} viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill={color} /></marker>
  );
  return (
    <section className="graph-card">
      {head}
      <div className="graph-toolbar">
        <div className="segmented">
          {(["แผนผัง", "ลำดับเวลา"] as const).map((item) => <button className={view === item ? "active" : ""} onClick={() => onView(item)} key={item}>{item}</button>)}
        </div>
        <label className="session-select">
          <span>Session</span>
          <select value={session} onChange={(event) => onSession(event.target.value)}>
            <option>ทั้งหมด</option>
            {[...patient.sessions].reverse().map((item) => <option key={item.number}>Session {item.number}</option>)}
          </select>
        </label>
        <div className="legend"><span><i className="legend-client" />ผู้รับคำปรึกษา</span><span><i className="legend-ai" />AI สรุป</span></div>
      </div>
      <div className="session-insight"><Icon name="sparkle" size={14} /><span>{sessionNote}</span><strong>{visibleNodes.length} ประเด็น</strong></div>
      {view === "แผนผัง" ? (
        <div className="graph-body">
          <div className="graph-canvas" ref={canvasRef}>
            <div className="graph-stage" style={{ width: stageWidth, height: STAGE_H }}>
              <div className="column-labels">{columns.map((label, col) => <span style={{ left: grid.left(col) + grid.nodeW / 2 }} key={label}>{label}</span>)}</div>
              <svg className="connections" width={stageWidth} height={STAGE_H} aria-hidden="true">
                <defs>{marker("kg-arrow", "#5d6878")}{marker("kg-arrow-active", "#183253")}{marker("kg-arrow-help", "#3f9b7d")}</defs>
                {edges.map((edge) => (
                  <path key={edge.key} d={roundedPath(edge.points)} className={`edge ${edge.protective ? "protective" : ""} ${edge.active ? "active" : ""}`}
                    markerEnd={`url(#${edge.protective ? "kg-arrow-help" : edge.active ? "kg-arrow-active" : "kg-arrow"})`} />
                ))}
              </svg>
              {edges.map((edge) => (
                <span key={edge.key} className={`edge-label ${edge.protective ? "protective" : ""} ${edge.active ? "active" : ""}`} style={{ left: edge.label[0], top: edge.label[1] }}>{edge.relation}</span>
              ))}
              {visibleNodes.map((node) => {
                const box = boxOf(node);
                return (
                  <button key={node.id} onClick={() => onSelect(node.id)} aria-pressed={detail.id === node.id} title={node.label}
                    className={`graph-node tone-${toneOf[node.type]} ${detail.id === node.id ? "selected" : ""}`} style={{ left: box.x, top: box.y, width: box.w, height: NODE_H }}>
                    <small>{node.type}</small><strong>{node.label}</strong>
                    {node.since === latest && latest > 1 && <span className="new-badge">ใหม่</span>}
                  </button>
                );
              })}
            </div>
            <div className="graph-hint"><Icon name="info" size={15} />เลือกโหนดเพื่อดูหลักฐานและความสัมพันธ์</div>
          </div>
          <aside className="evidence-panel">
            <div className="evidence-top">
              <span className="evidence-icon"><Icon name={detail.type === "ปัจจัยปกป้อง" ? "people" : "activity"} size={18} /></span>
              <div><small>{detail.category}</small><h3>{detail.label}</h3></div>
            </div>
            {detail.score && <div className="trend-pill"><Icon name="arrow" size={15} />{detail.score}</div>}
            <div className="evidence-label"><span>หลักฐานจากบทสนทนา</span><small>Session {detail.session} · {detail.time}</small></div>
            <blockquote>{detail.quote}</blockquote>
            <button className="text-button" onClick={() => onOpenTranscript(detail.session, detail.id)}>เปิด Transcript <Icon name="arrow" size={15} /></button>
            {relations.length > 0 && (
              <>
                <div className="evidence-label relations-label"><span>ความสัมพันธ์ใน KG</span><small>{relations.length}</small></div>
                <div className="relation-list">
                  {relations.map(([from, to, relation]) => (
                    <button onClick={() => onSelect(from === detail.id ? to : from)} key={`${from}-${to}`}>
                      <span className={from === detail.id ? "current" : ""}>{byId.get(from)!.label}</span><em>—{relation}→</em><span className={to === detail.id ? "current" : ""}>{byId.get(to)!.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      ) : (
        <div className="timeline-view">
          {patient.sessions.map((item, index) => (
            <div className="timeline-row" key={item.number}>
              <span className="timeline-dot"><Icon name={index === latest - 1 ? "check" : "clock"} size={15} /></span>
              <div>
                <small>{thaiDate(item.date, { day: "numeric", month: "short" })} · Session {item.number}</small>
                <strong>{item.summary}</strong>
                <p>ความรุนแรง {item.severity}/5</p>
                <button className="text-button" onClick={() => onOpenTranscript(item.number)}>เปิด Transcript <Icon name="arrow" size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
