import axios from "axios";
import { getToken, clearToken } from "./lib/tokenStorage";

// One axios instance for the whole app. baseURL comes from .env (VITE_API_URL).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT to every outgoing request, if we have one.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected (expired / invalid), clear it and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

// --- Endpoint helpers ------------------------------------------------------

export const login = (email, password) =>
  api.post("/api/auth/login", { email, password }).then((r) => r.data);

export const register = (payload) =>
  api.post("/api/auth/register", payload).then((r) => r.data);

export const getMe = () =>
  api.get("/api/auth/me").then((r) => r.data);

export const getUsers = () =>
  api.get("/api/auth/users").then((r) => r.data);

export const createUser = (payload) =>
  api.post("/api/auth/users", payload).then((r) => r.data);

export const updateUserRole = (id, role) =>
  api.put(`/api/auth/users/${id}/role`, { role }).then((r) => r.data);

// --- SLA policies ----------------------------------------------------------
export const getSlaPolicies = () =>
  api.get("/api/slapolicies").then((r) => r.data);

export const createSlaPolicy = (payload) =>
  api.post("/api/slapolicies", payload).then((r) => r.data);

export const deleteSlaPolicy = (id) =>
  api.delete(`/api/slapolicies/${id}`).then((r) => r.data);

export const getTickets = () =>
  api.get("/api/tickets").then((r) => r.data);

// Paged list for the tickets workspace. Pass { page, pageSize, view filters, sort }.
export const getTicketsPaged = (params) =>
  api.get("/api/tickets", { params }).then((r) => r.data);

export const getTicketCounts = () =>
  api.get("/api/tickets/counts").then((r) => r.data);

export const getTicketStats = () =>
  api.get("/api/tickets/stats").then((r) => r.data);

export const getTicket = (id) =>
  api.get(`/api/tickets/${id}`).then((r) => r.data);

export const createTicket = (ticket) =>
  api.post("/api/tickets", ticket).then((r) => r.data);

export const updateTicket = (id, patch) =>
  api.patch(`/api/tickets/${id}`, patch).then((r) => r.data);

export const getComments = (ticketId) =>
  api.get(`/api/tickets/${ticketId}/comments`).then((r) => r.data);

export const addComment = (ticketId, payload) =>
  api.post(`/api/tickets/${ticketId}/comments`, payload).then((r) => r.data);

export const getEvents = (ticketId) =>
  api.get(`/api/tickets/${ticketId}/events`).then((r) => r.data);

export default api;