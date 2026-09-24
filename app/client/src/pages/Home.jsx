// דף הבית - התפריט משתנה לפי ההרשאה (לקוח / ספר / מנהל ראשי)
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";

// לאן כל כפתור מוביל
const LINKS = {
  "הזמנת תור": "/book",
  "התורים שלי": "/my",
  "שינוי תור": "/change",
  "ביטול תור": "/cancel",
  "יומן תורים": "/diary",
  "עריכת ימי ושעות עבודה": "/work-hours",
  "הפרופיל שלי": "/profile",
  "חנות": "/shop",
  "ניהול משתמשים והרשאות": "/manage-users",
  "ניהול תורים כולל": "/manage-appointments",
  "ניהול החנות וההזמנות": "/manage-shop",
};

const MENUS = {
  client: ["הזמנת תור", "התורים שלי", "שינוי תור", "ביטול תור", "חנות", "הפרופיל שלי"],
  barber: ["יומן תורים", "עריכת ימי ושעות עבודה", "הפרופיל שלי"],
  // המנהל הראשי משמש גם כנותן שירות, ולכן זמינים לו גם מסכי הספר
  admin: ["ניהול משתמשים והרשאות", "ניהול תורים כולל", "ניהול החנות וההזמנות",
          "יומן תורים", "עריכת ימי ושעות עבודה", "הפרופיל שלי"],
};

export default function Home() {
  const user = getUser();
  const navigate = useNavigate();
  const items = MENUS[user.role] || MENUS.client;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <div className="bg-yellow-600 text-white p-4 flex justify-between items-center">
        <span className="font-bold text-xl">GOLDEN HAIR SALON</span>
        <button onClick={handleLogout} className="bg-white text-yellow-700 px-3 py-1 rounded">
          התנתקות
        </button>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl mb-6">שלום {user.firstName}</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <button key={item}
                    onClick={() => LINKS[item] && navigate(LINKS[item])}
                    className="bg-white p-6 rounded shadow text-lg hover:bg-yellow-50">
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
