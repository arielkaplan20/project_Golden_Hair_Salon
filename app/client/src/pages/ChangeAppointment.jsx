// SUC-5: שינוי תור
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { todayString } from "../dates";

export default function ChangeAppointment() {
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);   // התור שנבחר לשינוי
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // צעד 2: הצגת רשימת התורים הקיימים של הלקוח
  function loadList() {
    api.get("/appointments/my").then((res) => {
      setList(res.data);
      setLoaded(true);
    });
  }
  useEffect(loadList, []);

  // צעד 4: הצגת תורים פנויים בלבד לתאריך החדש
  useEffect(() => {
    if (!selected || !date) { setSlots([]); return; }
    setError(""); setMessage("");
    api.get("/appointments/slots", { params: { barberId: selected.barberId, date } })
      .then((res) => {
        setSlots(res.data.slots);
        if (res.data.slots.length === 0) {
          setError("אין תורים פנויים בתאריך זה, יש לבחור תאריך אחר");
        }
      });
  }, [selected, date]);

  // צעדים 5-7: בחירת שעה, עדכון התור והצגת הודעת אישור
  async function save(time) {
    setError(""); setMessage("");
    try {
      await api.put("/appointments/" + selected.id, { date, time });
      setMessage("התור שונה בהצלחה ל-" + date + " בשעה " + time);
      setSelected(null);
      setDate("");
      setSlots([]);
      loadList();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בשינוי התור");
    }
  }

  const today = todayString();

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">שינוי תור</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3 max-w-lg">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 max-w-lg">{error}</div>}

      {/* הסתעפות א': לא קיימים תורים עבור הלקוח */}
      {loaded && list.length === 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded max-w-lg">אין תורים קיימים</div>
      )}

      <div className="grid gap-3 max-w-lg">
        {list.map((a) => (
          <div key={a.id} className="bg-white p-4 rounded shadow">
            <div>תאריך: {a.date}</div>
            <div>שעה: {a.time}</div>
            <div>ספר: {a.barberName}</div>

            {/* צעד 3: לחיצה על כפתור שינוי ובחירת תאריך חדש */}
            {selected?.id !== a.id ? (
              <button onClick={() => { setSelected(a); setDate(""); setError(""); setMessage(""); }}
                      className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded">
                שינוי
              </button>
            ) : (
              <div className="mt-3 border-t pt-3">
                <label className="block mb-1">בחירת תאריך חדש</label>
                <input type="date" value={date} min={today}
                       onChange={(e) => setDate(e.target.value)}
                       className="w-full border rounded p-2 mb-3" />

                {slots.length > 0 && (
                  <>
                    <label className="block mb-2">תורים פנויים</label>
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((t) => (
                        <button key={t} onClick={() => save(t)}
                                className="border rounded p-2 hover:bg-yellow-100">
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <button onClick={() => { setSelected(null); setDate(""); setSlots([]); setError(""); }}
                        className="mt-3 text-blue-600 underline">
                  ביטול השינוי
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
