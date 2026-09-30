import axios from "axios";

/**
 * A stable id for guest carts. Created once and kept in localStorage so a guest
 * keeps their cart across reloads, and so the same cart can be claimed by an
 * account at sign-in.
 */
export const SESSION_KEY = "premier-products:session-id";

export function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const TOKEN_KEY = "premier-products:token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

const client = axios.create({
  // Same-origin in dev (Vite proxies /api) and in production (Express serves dist).
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Lets the API resolve a guest cart when nobody is signed in.
  config.headers["x-session-id"] = getSessionId();
  return config;
});

/** Turns any axios failure into a plain Error carrying the server's message. */
function toMessage(error) {
  const data = error.response?.data;
  if (data?.message) {
    if (data.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      return `${data.message}: ${first}`;
    }
    return data.message;
  }
  if (error.code === "ERR_NETWORK") {
    return "Cannot reach the server. Is the API running on port 4000?";
  }
  return error.message || "Something went wrong.";
}

client.interceptors.response.use(
  (res) => res,
  (error) => {
    // A rejected or expired token should not keep a stale one in storage.
    if (error.response?.status === 401 && getToken()) {
      setToken(null);
      window.dispatchEvent(new CustomEvent("premier-products:unauthorised"));
    }
    return Promise.reject(Object.assign(toMessage(error), { raw: error }));
  }
);

export default client;
