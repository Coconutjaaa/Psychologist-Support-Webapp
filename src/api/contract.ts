import type {
  Appointment,
  AppointmentInput,
  KgEdge,
  KgGraph,
  KgNode,
  MoodLog,
  NewPatientInput,
  Note,
  Patient,
  PatientCheckins,
  PatientHome,
  PatientMessage,
  Preferences,
  RagAnswer,
  Role,
  Session,
  SignUpInput,
  SessionSummary,
  TranscriptLine,
  TranscriptUpload,
} from "../types";

/**
 * The contract between the UI and the backend.
 *
 * Components only ever call `api` from src/api/index.ts — never localStorage or fetch directly — so swapping the
 * built-in mock for a real server does not touch any component. There are two implementations:
 *   - mock/   runs entirely in the browser (localStorage); used when VITE_API_URL is empty
 *   - http.ts calls a REST backend at VITE_API_URL
 *
 * Each method notes the REST endpoint that http.ts calls. Paths are relative to VITE_API_URL, bodies and responses
 * are JSON in the shapes from src/types.ts, and errors are `{ "message": string, "field"?: string }` with a 4xx/5xx status.
 * Calls made after sign-in send `Authorization: Bearer <session.token>`; "me" means the signed-in user.
 */
export interface Api {
  auth: {
    /** POST /auth/login `{ email, password }` → Session. Fails with field "email" (no such account) or "password". */
    login(email: string, password: string): Promise<Session>;
    /** POST /auth/signup `{ role, name, email, password }` → Session. Fails with field "email" if the email is taken. */
    signUp(input: SignUpInput): Promise<Session>;
    /** Quick-fill buttons on the login page. Only the mock has them; undefined for a real backend. */
    demoAccounts?: DemoAccount[];
  };

  // Clinician ------------------------------------------------------------------------------------------------------

  patients: {
    /** GET /patients → Patient[] (the clinician's caseload, including each Knowledge Graph) */
    list(): Promise<Patient[]>;
    /** POST /patients `{ name, age, occupation }` → Patient. The server assigns id, hn, initials, color and status. */
    create(input: NewPatientInput): Promise<Patient>;
  };
  appointments: {
    /** GET /appointments → Appointment[] */
    list(): Promise<Appointment[]>;
    /** POST /appointments (no id) or PUT /appointments/:id → Appointment. Saving clears `rescheduleRequested`. */
    save(input: AppointmentInput): Promise<Appointment>;
    /** DELETE /appointments/:id */
    cancel(id: string): Promise<void>;
  };
  notes: {
    /** GET /patients/:id/notes → Note[] (newest first) */
    list(patientId: string): Promise<Note[]>;
    /** POST /patients/:id/notes `{ text }` → Note */
    create(patientId: string, text: string): Promise<Note>;
    /** DELETE /patients/:id/notes/:noteId */
    remove(patientId: string, noteId: string): Promise<void>;
  };
  transcripts: {
    /** GET /patients/:id/transcripts → TranscriptUpload[] (newest first) */
    list(patientId: string): Promise<TranscriptUpload[]>;
    /** POST /patients/:id/transcripts, multipart form with a `file` field → TranscriptUpload */
    upload(patientId: string, file: File): Promise<TranscriptUpload>;
    /** GET /patients/:id/sessions/:number/transcript → TranscriptLine[], the whole session in order (404 if no such session) */
    session(patientId: string, sessionNumber: number): Promise<TranscriptLine[]>;
    /** GET /patients/:id/session-summaries → SessionSummary[], one per processed session (a session may have none yet) */
    summaries(patientId: string): Promise<SessionSummary[]>;
  };
  kg: {
    /** POST /patients/:id/kg/ask `{ question }` → RagAnswer, answered only from that patient's Knowledge Graph */
    ask(patientId: string, question: string): Promise<RagAnswer>;
    /**
     * PUT /patients/:id/kg/nodes/:nodeId `{ node, edges }` → KgGraph (the whole graph after the change).
     * A clinician's correction: replaces the node, and every edge that touches it with `edges` (each has this node at
     * one end); other nodes and edges are kept. The server sets `editedAt`, and should keep corrected nodes when it
     * later rebuilds the graph from a new transcript. Fails with field "label" (empty), "position" (col/row taken by
     * another node) or "edges" (an edge to a missing node, to itself, or twice to the same node).
     */
    saveNode(patientId: string, node: KgNode, edges: KgEdge[]): Promise<KgGraph>;
    /** DELETE /patients/:id/kg/nodes/:nodeId → KgGraph, without the node and its edges */
    removeNode(patientId: string, nodeId: string): Promise<KgGraph>;
  };
  checkins: {
    /** GET /patients/:id/checkins → PatientCheckins (mood log and check-in chat from the patient's app) */
    forPatient(patientId: string): Promise<PatientCheckins>;
    /** GET /checkins/moods → `{ [patientId]: MoodLog }` for every patient with an app account */
    moodsByPatient(): Promise<Record<string, MoodLog>>;
  };
  support: {
    /** POST /support `{ message }` */
    send(message: string): Promise<void>;
  };

  // Patient app (the signed-in patient) ----------------------------------------------------------------------------

  me: {
    /** GET /me/home → PatientHome */
    home(): Promise<PatientHome>;
    /** POST /me/messages `{ text }` → the bot's reply. The server stores both messages. */
    sendMessage(text: string): Promise<PatientMessage>;
    /** DELETE /me/messages → the fresh conversation (a greeting) */
    clearChat(): Promise<PatientMessage[]>;
    /** PUT /me/moods/:date `{ score }` */
    saveMood(date: string, score: number): Promise<void>;
    /** POST /me/appointments/:id/reschedule-request → Appointment */
    requestReschedule(appointmentId: string): Promise<Appointment>;
    /** POST /me/summary — send a summary of recent check-ins to the clinician */
    sendSummary(): Promise<void>;
  };

  // Both roles -----------------------------------------------------------------------------------------------------

  settings: {
    /** GET /me/preferences → Preferences */
    get(): Promise<Preferences>;
    /** PUT /me/preferences → Preferences */
    save(preferences: Preferences): Promise<void>;
  };

  /** Mock only: wipes the demo data saved in this browser. Undefined for a real backend, which hides the reset button. */
  resetDemoData?: () => void;
}

export type DemoAccount = { role: Role; name: string; email: string; password: string };

/** Thrown by every API call that fails. `field` points a form error at the input it belongs to. */
export class ApiError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status = 0, field?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
  }
}

export const errorMessage = (error: unknown) => (error instanceof Error && error.message ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
