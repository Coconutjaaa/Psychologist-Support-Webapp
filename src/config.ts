// App-wide settings. Every name shown in the demo lives here, so it can be renamed (or anonymised) in one place.
// Values from .env (template: .env.example) are baked into the built site by Vite, so anyone using the site can read
// them: keep them demo-only, never real credentials. `pnpm dev` picks up changes to .env and this file by itself;
// a Docker image has them baked in, so rebuild it (`docker compose up --build`).
const env = import.meta.env;

/** App name in two parts: the logo wordmark colours the second part teal ("Mind" + "Link"). */
export const brandName = ["Mind", "Link"] as const;
/** Shown in the browser tab, header, login page and messages. The logo image is src/assets/logo-mark.png. */
export const appName = brandName.join("");
/** Domain of the demo accounts in .env; also used for calendar (.ics) event ids. */
export const emailDomain = "mindflow.demo";

/** Backend base URL, e.g. "https://api.example.com" or "/api". Empty runs the built-in browser-only mock (src/api/mock). */
export const apiUrl = env.VITE_API_URL?.trim() ?? "";

/** Features that are built but switched off. Their code stays in place; set to true to show them again. */
export const features = {
  /**
   * Appointments: the clinician's schedule page, every "นัดหมาย" button and summary, the patient's next-appointment card
   * and the reminder setting. Off because it is not in the current requirements; while off, `/appointments` is never called.
   */
  appointments: false,
};

// --- Mock backend only -------------------------------------------------------------------------------------------
// The demo people below are only used by src/api/mock; a real backend supplies its own users and patients.

/** The psychologist who signs in to the clinician side. */
export const clinician = { name: "ดร. มนัสวี", email: env.VITE_CLINICIAN_EMAIL ?? "", password: env.VITE_CLINICIAN_PASSWORD ?? "" };

/** Demo patients by id. Each one signs in to the patient app with the email/password from .env. */
export const patients = {
  a: { name: "คุณเอ", email: env.VITE_PATIENT_1_EMAIL ?? "", password: env.VITE_PATIENT_1_PASSWORD ?? "" },
  chin: { name: "คุณชิน", email: env.VITE_PATIENT_2_EMAIL ?? "", password: env.VITE_PATIENT_2_PASSWORD ?? "" },
  non: { name: "คุณนนท์", email: env.VITE_PATIENT_3_EMAIL ?? "", password: env.VITE_PATIENT_3_PASSWORD ?? "" },
  pim: { name: "คุณพิม", email: env.VITE_PATIENT_4_EMAIL ?? "", password: env.VITE_PATIENT_4_PASSWORD ?? "" },
};
