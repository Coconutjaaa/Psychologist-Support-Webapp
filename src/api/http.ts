// REST implementation of the Api contract, used when VITE_API_URL is set.
// Endpoints, bodies and error format are documented on each method in ./contract.ts.
import type { Appointment, MoodLog, Note, Patient, PatientCheckins, PatientHome, PatientMessage, Preferences, RagAnswer, Session, SessionSummary, TranscriptLine, TranscriptUpload } from "../types";
import { ApiError, type Api } from "./contract";
import { currentSession } from "./session";

type Method = "GET" | "POST" | "PUT" | "DELETE";

export function createHttpApi(baseUrl: string): Api {
  const root = baseUrl.replace(/\/+$/, "");

  async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = currentSession()?.token;
    if (token) headers.Authorization = `Bearer ${token}`;
    let payload: BodyInit | undefined;
    if (body instanceof FormData) payload = body; // the browser sets the multipart Content-Type
    else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(root + path, { method, headers, body: payload });
    } catch {
      throw new ApiError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    }
    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string; field?: string };
      throw new ApiError(error.message || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${response.status})`, response.status, error.field);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const get = <T>(path: string) => request<T>("GET", path);
  const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
  const put = <T>(path: string, body?: unknown) => request<T>("PUT", path, body);
  const del = <T>(path: string) => request<T>("DELETE", path);
  const id = encodeURIComponent;

  return {
    auth: {
      login: (email, password) => post<Session>("/auth/login", { email, password }),
      signUp: (input) => post<Session>("/auth/signup", input),
    },
    patients: {
      list: () => get<Patient[]>("/patients"),
      create: (input) => post<Patient>("/patients", input),
    },
    appointments: {
      list: () => get<Appointment[]>("/appointments"),
      save: ({ id: appointmentId, ...fields }) => (appointmentId ? put<Appointment>(`/appointments/${id(appointmentId)}`, fields) : post<Appointment>("/appointments", fields)),
      cancel: (appointmentId) => del<void>(`/appointments/${id(appointmentId)}`),
    },
    notes: {
      list: (patientId) => get<Note[]>(`/patients/${id(patientId)}/notes`),
      create: (patientId, text) => post<Note>(`/patients/${id(patientId)}/notes`, { text }),
      remove: (patientId, noteId) => del<void>(`/patients/${id(patientId)}/notes/${id(noteId)}`),
    },
    transcripts: {
      list: (patientId) => get<TranscriptUpload[]>(`/patients/${id(patientId)}/transcripts`),
      upload: (patientId, file) => {
        const form = new FormData();
        form.append("file", file);
        return post<TranscriptUpload>(`/patients/${id(patientId)}/transcripts`, form);
      },
      session: (patientId, sessionNumber) => get<TranscriptLine[]>(`/patients/${id(patientId)}/sessions/${sessionNumber}/transcript`),
      summaries: (patientId) => get<SessionSummary[]>(`/patients/${id(patientId)}/session-summaries`),
    },
    kg: {
      ask: (patientId, question) => post<RagAnswer>(`/patients/${id(patientId)}/kg/ask`, { question }),
    },
    checkins: {
      forPatient: (patientId) => get<PatientCheckins>(`/patients/${id(patientId)}/checkins`),
      moodsByPatient: () => get<Record<string, MoodLog>>("/checkins/moods"),
    },
    support: {
      send: (message) => post<void>("/support", { message }),
    },
    me: {
      home: () => get<PatientHome>("/me/home"),
      sendMessage: (text) => post<PatientMessage>("/me/messages", { text }),
      clearChat: () => del<PatientMessage[]>("/me/messages"),
      saveMood: (date, score) => put<void>(`/me/moods/${id(date)}`, { score }),
      requestReschedule: (appointmentId) => post<Appointment>(`/me/appointments/${id(appointmentId)}/reschedule-request`),
      sendSummary: () => post<void>("/me/summary"),
    },
    settings: {
      get: () => get<Preferences>("/me/preferences"),
      save: (preferences) => put<void>("/me/preferences", preferences),
    },
  };
}
