// SUC-3: הזמנת תור
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { todayString } from "../dates";

export default function BookAppointment() {
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // צעד 1: שליפת רשימת הספרים
  useEffect(() => {
    api.get("/appointments/barbers").then((res) => setBarbers(res.data));
  }, []);

  // צעדים 2-3: אחרי בחירת ספר ותאריך, מציגים תורים פנויים בלבד
  useEffect(() => {
    if (!barberId || !date) { setSlots([]); return; }
    setError(""); setMessage("");
    api.get("/appointments/slots", { params: { barberId, date } })
      .then((res) => {
        setSlots(res.data.slots);
        if (res.data.slots.length === 0) {
          setError("אין תורים פנויים בתאריך זה, יש לבחור תאריך אחר");
        }
      });
  }, [barberId, date]);

  // צעדים 4-5: בחירת שעה ואישור
  async function book(time) {
    setError(""); setMessage("");
    try {
      await api.post("/appointments", { barberId, date, time });
      setMessage("התור נקבע בהצלחה ל-" + date + " בשעה " + time);
      const res = await api.get("/appointments/slots", { params: { barberId, date } });
      setSlots(res.data.slots);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהזמנת התור");
    }
  }

  const today = todayString();

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">הזמנת תור</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}

      <div className="bg-white p-6 rounded shadow max-w-lg">
        <label className="block mb-1">בחירת ספר</label>
        <select value={barberId} onChange={(e) => setBarberId(e.target.value)}
                className="w-full border rounded p-2 mb-4">
          <option value="">-- בחר ספר --</option>
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <label className="block mb-1">בחירת תאריך</label>
        <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)}
               className="w-full border rounded p-2 mb-4" />

        {slots.length > 0 && (
          <>
            <label className="block mb-2">תורים פנויים</label>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((t) => (
                <button key={t} onClick={() => book(t)}
                        className="border rounded p-2 hover:bg-yellow-100">
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
