// נותן שירות (ספר) + לוח העבודה שלו - מחלקות Barber ו-WorkSchedule
const mongoose = require("mongoose");

// יום אחד בסדר העבודה השבועי הקבוע
const dayScheduleSchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6, required: true },   // 0=ראשון ... 6=שבת
  active: { type: Boolean, default: false },               // האם הספר עובד ביום הזה
  startHour: { type: String, default: "09:00" },
  endHour: { type: String, default: "19:00" }
}, { _id: false });

// שינוי לתאריך מסוים: יום חופש, או שעות אחרות לאותו יום בלבד
const exceptionSchema = new mongoose.Schema({
  date: { type: String, required: true },   // תאריך בפורמט YYYY-MM-DD
  off: { type: Boolean, default: false },
  startHour: { type: String, default: "" },
  endHour: { type: String, default: "" }
}, { _id: false });

const serviceProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  weeklySchedule: { type: [dayScheduleSchema], default: undefined },   // 7 ימים, ראשון עד שבת
  exceptions: { type: [exceptionSchema], default: [] },
  slotMinutes: { type: Number, default: 30 },                          // אורך תור בדקות

  // המבנה הקודם: ימי עבודה ושעות אחידות לכולם. נשמר רק כדי לקרוא רשומות ישנות,
  // ומתורגם לסדר שבועי ב-utils/workSchedule.js
  workDays: { type: [Number], default: undefined },
  startHour: String,
  endHour: String
}, { timestamps: true });

module.exports = mongoose.model("ServiceProvider", serviceProviderSchema);
