
const KEY = "triage_token";

export function saveToken(token, remember) {
  if (remember) {
    localStorage.setItem(KEY, token);
    sessionStorage.removeItem(KEY);
  } else {
    sessionStorage.setItem(KEY, token);
    localStorage.removeItem(KEY);
  }
}

export function getToken() {
  return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
}

export function clearToken() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}