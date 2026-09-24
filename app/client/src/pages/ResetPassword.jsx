// סעיף 6.1.2: בחירת סיסמה חדשה מתוך הקישור שהגיע במייל
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMessage(""); setError("");
    try {
      const res = await api.post("/auth/reset-password", { token, password, confirmPassword });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);   // מעבר לדף הכניסה
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בשינוי הסיסמה");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">GOLDEN HAIR SALON</h1>
        <p className="text-center mb-6">בחירת סיסמה חדשה</p>

        {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}

        <form onSubmit={submit}>
          <label className="block mb-1">סיסמה חדשה</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                 className="w-full border rounded p-2 mb-3" />

          <label className="block mb-1">אימות סיסמה</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                 className="w-full border rounded p-2 mb-4" />

          <button type="submit" className="w-full bg-yellow-600 text-white p-2 rounded">
            שמירת הסיסמה
          </button>
        </form>

        <p className="text-center mt-4">
          <Link to="/login" className="text-blue-600 underline">חזרה לדף הכניסה</Link>
        </p>
      </div>
    </div>
  );
}
