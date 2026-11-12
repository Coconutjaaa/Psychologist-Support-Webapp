import type { ComponentProps, Ref } from "react";
import Icon from "../../components/Icon";
import { thaiDate } from "../../lib/date";
import KnowledgeGraph from "./KnowledgeGraph";

type Props = ComponentProps<typeof KnowledgeGraph> & { ref?: Ref<HTMLDivElement> };

/** "Knowledge Graph" tab: four case-summary cards above the graph. `ref` points at the graph, for scrolling to it. */
export default function GraphTab({ ref, ...graphProps }: Props) {
  const { patient } = graphProps;
  const last = patient.sessions[patient.sessions.length - 1];
  return (
    <>
      {patient.summary && last && (
        <div className="summary-grid">
          <article className="summary-card">
            <span className="summary-icon summary-rose"><Icon name="activity" /></span>
            <div><small>อาการหลัก</small><strong>{patient.summary.symptom}</strong><p>ติดตามมา {patient.sessions.length} Session</p></div>
          </article>
          <article className="summary-card">
            <span className="summary-icon summary-amber"><Icon name="brain" /></span>
            <div><small>แก่นความเชื่อ</small><strong>{patient.summary.belief}</strong><p>{patient.summary.beliefNote}</p></div>
          </article>
          <article className="summary-card">
            <span className="summary-icon summary-green"><Icon name="people" /></span>
            <div><small>ปัจจัยปกป้อง</small><strong>{patient.summary.protective}</strong><p>{patient.summary.protectiveNote}</p></div>
          </article>
          <article className="summary-card">
            <span className="summary-icon summary-blue"><Icon name="calendar" /></span>
            <div><small>อัปเดตล่าสุด</small><strong>Session {last.number} · {thaiDate(last.date)}</strong><p>อัปเดตผ่าน Transcript</p></div>
          </article>
        </div>
      )}
      <div ref={ref} className={`graph-anchor ${patient.summary ? "" : "tab-body"}`}>
        <KnowledgeGraph {...graphProps} />
      </div>
    </>
  );
}
