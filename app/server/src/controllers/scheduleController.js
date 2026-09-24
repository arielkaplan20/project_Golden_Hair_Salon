// רכיב Schedule Manager - יומן התורים של נותן השירות ועריכת ימי ושעות העבודה (SUC-9)
const Appointment = require("../models/Appointment");
const ServiceProvider = require("../models/ServiceProvider");

// מאתר את רשומת נותן השירות של המשתמש המחובר
async function findMe(userId) {
  return await ServiceProvider.findOne({ userId });
}

// צעדים 2-3: שליפת התורים שנקבעו לנותן השירות המחובר בלבד
async function getDiary(req, res) {
  try {
    const me = await findMe(req.user.id);
    if (!me) return res.status(404).json({ message: "לא נמצאה רשומת נותן שירות" });

    const list = await Appointment.find({ barberId: me._id, status: "booked" })
      .populate("clientId", "firstName lastName")
      .sort({ date: 1, time: 1 });

    res.json(list.map((a) => ({
      id: a._id,
      date: a.date,
      time: a.time,
      clientName: a.clientId ? a.clientId.firstName + " " + a.clientId.lastName : "לקוח"
    })));
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// שליפת ימי ושעות העבודה הנוכחיים לטופס העריכה
async function getMySchedule(req, res) {
  const me = await findMe(req.user.id);
  if (!me) return res.status(404).json({ message: "לא נמצאה רשומת נותן שירות" });
  res.json({ workDays: me.workDays, startHour: me.startHour, endHour: me.endHour });
}

// הופך "09:30" למספר דקות, לצורך בדיקת תקינות השעות
function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// צעדים 5-7: עדכון ימי ושעות העבודה אחרי בדיקת תקינות
async function updateMySchedule(req, res) {
  try {
    const { workDays, startHour, endHour } = req.body;

    // הסתעפות ג': שדות חסרים או שעות לא תקינות
    if (!startHour || !endHour || !Array.isArray(workDays)) {
      return res.status(400).json({ message: "יש למלא את כל השדות" });
    }
    if (workDays.length === 0) {
      return res.status(400).json({ message: "יש לבחור לפחות יום עבודה אחד" });
    }
    if (toMinutes(endHour) <= toMinutes(startHour)) {
      return res.status(400).json({ message: "שעת הסיום חייבת להיות מאוחרת משעת ההתחלה" });
    }

    const me = await findMe(req.user.id);
    if (!me) return res.status(404).json({ message: "לא נמצאה רשומת נותן שירות" });

    me.workDays = workDays;
    me.startHour = startHour;
    me.endHour = endHour;
    await me.save();

    res.json({ message: "ימי ושעות העבודה עודכנו בהצלחה" });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

module.exports = { getDiary, getMySchedule, updateMySchedule };
