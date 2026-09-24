// SUC-4: צפייה בתורים קיימים
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function MyAppointments() {
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  // צעד 2: המערכת שולפת את התורים העתידיים של הלקוח
  useEffect(() => {
    api.get("/appointments/my").then((res) => {
      setList(res.data);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">התורים שלי</h1>

      {/* הסתעפות א': לא קיימים תורים עבור הלקוח */}
      {loaded && list.length === 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded max-w-lg">אין תורים קיימים</div>
      )}

      {/* צעד 3: הצגת פירוט התורים הקיימים */}
      <div className="grid gap-3 max-w-lg">
        {list.map((a) => (
          <div key={a.id} className="bg-white p-4 rounded shadow">
            <div>תאריך: {a.date}</div>
            <div>שעה: {a.time}</div>
            <div>ספר: {a.barberName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
