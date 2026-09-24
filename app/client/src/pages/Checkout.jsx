// SUC-7 צעדים 3-6: אופן קבלה, פרטי הזמנה, תשלום ואישור
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getCart, clearCart, cartTotal } from "../cart";

const PICKUP_POINTS = ["סניף אשקלון - הרצל 10", "סניף אשדוד - רוגוזין 5", "סניף באר שבע - רגר 20"];

export default function Checkout() {
  const [cart] = useState(getCart());
  const [step, setStep] = useState(1);          // 1 = פרטי הזמנה, 2 = תשלום, 3 = אישור
  const [order, setOrder] = useState(null);     // תוצאת ההזמנה: מספר הזמנה וסכום
  const [form, setForm] = useState({
    deliveryType: "pickup", fullName: "", phone: "", email: "",
    pickupPoint: PICKUP_POINTS[0], address: "", notes: ""
  });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function changeCard(e) {
    setCard({ ...card, [e.target.name]: e.target.value });
  }

  // צעדים 3-4: אופן הקבלה ופרטי ההזמנה
  function toPayment(e) {
    e.preventDefault();
    setError("");
    setStep(2);
  }

  // צעדים 5-6: תשלום, שמירת ההזמנה וקבלת מספר הזמנה
  async function pay(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/shop/orders", { ...form, card, items: cart });
      clearCart();
      setOrder(res.data);
      setStep(3);
    } catch (err) {
      // הסתעפות ב': תשלום נכשל, נשארים בדף התשלום
      setError(err.response?.data?.message || "שגיאה בביצוע ההזמנה");
    }
  }

  // הסתעפות א': אי אפשר להגיע לתשלום עם סל ריק
  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen p-6 max-w-5xl mx-auto">
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded max-w-lg mb-4">הסל שלך ריק</div>
        <button onClick={() => navigate("/shop")} className="bg-yellow-600 text-white px-4 py-2 rounded">
          חזרה לחנות
        </button>
      </div>
    );
  }

  // צעד 6: הודעת אישור כולל מספר הזמנה
  if (step === 3) {
    return (
      <div className="min-h-screen p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">ההזמנה בוצעה בהצלחה</h1>
        <div className="bg-white p-6 rounded shadow max-w-lg">
          <p className="mb-2">מספר ההזמנה שלך: <span className="font-bold">{order.orderNumber}</span></p>
          <p className="mb-4">סכום ההזמנה: {order.totalPrice} ש"ח</p>
          <button onClick={() => navigate("/")} className="bg-yellow-600 text-white px-4 py-2 rounded">
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/cart")} className="mb-4 text-blue-600 underline">
        חזרה לסל
      </button>
      <h1 className="text-2xl font-bold mb-6">סיום ותשלום</h1>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 max-w-lg">{error}</div>}

      <div className="bg-white p-6 rounded shadow max-w-lg">
        <p className="font-bold mb-4">סך הכל לתשלום: {cartTotal(cart)} ש"ח</p>

        {step === 1 ? (
          <form onSubmit={toPayment}>
            {/* צעד 3: בחירת אופן הקבלה */}
            <label className="block mb-2">אופן קבלה</label>
            <label className="block">
              <input type="radio" name="deliveryType" value="pickup" className="ml-2"
                     checked={form.deliveryType === "pickup"} onChange={change} />
              איסוף עצמי
            </label>
            <label className="block mb-4">
              <input type="radio" name="deliveryType" value="delivery" className="ml-2"
                     checked={form.deliveryType === "delivery"} onChange={change} />
              משלוח
            </label>

            {/* צעד 4: פרטי ההזמנה */}
            <label className="block mb-1">שם מלא</label>
            <input name="fullName" value={form.fullName} onChange={change} required
                   className="w-full border rounded p-2 mb-3" />

            <label className="block mb-1">טלפון</label>
            <input name="phone" value={form.phone} onChange={change} required
                   className="w-full border rounded p-2 mb-3" />

            <label className="block mb-1">דוא"ל</label>
            <input type="email" name="email" value={form.email} onChange={change} required
                   className="w-full border rounded p-2 mb-3" />

            {form.deliveryType === "pickup" ? (
              <>
                <label className="block mb-1">נקודת איסוף</label>
                <select name="pickupPoint" value={form.pickupPoint} onChange={change}
                        className="w-full border rounded p-2 mb-3">
                  {PICKUP_POINTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </>
            ) : (
              <>
                <label className="block mb-1">כתובת למשלוח</label>
                <input name="address" value={form.address} onChange={change} required
                       className="w-full border rounded p-2 mb-3" />
              </>
            )}

            <label className="block mb-1">הערות להזמנה</label>
            <textarea name="notes" value={form.notes} onChange={change}
                      className="w-full border rounded p-2 mb-4" />

            <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
              מעבר לתשלום
            </button>
          </form>
        ) : (
          /* צעד 5: דף התשלום */
          <form onSubmit={pay}>
            <h2 className="font-bold mb-3">פרטי תשלום</h2>

            <label className="block mb-1">מספר כרטיס אשראי</label>
            <input name="number" value={card.number} onChange={changeCard} placeholder="16 ספרות"
                   className="w-full border rounded p-2 mb-3" />

            <label className="block mb-1">תוקף</label>
            <input name="expiry" value={card.expiry} onChange={changeCard} placeholder="MM/YY"
                   className="w-full border rounded p-2 mb-3" />

            <label className="block mb-1">CVV</label>
            <input name="cvv" value={card.cvv} onChange={changeCard} placeholder="3 ספרות"
                   className="w-full border rounded p-2 mb-4" />

            <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded ml-2">
              אישור תשלום
            </button>
            <button type="button" onClick={() => setStep(1)} className="border px-4 py-2 rounded">
              חזרה לפרטי ההזמנה
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
