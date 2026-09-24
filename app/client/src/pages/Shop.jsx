// SUC-7 צעד 1: חנות המוצרים
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { addToCart, getCart } from "../cart";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});   // הכמות שנבחרה לכל מוצר
  const [count, setCount] = useState(getCart().length);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/shop/products").then((res) => setProducts(res.data));
  }, []);

  function add(product) {
    const quantity = Number(quantities[product._id] || 1);
    addToCart(product, quantity);
    setCount(getCart().length);
    setMessage("המוצר " + product.name + " נוסף לסל");
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/")} className="mb-4 text-blue-600 underline">
        חזרה לדף הבית
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">חנות</h1>
        <div>
          <button onClick={() => navigate("/my-orders")} className="border px-4 py-2 rounded ml-2">
            ההזמנות שלי
          </button>
          <button onClick={() => navigate("/cart")} className="bg-yellow-600 text-white px-4 py-2 rounded">
            הסל שלי ({count})
          </button>
        </div>
      </div>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{message}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p._id} className="bg-white p-4 rounded shadow">
            <h2 onClick={() => navigate("/product/" + p._id)}
                className="font-bold text-lg text-blue-700 cursor-pointer hover:underline">
              {p.name}
            </h2>
            <p className="text-gray-600 mb-2">{p.description}</p>
            <p className="mb-2">מחיר: {p.price} ש"ח</p>
            <p className="mb-2 text-gray-600">במלאי: {p.stock}</p>

            <input type="number" min="1" max={p.stock}
                   value={quantities[p._id] || 1}
                   onChange={(e) => setQuantities({ ...quantities, [p._id]: e.target.value })}
                   className="border rounded p-1 w-20 ml-2" />

            <button onClick={() => add(p)} disabled={p.stock === 0}
                    className="bg-yellow-600 text-white px-3 py-1 rounded disabled:bg-gray-400">
              {p.stock === 0 ? "אזל מהמלאי" : "הוסף לסל"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
