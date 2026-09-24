// רכיבי הניהול של המנהל הראשי - משתמשים והרשאות (SUC-10) וכלל התורים (SUC-11)
const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const Appointment = require("../models/Appointment");

// צעד 2 ב-SUC-10: שליפת רשימת המשתמשים
async function getUsers(req, res) {
  const users = await User.find().select("-passwordHash").sort({ firstName: 1 });
  res.json(users.map((u) => ({
    id: u._id,
    name: u.firstName + " " + u.lastName,
    email: u.email,
    role: u.role
  })));
}

// צעדים 3-7 ב-SUC-10: עדכון ההרשאה של המשתמש
async function updateRole(req, res) {
  try {
    const { role } = req.body;
    if (!["client", "barber", "admin"].includes(role)) {
      return res.status(400).json({ message: "הרשאה לא תקינה" });
    }
    // המנהל הראשי לא יכול להוריד לעצמו את ההרשאה, כדי שלא תיווצר מערכת בלי מנהל
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "אי אפשר לשנות את ההרשאה של המשתמש המחובר" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "המשתמש לא נמצא" });

    user.role = role;
    await user.save();

    // ספר חייב לוח עבודה, כדי שלקוחות יוכלו להזמין אצלו תור
    if (role === "barber" || role === "admin") {
      const exists = await ServiceProvider.findOne({ userId: user._id });
      if (!exists) await ServiceProvider.create({ userId: user._id });
    }

    res.json({ message: "ההרשאה עודכנה בהצלחה" });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// צעדים 2-3 ב-SUC-11: שליפת כלל התורים במערכת
async function getAllAppointments(req, res) {
  const list = await Appointment.find()
    .populate("clientId", "firstName lastName")
    .populate({ path: "barberId", populate: { path: "userId", select: "firstName lastName" } })
    .sort({ date: 1, time: 1 });

  res.json(list.map((a) => ({
    id: a._id,
    date: a.date,
    time: a.time,
    status: a.status,
    clientName: a.clientId ? a.clientId.firstName + " " + a.clientId.lastName : "לקוח",
    barberName: a.barberId && a.barberId.userId
      ? a.barberId.userId.firstName + " " + a.barberId.userId.lastName : "ספר"
  })));
}

module.exports = { getUsers, updateRole, getAllAppointments };
