// SUC-6: ביטול תור
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CancelAppointment() {
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(null);   // התור שממתין לאישור ביטול
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // צעד 2: הצגת התורים הקיימים של הלקוח
  function loadList() {
    api.get("/appointments/my").then((res) => {
      setList(res.data);
      setLoaded(true);
    });
  }
  useEffect(loadList, []);

  // צעדים 6-7: ביטול התור במסד הנתונים והצגת הודעת אישור
  async function doCancel() {
    setError(""); setMessage("");
    try {
      await api.delete("/appointments/" + confirming.id);
      setMessage("התור בתאריך " + confirming.date + " בשעה " + confirming.time + " בוטל בהצלחה");
      setConfirming(null);
      loadList();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בביטול התור");
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">ביטול תור</h1>

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

            {/* צעד 3: לחיצה על כפתור ביטול תור */}
            <button onClick={() => { setConfirming(a); setMessage(""); setError(""); }}
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded">
              ביטול תור
            </button>
          </div>
        ))}
      </div>

      {/* צעדים 4-5: חלון אישור הביטול. הסתעפות ב': לחיצה על "לא" מסיימת ללא שינוי */}
      {confirming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow max-w-sm text-center">
            <p className="mb-4">
              האם אתה בטוח שברצונך לבטל את התור בתאריך {confirming.date} בשעה {confirming.time}?
            </p>
            <button onClick={doCancel} className="bg-red-600 text-white px-4 py-1 rounded ml-2">
              כן
            </button>
            <button onClick={() => setConfirming(null)} className="border px-4 py-1 rounded">
              לא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
