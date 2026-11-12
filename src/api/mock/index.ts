// Browser-only implementation of the Api contract, used when VITE_API_URL is empty.
// It plays the backend's part with localStorage so the demo works without a server. Keep its behaviour in line with
// the contract in ../contract.ts: anything the UI relies on here, a real backend must do too.
import { clinician, patients as demoPeople } from "../../config";
import { byDateTime, nowTime, todayIso } from "../../lib/date";
import { initials } from "../../lib/labels";
import type { Appointment, KgGraph, MoodLog, Note, Patient, PatientColor, PatientMessage, Preferences, Session, TranscriptUpload } from "../../types";
import { ApiError, type Api, type DemoAccount } from "../contract";
import { currentSession } from "../session";
import { askKg } from "./rag";
import { DEMO_HISTORY_PATIENT_ID, demoHighlights, seedAppointments, seedChat, seedMoods, seedNotes, seedPatients } from "./seed";
import { clearDemoData, DEMO_PREFIX, read, readOrSeed, write } from "./storage";
import { seedSessionSummaries } from "./summaries";
import { seedTranscripts } from "./transcripts";

// Pretend latency for the "AI" calls, so typing indicators show as they would with a real backend.
const BOT_REPLY_MS = 900;
const KG_ANSWER_MS = 650;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const keys = {
  // Sign-ups are kept outside DEMO_PREFIX so "reset demo data" does not delete accounts.
  accounts: "mindflow-accounts",
  addedPatients: `${DEMO_PREFIX}patients-added`,
  appointments: `${DEMO_PREFIX}appointments`,
  graphs: `${DEMO_PREFIX}kg`,
  notes: `${DEMO_PREFIX}notes`,
  uploads: `${DEMO_PREFIX}uploads`,
  chat: (email: string) => `${DEMO_PREFIX}chat:${email}`,
  moods: (email: string) => `${DEMO_PREFIX}moods:${email}`,
  preferences: (email: string) => `${DEMO_PREFIX}prefs:${email}`,
};

// Accounts missing from .env are left out instead of allowing an empty login.
const demoAccounts: DemoAccount[] = [
  { role: "clinician" as const, ...clinician },
  ...Object.values(demoPeople).map((person) => ({ role: "patient" as const, ...person })),
].filter((account) => account.email && account.password);

const colors: PatientColor[] = ["coral", "mint", "blue", "purple"];

function botReply(text: string) {
  const level = text.match(/ระดับ\s*([1-5])/)?.[1];
  if (level) return `บันทึกความกังวลระดับ ${level}/5 แล้วค่ะ ข้อมูลนี้จะถูกสรุปให้ ${clinician.name} ก่อนการนัดหมายครั้งถัดไป อยากเล่าเพิ่มไหมคะว่าอะไรช่วยให้รับมือได้ดีขึ้น?`;
  return "รับทราบค่ะ ข้อมูลนี้จะถูกสรุปให้นักจิตวิทยาของคุณก่อนการนัดหมายครั้งถัดไป หากอยากเล่าต่อ ฉันพร้อมรับฟังเสมอค่ะ";
}

// --- Data access ---------------------------------------------------------------------------------------------------

const toSession = ({ role, email, name }: DemoAccount): Session => ({ role, email, name });

function findAccount(email: string) {
  const address = email.trim().toLowerCase();
  return [...demoAccounts, ...read<DemoAccount[]>(keys.accounts, [])].find((account) => account.email.toLowerCase() === address);
}

function signedInUser() {
  const session = currentSession();
  if (!session) throw new ApiError("กรุณาเข้าสู่ระบบใหม่อีกครั้ง", 401);
  return session;
}

// A Knowledge Graph the clinician has corrected is stored whole and replaces the seeded (or added) one.
const readGraphs = () => read<Record<string, KgGraph>>(keys.graphs, {});
const saveGraph = (patientId: string, graph: KgGraph) => write(keys.graphs, { ...readGraphs(), [patientId]: graph });

const allPatients = () => {
  const graphs = readGraphs();
  return [...seedPatients, ...read<Patient[]>(keys.addedPatients, [])].map((patient) => (graphs[patient.id] ? { ...patient, ...graphs[patient.id] } : patient));
};

function findPatient(id: string) {
  const patient = allPatients().find((item) => item.id === id);
  if (!patient) throw new ApiError("ไม่พบผู้รับคำปรึกษา", 404);
  return patient;
}

