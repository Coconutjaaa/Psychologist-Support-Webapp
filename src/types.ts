// Domain types shared by the UI and the API layer.
// A backend should send and accept exactly these shapes (the endpoints are listed in src/api/contract.ts).

export type Role = "clinician" | "patient";

/** The signed-in user. A real backend also returns `token`, which the HTTP client sends back as `Authorization: Bearer <token>`. */
export type Session = { role: Role; email: string; name: string; token?: string };

export type SignUpInput = { role: Role; name: string; email: string; password: string };

// ---------------------------------------------------------------------------
// Patients & Knowledge Graph
// ---------------------------------------------------------------------------

export type NodeType = "เหตุการณ์" | "ความคิด" | "อารมณ์" | "พฤติกรรม" | "อาการ" | "ปัจจัยปกป้อง";

/** One node of a patient's Knowledge Graph, extracted from a session transcript. */
export type KgNode = {
  id: string;
  /** Grid column: 0 สิ่งที่เกิดขึ้น · 1 ภายในใจ · 2 การตอบสนอง · 3 ผลที่ตามมา */
  col: number;
  /** Grid row: 0–2 from the top. */
  row: number;
  label: string;
  type: NodeType;
  /** Session number in which the node first appeared. */
  since: number;
  category: string;
  /** Transcript quote that supports the node. */
  quote: string;
  /** Session number and timestamp (mm:ss) of the quote. */
  session: number;
  time: string;
  /** Latest trend, e.g. "ความรุนแรง 2/5". */
  score?: string;
  /** Words used to match questions to this node in the KG chat. */
  keywords: string[];
};

/** A directed edge: [from node id, to node id, relation label]. */
export type KgEdge = [from: string, to: string, relation: string];

export type SessionRecord = { number: number; date: string; duration: number; summary: string; insight: string; severity: number };

export type PatientStatus = "ควรติดตาม" | "ปกติ" | "นัดหมายใหม่";
export type PatientColor = "coral" | "mint" | "blue" | "purple";

export type CaseSummary = { symptom: string; belief: string; beliefNote: string; protective: string; protectiveNote: string };

export type Patient = {
  id: string;
  name: string;
  initials: string;
  age: number;
  occupation: string;
  /** Hospital number shown to the clinician. */
  hn: string;
  status: PatientStatus;
  color: PatientColor;
  /** Set when the patient has an app account; links their mood check-ins and chat to this case. */
  email?: string;
  /** Example question shown as the KG chat placeholder. */
  askExample?: string;
  summary?: CaseSummary;
  sessions: SessionRecord[];
  nodes: KgNode[];
  edges: KgEdge[];
};

export type NewPatientInput = { name: string; age: number; occupation: string };

/** A transcript file uploaded by the clinician and waiting to be processed into the Knowledge Graph. */
export type TranscriptUpload = { id: string; name: string; size: number; date: string; text?: string };

/**
 * One utterance of a session transcript; a session's transcript is all of them in order.
 * `time` is mm:ss from the start of the session. A KG node quotes the line whose `time` equals its own `time`.
 */
export type TranscriptLine = { time: string; speaker: "clinician" | "patient"; text: string };

/**
 * The key points of one session, written from its transcript when the backend processes it (e.g. by an LLM, to be
 * checked by the clinician). Shown in the case overview.
 */
export type SessionSummary = {
  /** Session number this summary belongs to. */
  session: number;
  /** A short paragraph: what the session was about and what changed. */
  gist: string;
  /** Main points raised, in the order they came up. */
  keyPoints: string[];
  /** What the clinician did in the session (techniques, psychoeducation). */
  interventions: string[];
  /** Homework and agreed next steps for the patient. */
  homework: string[];
  /** Focus for the next session. */
  nextFocus?: string;
};

/** A clinician-only note on a case. */
export type Note = { id: string; date: string; text: string };

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export type AppointmentMode = "ที่คลินิก" | "ออนไลน์";

export type Appointment = {
  id: string;
  patientId: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** 24-hour time, HH:MM. */
  time: string;
  mode: AppointmentMode;
  note: string;
  /** Set when the patient asked to reschedule from their app. */
  rescheduleRequested?: boolean;
};

/** An appointment to create (no id) or update (with id). */
export type AppointmentInput = Omit<Appointment, "id" | "rescheduleRequested"> & { id?: string };

// ---------------------------------------------------------------------------
// KG chat (clinician asks questions about a case)
// ---------------------------------------------------------------------------

export type RagAnswer = {
  text: string;
  bullets: string[];
  /** Transcript quotes that support the answer. */
  evidence: KgNode[];
  /** Ids of the KG nodes the answer cites. */
  sources: string[];
  meta: string;
};

export type KgChatMessage = { id: number; from: "user" | "ai"; text: string; answer?: RagAnswer };

// ---------------------------------------------------------------------------
// Patient app (check-in chat and mood log)
// ---------------------------------------------------------------------------

export type PatientMessage = { from: "bot" | "user"; text: string; date: string; time: string };

/** Mood check-ins: ISO date → score 1–5. */
export type MoodLog = Record<string, number>;

/** What the clinician sees from a patient's app. */
export type PatientCheckins = { moods: MoodLog; messages: PatientMessage[] };

/** The "สิ่งที่ทำได้ดี" card on the patient home screen. */
export type Highlights = { text: string; items: { icon: "activity" | "clock"; label: string; value: string }[] };

/** Everything the patient home screen needs in one request. */
export type PatientHome = {
  clinicianName: string;
  messages: PatientMessage[];
  moods: MoodLog;
  nextAppointment?: Appointment;
  /** Omitted until there is something to celebrate; the app then shows a generic encouragement. */
  highlights?: Highlights;
};

/** Notification switches in Settings, keyed by preference id. Missing keys count as on. */
export type Preferences = Record<string, boolean>;
