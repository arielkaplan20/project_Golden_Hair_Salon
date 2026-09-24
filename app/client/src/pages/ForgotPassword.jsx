// סעיף 6.1.2: המשתמש שוכח את הסיסמה ומבקש קישור לשחזור
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage(""); setError(""); setSending(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בשליחת הבקשה");
    }
    setSending(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">GOLDEN HAIR SALON</h1>
        <p className="text-center mb-6">שחזור סיסמה</p>

        {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}

        <form onSubmit={submit}>
          <p className="mb-3 text-gray-600">
            יש להזין את כתובת הדוא"ל שאיתה נרשמת, ויישלח אליה קישור לבחירת סיסמה חדשה.
          </p>

          <label className="block mb-1">כתובת מייל</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                 className="w-full border rounded p-2 mb-4" />

          <button type="submit" disabled={sending}
                  className="w-full bg-yellow-600 text-white p-2 rounded disabled:bg-gray-400">
            {sending ? "שולח..." : "שליחת קישור"}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link to="/login" className="text-blue-600 underline">חזרה לדף הכניסה</Link>
        </p>
      </div>
    </div>
  );
}
