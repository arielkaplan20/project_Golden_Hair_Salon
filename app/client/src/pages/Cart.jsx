// SUC-7 צעד 2: הסל שלי
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, removeFromCart, cartTotal } from "../cart";

export default function Cart() {
  const [cart, setCart] = useState(getCart());
  const navigate = useNavigate();

  function remove(productId) {
    removeFromCart(productId);
    setCart(getCart());
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/shop")} className="mb-4 text-blue-600 underline">
        חזרה לחנות
      </button>
      <h1 className="text-2xl font-bold mb-6">הסל שלי</h1>

      {/* הסתעפות א': הסל ריק */}
      {cart.length === 0 ? (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded max-w-lg">הסל שלך ריק</div>
      ) : (
        <div className="bg-white p-6 rounded shadow max-w-lg">
          <table className="w-full text-right mb-4">
            <thead>
              <tr className="bg-yellow-100">
                <th className="p-2">מוצר</th>
                <th className="p-2">כמות</th>
                <th className="p-2">מחיר</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((c) => (
                <tr key={c.productId} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.quantity}</td>
                  <td className="p-2">{c.price * c.quantity} ש"ח</td>
                  <td className="p-2">
                    <button onClick={() => remove(c.productId)} className="text-red-600 underline">
                      הסרה
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="font-bold mb-4">סך הכל לתשלום: {cartTotal(cart)} ש"ח</p>

          <button onClick={() => navigate("/checkout")}
                  className="bg-yellow-600 text-white px-4 py-2 rounded">
            סיום ותשלום
          </button>
        </div>
      )}
    </div>
  );
}
