import { useRef, useState } from "react";
import { appName } from "../config";
import useDismiss from "../hooks/useDismiss";
import { initials, roleLabels } from "../lib/labels";
import type { Session } from "../types";
import Brand from "./Brand";
import Icon from "./Icon";
import SettingsModal from "./SettingsModal";

export default function Header({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  useDismiss(actionsRef, menuOpen, () => setMenuOpen(false));
  const avatarClass = session.role === "clinician" ? "avatar-doctor" : "avatar-coral";
  return (
    <header className="topbar">
      <div className="brand" aria-label={appName}>
        <Brand />
      </div>
      <div className="top-actions" ref={actionsRef}>
        <button className="icon-button" aria-label="การตั้งค่า" title="การตั้งค่า" onClick={() => setSettingsOpen(true)}><Icon name="settings" /></button>
        <button className="user-trigger" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`avatar ${avatarClass}`}>{initials(session.name)}</span>
          <span className="user-name"><strong>{session.name}</strong><small>{roleLabels[session.role]}</small></span>
          <Icon name="chevron" size={15} />
        </button>
        {menuOpen && (
          <div className="dropdown" role="menu">
            <div className="dropdown-head"><strong>{session.name}</strong><small>{session.email}</small><span className="role-chip">{roleLabels[session.role]}</span></div>
            <button role="menuitem" onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}><Icon name="settings" size={16} />การตั้งค่า</button>
            <button role="menuitem" className="danger" onClick={onLogout}><Icon name="logout" size={16} />ออกจากระบบ</button>
          </div>
        )}
      </div>
      {settingsOpen && <SettingsModal session={session} avatarClass={avatarClass} onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
