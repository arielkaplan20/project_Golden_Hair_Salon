// SUC-8: עדכון פרופיל אישי
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { saveUser } from "../auth";

export default function Profile() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", address: "", birthDate: "",
    password: "", confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // צעד 2: שליפת הפרטים האישיים הקיימים
  useEffect(() => {
    api.get("/auth/me").then((res) => {
      const u = res.data;
      setForm({
        firstName: u.firstName, lastName: u.lastName, email: u.email,
        address: u.address, birthDate: u.birthDate ? u.birthDate.slice(0, 10) : "",
        password: "", confirmPassword: ""
      });
    });
  }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // צעדים 3-6: שמירת העדכון, בדיקת תקינות בשרת והודעת אישור
  async function save(e) {
    e.preventDefault();
    setMessage(""); setError("");
    try {
      const res = await api.put("/auth/me", form);
      saveUser(res.data.user);        // כדי שהשם בדף הבית יתעדכן מיד
      setForm({ ...form, password: "", confirmPassword: "" });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בעדכון הפרטים");
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">הפרופיל שלי</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3 max-w-lg">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 max-w-lg">{error}</div>}

      <form onSubmit={save} className="bg-white p-6 rounded shadow max-w-lg">
        <label className="block mb-1">שם פרטי</label>
        <input name="firstName" value={form.firstName} onChange={change}
               className="w-full border rounded p-2 mb-3" />

        <label className="block mb-1">שם משפחה</label>
        <input name="lastName" value={form.lastName} onChange={change}
               className="w-full border rounded p-2 mb-3" />

        <label className="block mb-1">דוא"ל</label>
        <input value={form.email} disabled
               className="w-full border rounded p-2 mb-3 bg-gray-100" />

        <label className="block mb-1">כתובת מגורים</label>
        <input name="address" value={form.address} onChange={change}
               className="w-full border rounded p-2 mb-3" />

        <label className="block mb-1">תאריך לידה</label>
        <input type="date" name="birthDate" value={form.birthDate} onChange={change}
               className="w-full border rounded p-2 mb-3" />

        <div className="border-t pt-3 mt-3">
          <p className="mb-2 text-gray-600">שינוי סיסמה (יש למלא רק אם רוצים להחליף)</p>

          <label className="block mb-1">סיסמה חדשה</label>
          <input type="password" name="password" value={form.password} onChange={change}
                 className="w-full border rounded p-2 mb-3" />

          <label className="block mb-1">אימות סיסמה</label>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={change}
                 className="w-full border rounded p-2 mb-4" />
        </div>

        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
          שמירת עדכון
        </button>
      </form>
    </div>
  );
}
