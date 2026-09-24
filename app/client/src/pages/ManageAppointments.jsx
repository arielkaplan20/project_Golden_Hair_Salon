// SUC-11: ניהול תורים כולל
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const STATUS = { booked: "נקבע", cancelled: "בוטל", done: "הושלם" };

export default function ManageAppointments() {
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  // צעד 2: שליפת כלל התורים במערכת
  useEffect(() => {
    api.get("/admin/appointments").then((res) => {
      setList(res.data);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">ניהול תורים כולל</h1>

      {/* הסתעפות א': לא קיימים תורים במערכת */}
      {loaded && list.length === 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded">אין תורים קיימים במערכת</div>
      )}

      {/* צעד 3: הצגת פירוט כלל התורים */}
      {list.length > 0 && (
        <table className="bg-white rounded shadow w-full text-right">
          <thead>
            <tr className="bg-yellow-100">
              <th className="p-2">תאריך</th>
              <th className="p-2">שעה</th>
              <th className="p-2">לקוח</th>
              <th className="p-2">ספר</th>
              <th className="p-2">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.date}</td>
                <td className="p-2">{a.time}</td>
                <td className="p-2">{a.clientName}</td>
                <td className="p-2">{a.barberName}</td>
                <td className="p-2">{STATUS[a.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
