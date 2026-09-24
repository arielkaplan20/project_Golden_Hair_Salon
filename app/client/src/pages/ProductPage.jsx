// דף מוצר: פירוט מלא של מוצר בודד מהחנות
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { addToCart } from "../cart";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/shop/products/" + id).then((res) => setProduct(res.data));
  }, [id]);

  function add() {
    addToCart(product, Number(quantity));
    setMessage("המוצר נוסף לסל");
  }

  if (!product) return <div className="min-h-screen p-6 max-w-5xl mx-auto">טוען...</div>;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate("/shop")} className="mb-4 text-blue-600 underline">
        חזרה לחנות
      </button>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3 max-w-lg">{message}</div>}

      <div className="bg-white p-6 rounded shadow max-w-lg">
        <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
        <p className="text-gray-600 mb-4">{product.description}</p>

        <p className="mb-2">מחיר: {product.price} ש"ח</p>
        <p className="mb-4 text-gray-600">
          {product.stock > 0 ? "במלאי: " + product.stock + " יחידות" : "המוצר אזל מהמלאי"}
        </p>

        <label className="block mb-1">כמות</label>
        <input type="number" min="1" max={product.stock} value={quantity}
               onChange={(e) => setQuantity(e.target.value)}
               className="border rounded p-2 w-24 mb-4 block" />

        <button onClick={add} disabled={product.stock === 0}
                className="bg-yellow-600 text-white px-4 py-2 rounded disabled:bg-gray-400 ml-2">
          הוסף לסל
        </button>
        <button onClick={() => navigate("/cart")} className="border px-4 py-2 rounded">
          מעבר לסל
        </button>
      </div>
    </div>
  );
}
