import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import ChangeAppointment from "./pages/ChangeAppointment";
import CancelAppointment from "./pages/CancelAppointment";
import Diary from "./pages/Diary";
import WorkHours from "./pages/WorkHours";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ManageUsers from "./pages/ManageUsers";
import ManageAppointments from "./pages/ManageAppointments";
import ManageShop from "./pages/ManageShop";
import MyOrders from "./pages/MyOrders";
import ProductPage from "./pages/ProductPage";
import { getUser } from "./auth";

// דף שמוגן: אם אין משתמש מחובר, חוזרים לדף הכניסה
function Protected({ children }) {
  return getUser() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/book" element={<Protected><BookAppointment /></Protected>} />
      <Route path="/my" element={<Protected><MyAppointments /></Protected>} />
      <Route path="/change" element={<Protected><ChangeAppointment /></Protected>} />
      <Route path="/cancel" element={<Protected><CancelAppointment /></Protected>} />
      <Route path="/diary" element={<Protected><Diary /></Protected>} />
      <Route path="/work-hours" element={<Protected><WorkHours /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/shop" element={<Protected><Shop /></Protected>} />
      <Route path="/cart" element={<Protected><Cart /></Protected>} />
      <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
      <Route path="/manage-users" element={<Protected><ManageUsers /></Protected>} />
      <Route path="/manage-appointments" element={<Protected><ManageAppointments /></Protected>} />
      <Route path="/manage-shop" element={<Protected><ManageShop /></Protected>} />
      <Route path="/my-orders" element={<Protected><MyOrders /></Protected>} />
      <Route path="/product/:id" element={<Protected><ProductPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
