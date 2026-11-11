// The one place the UI gets data from. Set VITE_API_URL in .env to talk to a real backend; leave it empty to run the
// browser-only mock. Components import `api` from here and never care which one is active.
import { apiUrl } from "../config";
import type { Api } from "./contract";
import { createHttpApi } from "./http";
import { createMockApi } from "./mock";

export const api: Api = apiUrl ? createHttpApi(apiUrl) : createMockApi();

export { ApiError, errorMessage, type Api, type DemoAccount } from "./contract";
export { clearSession, currentSession, saveSession } from "./session";
