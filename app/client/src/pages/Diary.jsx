// SUC-9 צעדים 1-4: יומן התורים של נותן השירות
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Diary() {
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  // צעד 2: שליפת התורים שנקבעו לנותן השירות המחובר בלבד
  useEffect(() => {
    api.get("/schedule/diary").then((res) => {
      setList(res.data);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>
      <h1 className="text-2xl font-bold mb-6">יומן תורים</h1>

      {/* הסתעפות א': לא נקבעו תורים, וממשיכים לצעד 4 */}
      {loaded && list.length === 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded max-w-lg mb-4">
          לא נקבעו תורים עדיין
        </div>
      )}

      {/* צעד 3: הצגת פירוט התורים הקיימים */}
      {list.length > 0 && (
        <table className="bg-white rounded shadow mb-4 w-full max-w-lg text-right">
          <thead>
            <tr className="bg-yellow-100">
              <th className="p-2">תאריך</th>
              <th className="p-2">שעה</th>
              <th className="p-2">לקוח</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.date}</td>
                <td className="p-2">{a.time}</td>
                <td className="p-2">{a.clientName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* צעד 4: מעבר לעריכת ימי ושעות העבודה */}
      <button onClick={() => navigate("/work-hours")}
              className="bg-yellow-600 text-white px-4 py-2 rounded">
        עריכת ימי ושעות עבודה
      </button>
    </div>
  );
}
