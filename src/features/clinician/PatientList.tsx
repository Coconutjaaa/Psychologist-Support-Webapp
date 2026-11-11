import { useState } from "react";
import Icon from "../../components/Icon";
import type { Patient } from "../../types";

/** The hideable list of patients next to the nav rail, with search and a "needs follow-up" filter. */
export default function PatientList({ patients, activeId, onSelect, onAdd, onHide }: { patients: Patient[]; activeId: string; onSelect: (id: string) => void; onAdd: () => void; onHide: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "watch">("all");
  const shown = patients.filter((patient) => patient.name.includes(query.trim()) && (filter === "all" || patient.status === "ควรติดตาม"));
  return (
    <aside className="patient-list">
      <div className="list-title">
        <div><span>ผู้รับคำปรึกษา</span><small>{patients.length} คน</small></div>
        <div className="list-actions">
          <button className="square-button" aria-label="เพิ่มผู้รับคำปรึกษา" title="เพิ่มผู้รับคำปรึกษา" onClick={onAdd}><Icon name="plus" size={18} /></button>
          <button className="square-button list-hide" aria-label="ซ่อนรายชื่อ" title="ซ่อนรายชื่อ" onClick={onHide}><Icon name="sidebarClose" size={18} /></button>
        </div>
      </div>
      <label className="search-small">
        <Icon name="search" size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ..." aria-label="ค้นหาชื่อผู้รับคำปรึกษา" />
      </label>
      <div className="filter-row">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>ทั้งหมด</button>
        <button className={filter === "watch" ? "active" : ""} onClick={() => setFilter("watch")}>ต้องติดตาม</button>
      </div>
      <div className="patients">
        {shown.map((patient) => (
          <button className={`patient-row ${patient.id === activeId ? "active" : ""}`} aria-current={patient.id === activeId ? "true" : undefined} onClick={() => onSelect(patient.id)} key={patient.id}>
            <span className={`avatar avatar-${patient.color}`}>{patient.initials}</span>
            <span className="patient-copy"><strong>{patient.name}</strong><small>อายุ {patient.age} ปี · <i className={patient.status === "ควรติดตาม" ? "warn-dot" : ""} />{patient.status}</small></span>
            <Icon name="chevron" size={15} />
          </button>
        ))}
        {!shown.length && <p className="empty-note">ไม่พบผู้รับคำปรึกษา</p>}
      </div>
    </aside>
  );
}