const readAppointments = () => readOrSeed(keys.appointments, () => seedAppointments(new Date()));
const readNotes = () => readOrSeed(keys.notes, seedNotes);
const readUploads = () => read<Record<string, TranscriptUpload[]>>(keys.uploads, {});
const readChat = (email: string) => read<PatientMessage[]>(keys.chat(email), []);
const readMoods = (email: string) => read<MoodLog>(keys.moods(email), {});

function newMessage(from: PatientMessage["from"], text: string): PatientMessage {
  return { from, text, date: todayIso(), time: nowTime() };
}

// --- The Api -------------------------------------------------------------------------------------------------------

export function createMockApi(): Api {
  return {
    auth: {
      demoAccounts,
      async login(email, password) {
        const account = findAccount(email);
        if (!account) throw new ApiError("ไม่พบบัญชีนี้ในระบบ", 404, "email");
        if (account.password !== password) throw new ApiError("รหัสผ่านไม่ถูกต้อง", 401, "password");
        return toSession(account);
      },
      async signUp(input) {
        if (findAccount(input.email)) throw new ApiError("อีเมลนี้มีบัญชีอยู่แล้ว", 409, "email");
        const account: DemoAccount = { ...input, email: input.email.trim() };
        write(keys.accounts, [...read<DemoAccount[]>(keys.accounts, []), account]);
        return toSession(account);
      },
    },

    patients: {
      async list() {
        return allPatients();
      },
      async create(input) {
        const added = read<Patient[]>(keys.addedPatients, []);
        const patient: Patient = {
          id: `p-${Date.now()}`,
          ...input,
          initials: initials(input.name),
          hn: `HN-${240060 + added.length}`,
          status: "นัดหมายใหม่",
          color: colors[(seedPatients.length + added.length) % colors.length],
          sessions: [],
          nodes: [],
          edges: [],
        };
        write(keys.addedPatients, [...added, patient]);
        return patient;
      },
    },

    appointments: {
      async list() {
        return readAppointments();
      },
      async save(input) {
        const saved: Appointment = { id: input.id ?? `ap-${Date.now()}`, patientId: input.patientId, date: input.date, time: input.time, mode: input.mode, note: input.note };
        const list = readAppointments();
        write(keys.appointments, list.some((item) => item.id === saved.id) ? list.map((item) => (item.id === saved.id ? saved : item)) : [...list, saved]);
        return saved;
      },
      async cancel(id) {
        write(keys.appointments, readAppointments().filter((item) => item.id !== id));
      },
    },

    notes: {
      async list(patientId) {
        return readNotes()[patientId] ?? [];
      },
      async create(patientId, text) {
        const note: Note = { id: `n-${Date.now()}`, date: todayIso(), text };
        const all = readNotes();
        write(keys.notes, { ...all, [patientId]: [note, ...(all[patientId] ?? [])] });
        return note;
      },
      async remove(patientId, noteId) {
        const all = readNotes();
        write(keys.notes, { ...all, [patientId]: (all[patientId] ?? []).filter((note) => note.id !== noteId) });
      },
    },

    transcripts: {
      async list(patientId) {
        return readUploads()[patientId] ?? [];
      },
      async upload(patientId, file) {
        findPatient(patientId);
        // Only small .txt files can be previewed; anything else is just recorded as waiting for processing.
        const text = file.name.toLowerCase().endsWith(".txt") && file.size < 200_000 ? await file.text().catch(() => undefined) : undefined;
        const upload: TranscriptUpload = { id: `up-${Date.now()}`, name: file.name, size: file.size, date: todayIso(), text };
        const all = readUploads();
        write(keys.uploads, { ...all, [patientId]: [upload, ...(all[patientId] ?? [])] });
        return upload;
      },
      async session(patientId, sessionNumber) {
        if (!findPatient(patientId).sessions.some((item) => item.number === sessionNumber)) throw new ApiError("ไม่พบ Session นี้", 404);
        return seedTranscripts[patientId]?.[sessionNumber] ?? [];
      },
      async summaries(patientId) {
        findPatient(patientId);
        return seedSessionSummaries[patientId] ?? [];
      },
    },

    kg: {
      async ask(patientId, question) {
        await wait(KG_ANSWER_MS);
        return askKg(findPatient(patientId), question);
      },
      async saveNode(patientId, node, edges) {
        const { nodes, edges: current } = findPatient(patientId);
        if (!nodes.some((item) => item.id === node.id)) throw new ApiError("ไม่พบประเด็นนี้ใน Knowledge Graph", 404);
        if (!node.label.trim()) throw new ApiError("กรุณากรอกชื่อประเด็น", 400, "label");
        if (nodes.some((item) => item.id !== node.id && item.col === node.col && item.row === node.row)) throw new ApiError("ตำแหน่งนี้มีประเด็นอื่นอยู่แล้ว", 409, "position");
        const ids = new Set(nodes.map((item) => item.id));
        const pairs = new Set(edges.map(([from, to]) => `${from}>${to}`));
        if (pairs.size < edges.length || edges.some(([from, to]) => from === to || (from !== node.id && to !== node.id) || !ids.has(from) || !ids.has(to))) {
          throw new ApiError("เส้นเชื่อมไม่ถูกต้อง", 400, "edges");
        }
        const graph: KgGraph = {
          nodes: nodes.map((item) => (item.id === node.id ? { ...node, editedAt: todayIso() } : item)),
          edges: [...current.filter(([from, to]) => from !== node.id && to !== node.id), ...edges],
        };
        saveGraph(patientId, graph);
        return graph;
      },
      async removeNode(patientId, nodeId) {
        const { nodes, edges } = findPatient(patientId);
        const graph: KgGraph = { nodes: nodes.filter((item) => item.id !== nodeId), edges: edges.filter(([from, to]) => from !== nodeId && to !== nodeId) };
        saveGraph(patientId, graph);
        return graph;
      },
    },

    checkins: {
      async forPatient(patientId) {
        const { email } = findPatient(patientId);
        return email ? { moods: readMoods(email), messages: readChat(email) } : { moods: {}, messages: [] };
      },
      async moodsByPatient() {
        return Object.fromEntries(allPatients().flatMap((patient): [string, MoodLog][] => (patient.email ? [[patient.id, readMoods(patient.email)]] : [])));
      },
    },

    support: {
      async send() {
        // A real backend would forward the message to the support team.
      },
    },

    me: {
      async home() {
        const user = signedInUser();
        const record = allPatients().find((patient) => patient.email?.toLowerCase() === user.email.toLowerCase());
        const demo = record?.id === DEMO_HISTORY_PATIENT_ID;
        const today = todayIso();
        return {
          clinicianName: clinician.name,
          messages: readOrSeed(keys.chat(user.email), () => seedChat(user.name, demo)),
          moods: readOrSeed(keys.moods(user.email), () => (demo ? seedMoods(new Date()) : {})),
          nextAppointment: record ? readAppointments().filter((item) => item.patientId === record.id && item.date >= today).sort(byDateTime)[0] : undefined,
          highlights: demo ? demoHighlights : undefined,
        };
      },
      async sendMessage(text) {
        const { email } = signedInUser();
        write(keys.chat(email), [...readChat(email), newMessage("user", text)]);
        await wait(BOT_REPLY_MS);
        const reply = newMessage("bot", botReply(text));
        write(keys.chat(email), [...readChat(email), reply]);
        return reply;
      },
      async clearChat() {
        const user = signedInUser();
        const fresh = seedChat(user.name, false);
        write(keys.chat(user.email), fresh);
        return fresh;
      },
      async saveMood(date, score) {
        const { email } = signedInUser();
        write(keys.moods(email), { ...readMoods(email), [date]: score });
      },
      async requestReschedule(appointmentId) {
        const list = readAppointments();
        const appointment = list.find((item) => item.id === appointmentId);
        if (!appointment) throw new ApiError("ไม่พบนัดหมายนี้", 404);
        const updated = { ...appointment, rescheduleRequested: true };
        write(keys.appointments, list.map((item) => (item.id === appointmentId ? updated : item)));
        return updated;
      },
      async sendSummary() {
        // A real backend would summarise recent check-ins for the clinician.
      },
    },

    settings: {
      async get() {
        return read<Preferences>(keys.preferences(signedInUser().email), {});
      },
      async save(preferences) {
        write(keys.preferences(signedInUser().email), preferences);
      },
    },

    resetDemoData: clearDemoData,
  };
}
