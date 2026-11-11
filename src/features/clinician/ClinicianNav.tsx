import Icon, { type IconName } from "../../components/Icon";
import { features } from "../../config";

export type Page = "overview" | "patients" | "schedule";

const nav: { page: Page; label: string; icon: IconName }[] = [
  { page: "overview", label: "ภาพรวม", icon: "home" },
  { page: "patients", label: "ผู้รับคำปรึกษา", icon: "people" },
  ...(features.appointments ? [{ page: "schedule" as const, label: "ตารางนัดหมาย", icon: "calendar" as const }] : []),
];

/** The slim icon rail on the left. Clicking "ผู้รับคำปรึกษา" again while on that page hides/shows the patient list. */
export default function ClinicianNav({ page, patientCount, listHidden, onPage, onToggleList, onHelp }: {
  page: Page; patientCount: number; listHidden: boolean; onPage: (page: Page) => void; onToggleList: () => void; onHelp: () => void;
}) {
  return (
    <aside className="sidebar">
      <nav className="primary-nav" aria-label="เมนูหลัก">
        {nav.map((item) => {
          const togglesList = item.page === "patients" && page === "patients";
          return (
            <button className={page === item.page ? "active" : ""} aria-current={page === item.page ? "page" : undefined} key={item.page}
              title={togglesList ? (listHidden ? "แสดงรายชื่อผู้รับคำปรึกษา" : "ซ่อนรายชื่อผู้รับคำปรึกษา") : item.label}
              onClick={() => (togglesList ? onToggleList() : onPage(item.page))}>
              <span className="rail-icon"><Icon name={item.icon} />{item.page === "patients" && <span className="nav-count">{patientCount}</span>}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <button className="rail-help" title="ติดต่อทีมงาน" onClick={onHelp}>
        <span className="rail-icon"><Icon name="chat" /></span><span className="nav-label">ช่วยเหลือ</span>
      </button>
    </aside>
  );
}
