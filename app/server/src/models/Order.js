// מחלקות Order ו-OrderItem: הזמנה בחנות
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },   // שומרים גם שם ומחיר בזמן ההזמנה
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: [orderItemSchema], required: true },
  deliveryType: { type: String, enum: ["pickup", "delivery"], required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  pickupPoint: { type: String, default: "" },   // באיסוף עצמי
  address: { type: String, default: "" },       // במשלוח
  notes: { type: String, default: "" },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["new", "done"], default: "new" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
