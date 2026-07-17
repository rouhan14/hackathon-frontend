const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export type Integration = {
  id: string;
  provider: string;
  workspaceId?: string;
  workspaceName?: string;
  botId?: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  integrations?: Integration[];
};

type AuthResponse = {
  token: string;
  user: User;
};

/** Authorization header for the current token, or {} if signed out. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * fetch wrapper that prefixes the API base URL and attaches the Bearer token.
 * Use it for any authenticated call from a protected page.
 */
export function authFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init.headers },
  });
}

type RequestOptions = {
  /**
   * True for calls that rely on the current session (e.g. /auth/me). A 401 on
   * these means the token is missing/expired/invalid, so we end the session and
   * surface the reason on the login page. Login/signup are NOT authenticated —
   * their 401 (bad credentials) is a normal inline error.
   */
  authenticated?: boolean;
};

/** Runs a request and parses the JSON body, throwing a readable error on failure. */
async function request<T>(
  path: string,
  init: RequestInit,
  { authenticated = false }: RequestOptions = {}
): Promise<T> {
  let res: Response;
  try {
    res = await authFetch(path, init);
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response; leave data as null.
  }

  if (!res.ok) {
    const message =
      (data as { message?: string; error?: string } | null)?.message ??
      (data as { error?: string } | null)?.error ??
      `Request failed (${res.status}).`;

    // A 401 on an authenticated call = the session is no longer valid
    // (missing / expired / malformed / bad signature). End it and remember the
    // server's reason so the login page can explain why the user was signed out.
    if (res.status === 401 && authenticated) {
      setAuthNotice(message);
      clearToken();
    }

    throw new Error(message);
  }

  return data as T;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Fetches the current user from GET /auth/me and refreshes the cached user. */
export async function fetchMe(): Promise<User> {
  const user = await request<User>(
    "/auth/me",
    { method: "GET" },
    { authenticated: true }
  );
  setUser(user);
  return user;
}

type DisconnectResponse = {
  disconnected: boolean;
  revokedAtProvider: boolean;
};

/**
 * Disconnects an integration via DELETE /integrations/{id}, then refreshes the
 * user so any card reading the store flips back to a disconnected state.
 */
export async function disconnectIntegration(
  id: string
): Promise<DisconnectResponse> {
  const result = await request<DisconnectResponse>(
    `/integrations/${id}`,
    { method: "DELETE" },
    { authenticated: true }
  );
  await fetchMe();
  return result;
}

/**
 * Starts the Notion OAuth flow via a full-page redirect to GET /auth/notion,
 * which in turn redirects to Notion's consent screen. This must be a browser
 * navigation (not fetch) so the cross-origin redirect to Notion works.
 *
 * The JWT is passed as a `token` query param since a top-level navigation can't
 * send an Authorization header. Adjust the param name here if the backend
 * expects the token differently.
 */
export function startNotionOAuth(): void {
  if (typeof window === "undefined") return;
  const url = new URL(`${API_BASE_URL}/auth/notion`);
  const token = getToken();
  if (token) url.searchParams.set("token", token);
  window.location.href = url.toString();
}

/** Reads the JWT out of a response, tolerating a few common field names. */
function extractToken(data: Record<string, unknown>): string {
  const token =
    data.accessToken ?? data.token ?? data.access_token ?? data.jwt;
  if (typeof token !== "string" || !token) {
    throw new Error("No token returned by the server.");
  }
  return token;
}

/** Persists token + user from an auth response and returns them. */
function completeAuth(data: Record<string, unknown>): AuthResponse {
  const token = extractToken(data);
  const user = (data.user ?? null) as User | null;
  setToken(token);
  if (user) setUser(user);
  return { token, user: user as User };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const data = await postJson<Record<string, unknown>>("/auth/login", {
    email,
    password,
  });
  return completeAuth(data);
}

export async function signup(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const data = await postJson<Record<string, unknown>>("/auth/signup", {
    name,
    email,
    password,
  });
  return completeAuth(data);
}

// --- Reactive token store ---------------------------------------------------
// Lets components read the current token via useSyncExternalStore and re-render
// when it changes — both in this tab (login/logout) and across tabs.

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
    emit();
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    emit();
  }
}

export function setUser(user: User): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    emit();
  }
}

// Cache the parsed user so getUser() returns a stable reference across calls.
// useSyncExternalStore requires this — a fresh object every call is treated as
// a change and causes an infinite render loop.
let cachedUserRaw: string | null = null;
let cachedUser: User | null = null;

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw === cachedUserRaw) return cachedUser;

  cachedUserRaw = raw;
  if (!raw) {
    cachedUser = null;
  } else {
    try {
      cachedUser = JSON.parse(raw) as User;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

/** Subscribe to token changes (same-tab and cross-tab). Returns an unsubscribe. */
export function subscribeToken(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  listeners.add(callback);

  // Fires when another tab changes localStorage.
  const onStorage = (e: StorageEvent) => {
    if (e.key === TOKEN_KEY || e.key === USER_KEY || e.key === null) callback();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** Stable server snapshot for useSyncExternalStore (no token during SSR). */
export function getServerToken(): null {
  return null;
}

// --- Auth notice store ------------------------------------------------------
// A one-shot message explaining why a session ended (e.g. "Access token has
// expired."), set when an authenticated request is rejected with 401. The login
// page reads it via useSyncExternalStore and shows it to the user.

let authNotice: string | null = null;
const noticeListeners = new Set<() => void>();

export function setAuthNotice(message: string | null): void {
  authNotice = message;
  for (const listener of noticeListeners) listener();
}

export function getAuthNotice(): string | null {
  return authNotice;
}

export function getServerAuthNotice(): null {
  return null;
}

export function subscribeAuthNotice(callback: () => void): () => void {
  noticeListeners.add(callback);
  return () => {
    noticeListeners.delete(callback);
  };
}
