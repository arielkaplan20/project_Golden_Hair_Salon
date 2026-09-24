// נותן שירות (ספר) + לוח העבודה שלו - מחלקות Barber ו-WorkSchedule
const mongoose = require("mongoose");

const serviceProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  workDays: { type: [Number], default: [0, 1, 2, 3, 4] },  // 0=ראשון ... 6=שבת
  startHour: { type: String, default: "09:00" },
  endHour: { type: String, default: "19:00" },
  slotMinutes: { type: Number, default: 30 }               // אורך תור בדקות
}, { timestamps: true });

module.exports = mongoose.model("ServiceProvider", serviceProviderSchema);
