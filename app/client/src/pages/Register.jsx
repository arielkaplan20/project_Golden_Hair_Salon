// SUC-1: הרשמה לאפליקציה
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", address: "",
    birthDate: "", password: "", confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await api.post("/auth/register", form);
      setSuccess("ההרשמה בוצעה בהצלחה, מעבירים אותך לדף הכניסה");
      setTimeout(() => navigate("/login"), 1500);     // צעד 4: מעבר לדף הכניסה
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהרשמה");
    }
  }

  const fields = [
    { name: "firstName", label: "שם פרטי", type: "text" },
    { name: "lastName", label: "שם משפחה", type: "text" },
    { name: "email", label: "כתובת מייל", type: "email" },
    { name: "address", label: "כתובת מגורים", type: "text" },
    { name: "birthDate", label: "תאריך לידה", type: "date" },
    { name: "password", label: "סיסמה", type: "password" },
    { name: "confirmPassword", label: "אימות סיסמה", type: "password" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">GOLDEN HAIR SALON</h1>
        <h2 className="text-lg mb-4">הרשמה למערכת</h2>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{success}</div>}

        {fields.map((f) => (
          <div key={f.name}>
            <label className="block mb-1">{f.label}</label>
            <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                   className="w-full border rounded p-2 mb-3" />
          </div>
        ))}

        <button type="submit" className="w-full bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700">
          סיום הרשמה
        </button>

        <p className="text-center mt-4">
          כבר רשום? <Link to="/login" className="text-blue-600 underline">לכניסה</Link>
        </p>
      </form>
    </div>
  );
}
