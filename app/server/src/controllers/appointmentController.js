// רכיב Appointments Manager - הזמנה, צפייה, שינוי וביטול תור (SUC-3 עד SUC-6)
const Appointment = require("../models/Appointment");
const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");
const { todayString, dayOfWeek } = require("../utils/dates");

// הופך "09:30" למספר דקות מתחילת היום, וההפך
function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return h + ":" + m;
}

// האלגוריתם: מחשב את התורים הפנויים מתוך שעות העבודה פחות התורים התפוסים
function calcFreeSlots(schedule, bookedList) {
  const slots = [];
  const start = toMinutes(schedule.startHour);
  const end = toMinutes(schedule.endHour);
  for (let t = start; t + schedule.slotMinutes <= end; t += schedule.slotMinutes) {
    const time = toTime(t);
    if (!bookedList.includes(time)) {
      slots.push(time);
    }
  }
  return slots;
}

// רשימת הספרים במספרה - צעד 1 ב-SUC-3
async function getBarbers(req, res) {
  const barbers = await ServiceProvider.find().populate("userId", "firstName lastName");
  res.json(barbers.map((b) => ({
    id: b._id,
    name: b.userId ? b.userId.firstName + " " + b.userId.lastName : "ספר",
    workDays: b.workDays
  })));
}

// שעות פנויות לתאריך שנבחר - צעדים 2 ו-3 ב-SUC-3
async function getFreeSlots(req, res) {
  try {
    const { barberId, date } = req.query;
    const barber = await ServiceProvider.findById(barberId);
    if (!barber) return res.status(404).json({ message: "הספר לא נמצא" });

    // הספר לא עובד ביום הזה
    const day = dayOfWeek(date);
    if (!barber.workDays.includes(day)) {
      return res.json({ slots: [] });
    }

    const booked = await Appointment.find({ barberId, date, status: "booked" });
    const bookedTimes = booked.map((a) => a.time);
    res.json({ slots: calcFreeSlots(barber, bookedTimes) });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// הזמנת תור - צעדים 4 ו-5 ב-SUC-3
async function bookAppointment(req, res) {
  try {
    const { barberId, date, time } = req.body;
    if (!barberId || !date || !time) {
      return res.status(400).json({ message: "יש לבחור ספר, תאריך ושעה" });
    }

    // בדיקה שהשעה עדיין פנויה (שלא נתפסה בינתיים על ידי לקוח אחר)
    const taken = await Appointment.findOne({ barberId, date, time, status: "booked" });
    if (taken) {
      return res.status(400).json({ message: "התור כבר נתפס, יש לבחור שעה אחרת" });
    }

    await Appointment.create({ clientId: req.user.id, barberId, date, time });
    res.status(201).json({ message: "התור נקבע בהצלחה" });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// התורים של הלקוח המחובר - SUC-4
async function myAppointments(req, res) {
  // רק תורים עתידיים: התאריך שמור בתבנית YYYY-MM-DD ולכן אפשר להשוות אותו כמחרוזת
  const today = todayString();
  const list = await Appointment.find({ clientId: req.user.id, status: "booked", date: { $gte: today } })
    .populate({ path: "barberId", populate: { path: "userId", select: "firstName lastName" } })
    .sort({ date: 1, time: 1 });

  res.json(list.map((a) => ({
    id: a._id,
    date: a.date,
    time: a.time,
    barberId: a.barberId ? a.barberId._id : null,
    barberName: a.barberId && a.barberId.userId
      ? a.barberId.userId.firstName + " " + a.barberId.userId.lastName : "ספר"
  })));
}

// שינוי תור - SUC-5
async function changeAppointment(req, res) {
  try {
    const { date, time } = req.body;
    const appt = await Appointment.findOne({ _id: req.params.id, clientId: req.user.id });
    if (!appt) return res.status(404).json({ message: "התור לא נמצא" });

    const taken = await Appointment.findOne({
      barberId: appt.barberId, date, time, status: "booked", _id: { $ne: appt._id }
    });
    if (taken) return res.status(400).json({ message: "התור כבר נתפס, יש לבחור שעה אחרת" });

    appt.date = date;      // המועד הישן מתפנה אוטומטית לכלל הלקוחות
    appt.time = time;
    await appt.save();
    res.json({ message: "התור עודכן בהצלחה" });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// ביטול תור - SUC-6
async function cancelAppointment(req, res) {
  const appt = await Appointment.findOne({ _id: req.params.id, clientId: req.user.id });
  if (!appt) return res.status(404).json({ message: "התור לא נמצא" });

  appt.status = "cancelled";   // המועד מתפנה לשאר הלקוחות
  await appt.save();
  res.json({ message: "התור בוטל בהצלחה" });
}

module.exports = { getBarbers, getFreeSlots, bookAppointment, myAppointments, changeAppointment, cancelAppointment, calcFreeSlots };
