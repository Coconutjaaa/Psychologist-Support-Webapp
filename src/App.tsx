import { useState } from "react";
import { clearSession, currentSession, saveSession } from "./api";
import Header from "./components/Header";
import ToastProvider from "./components/Toast";
import Login from "./features/auth/Login";
import ClinicianApp from "./features/clinician/ClinicianApp";
import PatientApp from "./features/patient/PatientApp";
import type { Session } from "./types";

export default function App() {
  const [session, setSession] = useState<Session | null>(currentSession);
  const login = (next: Session) => {
    saveSession(next);
    setSession(next);
  };
  const logout = () => {
    clearSession();
    setSession(null);
  };
  return (
    <ToastProvider>
      {!session ? (
        <Login onLogin={login} />
      ) : (
        // Each role only ever gets its own side of the app: clinicians the case workspace, patients their check-in chat.
        <div className="app">
          <Header session={session} onLogout={logout} />
          {session.role === "clinician" ? <ClinicianApp session={session} /> : <PatientApp session={session} />}
        </div>
      )}
    </ToastProvider>
  );
}
