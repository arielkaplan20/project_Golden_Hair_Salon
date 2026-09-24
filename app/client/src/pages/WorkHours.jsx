// SUC-9 צעדים 5-7: עריכת ימי ושעות העבודה
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export default function WorkHours() {
  const [workDays, setWorkDays] = useState([]);
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // שליפת ימי ושעות העבודה הנוכחיים
  useEffect(() => {
    api.get("/schedule/me").then((res) => {
      setWorkDays(res.data.workDays);
      setStartHour(res.data.startHour);
      setEndHour(res.data.endHour);
    });
  }, []);

  // סימון או ביטול של יום עבודה
  function toggleDay(d) {
    if (workDays.includes(d)) {
      setWorkDays(workDays.filter((x) => x !== d));
    } else {
      setWorkDays([...workDays, d]);
    }
  }

  // צעד 5: לחיצה על שמירה. צעדים 6-7 והסתעפות ג' מטופלים בשרת
  async function save(e) {
    e.preventDefault();
    setMessage(""); setError("");
    try {
      const res = await api.put("/schedule/me", { workDays, startHour, endHour });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בעדכון שעות העבודה");
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">עריכת ימי ושעות עבודה</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3 max-w-lg">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 max-w-lg">{error}</div>}

      <form onSubmit={save} className="bg-white p-6 rounded shadow max-w-lg">
        <label className="block mb-2">ימי עבודה</label>
        <div className="mb-4">
          {DAYS.map((name, d) => (
            <label key={d} className="block">
              <input type="checkbox" checked={workDays.includes(d)}
                     onChange={() => toggleDay(d)} className="ml-2" />
              {name}
            </label>
          ))}
        </div>

        <label className="block mb-1">שעת התחלה</label>
        <input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)}
               className="w-full border rounded p-2 mb-4" />

        <label className="block mb-1">שעת סיום</label>
        <input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)}
               className="w-full border rounded p-2 mb-4" />

        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
          שמירה
        </button>
      </form>
    </div>
  );
}
