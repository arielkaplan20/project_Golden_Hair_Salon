// חיבור לשרת - כל הבקשות עוברות דרך כאן
import axios from "axios";
import { getToken, logout } from "./auth";

const api = axios.create({ baseURL: "/api" });

// מצרף לכל בקשה את הטוקן של המשתמש המחובר
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

// אם הטוקן פג תוקף, מנתקים ומחזירים לדף הכניסה
// במקום להשאיר מסך שנראה מחובר אבל שום פעולה בו לא עובדת
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
