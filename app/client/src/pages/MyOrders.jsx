// דרישה 22: צפייה בהזמנות קודמות וביצוע הזמנה חוזרת
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { saveCart } from "../cart";

const DELIVERY = { pickup: "איסוף עצמי", delivery: "משלוח" };

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/shop/orders/my").then((res) => {
      setOrders(res.data);
      setLoaded(true);
    });
  }, []);

  // הזמנה חוזרת: המוצרים של ההזמנה הקודמת נכנסים לסל והלקוח עובר לסל
  function reorder(order) {
    saveCart(order.items.map((i) => ({
      productId: i.productId, name: i.name, price: i.price, quantity: i.quantity
    })));
    navigate("/cart");
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/shop")} className="mb-4 text-blue-600 underline">
        חזרה לחנות
      </button>
      <h1 className="text-2xl font-bold mb-6">ההזמנות שלי</h1>

      {loaded && orders.length === 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded max-w-lg">אין הזמנות קודמות</div>
      )}

      <div className="grid gap-3 max-w-lg">
        {orders.map((o) => (
          <div key={o._id} className="bg-white p-4 rounded shadow">
            <div className="font-bold mb-1">הזמנה מספר {o.orderNumber}</div>
            <div>אופן קבלה: {DELIVERY[o.deliveryType]}</div>
            <div>סכום: {o.totalPrice} ש"ח</div>
            <ul className="list-disc mr-5 my-2">
              {o.items.map((i) => (
                <li key={i.productId}>{i.name} — {i.quantity} יחידות</li>
              ))}
            </ul>
            <button onClick={() => reorder(o)} className="bg-yellow-600 text-white px-3 py-1 rounded">
              הזמנה חוזרת
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
