import { createContext, useContext, createSignal, createMemo, onMount, onCleanup } from "solid-js";
import type { JSX, Accessor } from "solid-js";
import { ApiClient, getAuthToken, setAuthToken } from "../data/apiClient";

export interface Auth {
  authenticated: Accessor<boolean>;
  role: Accessor<string | null>;
  isAdmin: Accessor<boolean>;
  steamId: Accessor<string | null>;
  steamName: Accessor<string | null>;
  steamAvatar: Accessor<string | null>;
  authError: Accessor<string | null>;
  isEmbed: Accessor<boolean>;
  dismissAuthError: () => void;
  loginWithSteam: () => void;
  logout: () => Promise<void>;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  steam_error: "Steam login failed. Please try again.",
};

const EMBED_RETURN_KEY = "ocap_embed_return";
const EMBED_READY = "ocap-embed-ready";
const EMBED_AUTH = "ocap-embed-auth";

const UKSF_ORIGINS = new Set([
  "https://uk-sf.co.uk",
  "https://www.uk-sf.co.uk",
  "http://localhost:4200",
  "http://127.0.0.1:4200",
]);

/** Only bounce back to UKSF hosts after Steam login. */
function isSafeEmbedReturn(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return u.hostname === "uk-sf.co.uk" || u.hostname.endsWith(".uk-sf.co.uk") || u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function detectEmbed(params: URLSearchParams): boolean {
  if (params.get("embed") === "1" || params.has("embedReturn") || params.has("embed_return")) {
    return true;
  }
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isTrustedParentOrigin(origin: string): boolean {
  if (UKSF_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    return u.hostname === "uk-sf.co.uk" || u.hostname.endsWith(".uk-sf.co.uk");
  } catch {
    return false;
  }
}

const AuthContext = createContext<Auth>();

/**
 * Provider that checks session state on mount and exposes Steam login/logout actions app-wide.
 * UKSF embed: parent mints OCAP JWT and postMessages it (no Steam hop in iframe).
 */
export function AuthProvider(props: { children: JSX.Element }): JSX.Element {
  const [authenticated, setAuthenticated] = createSignal(false);
  const [role, setRole] = createSignal<string | null>(null);
  const isAdmin = createMemo(() => role() === "admin");
  const [steamId, setSteamId] = createSignal<string | null>(null);
  const [steamName, setSteamName] = createSignal<string | null>(null);
  const [steamAvatar, setSteamAvatar] = createSignal<string | null>(null);
  const [authError, setAuthError] = createSignal<string | null>(null);
  const [isEmbed, setIsEmbed] = createSignal(false);
  const api = new ApiClient();

  const applyMe = async () => {
    if (!getAuthToken()) {
      setAuthenticated(false);
      setRole(null);
      setSteamId(null);
      setSteamName(null);
      setSteamAvatar(null);
      return;
    }
    try {
      const state = await api.getMe();
      setAuthenticated(state.authenticated);
      setRole(state.role ?? null);
      setSteamId(state.steamId ?? null);
      setSteamName(state.steamName ?? null);
      setSteamAvatar(state.steamAvatar ?? null);
    } catch {
      setAuthenticated(false);
    }
  };

  const acceptEmbedToken = async (token: string) => {
    if (!token) return;
    setAuthToken(token);
    setAuthError(null);
    await applyMe();
  };

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const embed = detectEmbed(params);
    setIsEmbed(embed);

    const embedFromQuery = params.get("embedReturn") || params.get("embed_return");
    const embedCandidate = embedFromQuery || document.referrer || "";
    if (embedCandidate && isSafeEmbedReturn(embedCandidate)) {
      sessionStorage.setItem(EMBED_RETURN_KEY, embedCandidate);
    }

    const error = params.get("auth_error");
    if (error) {
      setAuthError(AUTH_ERROR_MESSAGES[error] ?? "Authentication failed.");
    }

    const hadToken = api.consumeAuthToken(params);

    // One-shot query handoff backup: ?embedToken=
    const embedToken = params.get("embedToken") || params.get("embed_token");
    if (embedToken) {
      await acceptEmbedToken(embedToken);
      params.delete("embedToken");
      params.delete("embed_token");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }

    if (hadToken) {
      const embedReturn = sessionStorage.getItem(EMBED_RETURN_KEY);
      if (embedReturn && isSafeEmbedReturn(embedReturn)) {
        sessionStorage.removeItem(EMBED_RETURN_KEY);
        window.location.replace(embedReturn);
        return;
      }
    }

    if (params.has("auth_error") || params.has("auth_token")) {
      params.delete("auth_error");
      params.delete("auth_token");
      const returnTo = hadToken ? api.popReturnTo() : null;
      if (returnTo && returnTo !== "/") {
        window.history.replaceState({}, "", returnTo);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        const qs = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
      }
    }

    // Parent postMessage auth (preferred embed path)
    if (embed) {
      const onMessage = (event: MessageEvent) => {
        if (!isTrustedParentOrigin(event.origin)) return;
        if (event.data?.type !== EMBED_AUTH || typeof event.data.token !== "string") return;
        void acceptEmbedToken(event.data.token);
      };
      window.addEventListener("message", onMessage);
      onCleanup(() => window.removeEventListener("message", onMessage));
      // Tell UKSF parent we are ready for a token (and again after a tick for races).
      const notify = () => {
        try {
          window.parent?.postMessage({ type: EMBED_READY }, "*");
        } catch {
          /* ignore */
        }
      };
      notify();
      window.setTimeout(notify, 300);
    }

    if (!getAuthToken()) {
      setAuthenticated(false);
      return;
    }
    await applyMe();
  });

  const dismissAuthError = () => setAuthError(null);

  const loginWithSteam = () => {
    setAuthError(null);
    const q = new URLSearchParams(window.location.search);
    const er = q.get("embedReturn") || q.get("embed_return");
    if (er && isSafeEmbedReturn(er)) {
      sessionStorage.setItem(EMBED_RETURN_KEY, er);
    }
    const url = api.getSteamLoginUrl(
      window.location.pathname + window.location.search,
    );
    const target = window.top && window.top !== window.self ? window.top : window;
    target.location.href = url;
  };

  const logout = async (): Promise<void> => {
    if (isEmbed()) return;
    try {
      await api.logout();
    } finally {
      setAuthenticated(false);
      setRole(null);
      setSteamId(null);
      setSteamName(null);
      setSteamAvatar(null);
    }
  };

  return (
    <AuthContext.Provider value={{ authenticated, role, isAdmin, steamId, steamName, steamAvatar, authError, isEmbed, dismissAuthError, loginWithSteam, logout }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
