/// <reference types="vite/client" />

// Build-time settings read from .env (see .env.example).
interface ImportMetaEnv {
  /** Backend base URL. Leave empty to run the browser-only mock. */
  readonly VITE_API_URL?: string;
  // Demo login accounts for the mock backend.
  readonly VITE_CLINICIAN_EMAIL?: string;
  readonly VITE_CLINICIAN_PASSWORD?: string;
  readonly VITE_PATIENT_1_EMAIL?: string;
  readonly VITE_PATIENT_1_PASSWORD?: string;
  readonly VITE_PATIENT_2_EMAIL?: string;
  readonly VITE_PATIENT_2_PASSWORD?: string;
  readonly VITE_PATIENT_3_EMAIL?: string;
  readonly VITE_PATIENT_3_PASSWORD?: string;
  readonly VITE_PATIENT_4_EMAIL?: string;
  readonly VITE_PATIENT_4_PASSWORD?: string;
}
