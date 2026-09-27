// SUC-9 צעדים 5-8: סדר העבודה השבועי הקבוע, ושינויים לתאריכים מסוימים (הסתעפות ג')
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { todayString } from "../dates";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// "2026-10-15" -> "15/10/2026, יום חמישי"
function formatDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return String(d).padStart(2, "0") + "/" + String(m).padStart(2, "0") + "/" + y + ", יום " + DAYS[day];
}

export default function WorkHours() {
  const [week, setWeek] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [exDate, setExDate] = useState("");
  const [exOff, setExOff] = useState(true);
  const [exStart, setExStart] = useState("09:00");
  const [exEnd, setExEnd] = useState("19:00");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState([]);
  const navigate = useNavigate();

  // צעד 5: שליפת סדר העבודה השבועי והשינויים לתאריכים
  function load() {
    api.get("/schedule/me").then((res) => {
      setWeek(res.data.weeklySchedule);
      setExceptions(res.data.exceptions);
    });
  }
  useEffect(() => { load(); }, []);

  function updateDay(day, field, value) {
    setWeek(week.map((d) => (d.day === day ? { ...d, [field]: value } : d)));
  }

  function clearMessages() {
    setMessage(""); setError(""); setConflicts([]);
  }

  // הסתעפויות ד' ו-ה': הודעת השגיאה מהשרת, ורשימת התורים המתנגשים אם יש
  function showError(err, fallback) {
    setError(err.response?.data?.message || fallback);
    setConflicts(err.response?.data?.conflicts || []);
  }

  // צעד 6: שמירת סדר העבודה השבועי. צעדים 7-8 מטופלים בשרת
  async function saveWeek(e) {
    e.preventDefault();
    clearMessages();
    try {
      const res = await api.put("/schedule/me", { weeklySchedule: week });
      setMessage(res.data.message);
    } catch (err) {
      showError(err, "שגיאה בשמירת סדר העבודה");
    }
  }

  // הסתעפות ג': יום חופש או שעות אחרות לתאריך מסוים
  async function saveException(e) {
    e.preventDefault();
    clearMessages();
    try {
      const body = exOff
        ? { date: exDate, off: true }
        : { date: exDate, off: false, startHour: exStart, endHour: exEnd };
      const res = await api.post("/schedule/me/exceptions", body);
      setMessage(res.data.message);
      setExDate("");
      load();
    } catch (err) {
      showError(err, "שגיאה בשמירת השינוי");
    }
  }

  async function removeException(date) {
    clearMessages();
    try {
      const res = await api.delete("/schedule/me/exceptions/" + date);
      setMessage(res.data.message);
      load();
    } catch (err) {
      showError(err, "שגיאה במחיקת השינוי");
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">עריכת ימי ושעות עבודה</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{message}</div>}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-3">
          {error}
          {conflicts.length > 0 && (
            <ul className="list-disc mr-6 mt-2">
              {conflicts.map((c) => (
                <li key={c.date + c.time}>
                  {formatDate(c.date)}, בשעה {c.time}: {c.clientName}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* במסך רחב שני החלקים זה לצד זה, ובמסך צר אחד מתחת לשני */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">

      {/* סדר העבודה השבועי הקבוע */}
      <form onSubmit={saveWeek} className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-1">סדר עבודה שבועי</h2>
        <p className="text-gray-600 text-sm mb-4">
          נשמר לכל השבועות, עד שמשנים אותו. אפשר לקבוע שעות שונות לכל יום.
        </p>
        <table className="w-full text-right mb-4">
          <thead>
            <tr className="bg-yellow-100">
              <th className="p-2">יום</th>
              <th className="p-2">עובד</th>
              <th className="p-2">שעת התחלה</th>
              <th className="p-2">שעת סיום</th>
            </tr>
          </thead>
          <tbody>
            {week.map((d) => (
              <tr key={d.day} className="border-t">
                <td className="p-2">{DAYS[d.day]}</td>
                <td className="p-2">
                  <input type="checkbox" checked={d.active}
                         onChange={(e) => updateDay(d.day, "active", e.target.checked)} />
                </td>
                <td className="p-2">
                  <input type="time" value={d.startHour} disabled={!d.active}
                         onChange={(e) => updateDay(d.day, "startHour", e.target.value)}
                         className="border rounded p-1 disabled:bg-gray-100 disabled:text-gray-400" />
                </td>
                <td className="p-2">
                  <input type="time" value={d.endHour} disabled={!d.active}
                         onChange={(e) => updateDay(d.day, "endHour", e.target.value)}
                         className="border rounded p-1 disabled:bg-gray-100 disabled:text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
          שמירת סדר העבודה
        </button>
      </form>

      {/* שינוי לתאריך מסוים */}
      <form onSubmit={saveException} className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-1">שינוי לתאריך מסוים</h2>
        <p className="text-gray-600 text-sm mb-4">
          חל על התאריך שנבחר בלבד. סדר העבודה השבועי לא משתנה.
        </p>

        <label className="block mb-1">תאריך</label>
        <input type="date" value={exDate} min={todayString()} onChange={(e) => setExDate(e.target.value)}
               className="w-full border rounded p-2 mb-3" />

        <label className="block mb-2">
          <input type="radio" checked={exOff} onChange={() => setExOff(true)} className="ml-2" />
          יום חופש
        </label>
        <label className="block mb-3">
          <input type="radio" checked={!exOff} onChange={() => setExOff(false)} className="ml-2" />
          שעות אחרות ביום הזה
        </label>

        {!exOff && (
          <div className="flex gap-4 mb-3">
            <div>
              <label className="block mb-1">שעת התחלה</label>
              <input type="time" value={exStart} onChange={(e) => setExStart(e.target.value)}
                     className="border rounded p-2" />
            </div>
            <div>
              <label className="block mb-1">שעת סיום</label>
              <input type="time" value={exEnd} onChange={(e) => setExEnd(e.target.value)}
                     className="border rounded p-2" />
            </div>
          </div>
        )}

        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded mb-5">
          שמירת השינוי
        </button>

        <h3 className="font-bold mb-2">שינויים קרובים</h3>
        {exceptions.length === 0 && <p className="text-gray-600">אין שינויים לתאריכים מסוימים</p>}
        {exceptions.length > 0 && (
          <table className="w-full text-right">
            <tbody>
              {exceptions.map((x) => (
                <tr key={x.date} className="border-t">
                  <td className="p-2">{formatDate(x.date)}</td>
                  <td className="p-2">
                    {x.off ? "יום חופש" : <span dir="ltr">{x.startHour}–{x.endHour}</span>}
                  </td>
                  <td className="p-2 text-left">
                    <button type="button" onClick={() => removeException(x.date)} className="text-red-600 underline">
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </form>
      </div>
    </div>
  );
}
