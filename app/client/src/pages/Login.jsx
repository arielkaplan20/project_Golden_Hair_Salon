// SUC-2: התחברות לאפליקציה
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { saveAuth } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      saveAuth(res.data.token, res.data.user);
      navigate("/");                                  // מעבר לממשק לפי ההרשאה
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהתחברות");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">GOLDEN HAIR SALON</h1>
        <h2 className="text-lg mb-4">כניסה למערכת</h2>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}

        <label className="block mb-1">כתובת מייל</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
               className="w-full border rounded p-2 mb-3" />

        <label className="block mb-1">סיסמה</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               className="w-full border rounded p-2 mb-4" />

        <button type="submit" className="w-full bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700">
          התחברות
        </button>

        <p className="text-center mt-4">
          אין לך חשבון? <Link to="/register" className="text-blue-600 underline">להרשמה</Link>
        </p>
        <p className="text-center mt-2">
          <Link to="/forgot-password" className="text-blue-600 underline">שכחתי סיסמה</Link>
        </p>
      </form>
    </div>
  );
}
