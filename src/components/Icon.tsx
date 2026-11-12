export type IconName =
  | "activity"
  | "arrow"
  | "brain"
  | "calendar"
  | "chat"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "download"
  | "edit"
  | "file"
  | "graph"
  | "home"
  | "info"
  | "logout"
  | "more"
  | "people"
  | "phone"
  | "pin"
  | "plus"
  | "refresh"
  | "search"
  | "send"
  | "settings"
  | "sidebarClose"
  | "sidebarOpen"
  | "sparkle"
  | "trash"
  | "upload"
  | "user"
  | "video";

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    activity: <><path d="M3 12h4l2.5-6 4.5 12 2.5-6H21" /></>,
    arrow: <><path d="m5 12 14 0" /><path d="m14 7 5 5-5 5" /></>,
    brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6.2 3.2 3.2 0 0 0 3 12a3.2 3.2 0 0 0 2 5.8A3 3 0 0 0 10.5 19V5.5a2 2 0 0 0-1-1Z" /><path d="M14.5 4.5A3 3 0 0 1 20 6.2a3.2 3.2 0 0 1 1 5.8 3.2 3.2 0 0 1-2 5.8A3 3 0 0 1 13.5 19V5.5a2 2 0 0 1 1-1Z" /><path d="M6 9h2M16 9h2M6 15h2M16 15h2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    chat: <><path d="M21 14a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    download: <><path d="M12 3v13M7 11l5 5 5-5" /><path d="M5 21h14" /></>,
    edit: <><path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2 3 21l4.8-.8Z" /><path d="m15 5 4 4" /></>,
    file: <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
    graph: <><circle cx="5" cy="12" r="2" /><circle cx="17" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="m7 11 8-4M7 13l9 4M17 8l1 8" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    logout: <><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></>,
    pin: <><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    sidebarClose: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M16 10l-2 2 2 2" /></>,
    sidebarOpen: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M14 10l2 2-2 2" /></>,
    sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8Z" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="m6 7 1 13h10l1-13M9 7V4h6v3" /></>,
    upload: <><path d="M12 16V3M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
