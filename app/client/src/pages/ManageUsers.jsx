// SUC-10: ניהול משתמשים והרשאות
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const ROLES = { client: "לקוח", barber: "ספר", admin: "מנהל ראשי" };

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState(null);   // השינוי שממתין לאישור
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // צעד 2: שליפת רשימת המשתמשים
  function loadUsers() {
    api.get("/admin/users").then((res) => setUsers(res.data));
  }
  useEffect(loadUsers, []);

  // צעדים 6-7: עדכון ההרשאה והודעת אישור
  async function confirm() {
    setMessage(""); setError("");
    try {
      const res = await api.put("/admin/users/" + pending.user.id + "/role", { role: pending.role });
      setMessage(res.data.message);
      setPending(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בעדכון ההרשאה");
      setPending(null);
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">ניהול משתמשים והרשאות</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}

      {/* צעד 3: בחירת משתמש ועדכון הרשאה */}
      <table className="bg-white rounded shadow w-full text-right">
        <thead>
          <tr className="bg-yellow-100">
            <th className="p-2">שם</th>
            <th className="p-2">דוא"ל</th>
            <th className="p-2">הרשאה</th>
            <th className="p-2">שינוי הרשאה</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{ROLES[u.role]}</td>
              <td className="p-2">
                <select value={u.role}
                        onChange={(e) => setPending({ user: u, role: e.target.value })}
                        className="border rounded p-1">
                  {Object.keys(ROLES).map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* צעדים 4-5: חלון אישור. הסתעפות א': לחיצה על "לא" מסיימת ללא שינוי */}
      {pending && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow max-w-sm text-center">
            <p className="mb-4">
              לשנות את ההרשאה של {pending.user.name} ל"{ROLES[pending.role]}"?
            </p>
            <button onClick={confirm} className="bg-yellow-600 text-white px-4 py-1 rounded ml-2">
              כן
            </button>
            <button onClick={() => setPending(null)} className="border px-4 py-1 rounded">
              לא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
