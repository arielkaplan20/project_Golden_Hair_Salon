// סדר העבודה של נותן שירות: סדר שבועי קבוע ושינויים לתאריכים מסוימים (SUC-9)
const { dayOfWeek } = require("./dates");

// ברירת המחדל לספר חדש: ראשון עד חמישי, 09:00-19:00
function defaultWeek() {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day, active: day <= 4, startHour: "09:00", endHour: "19:00"
  }));
}

// סדר העבודה השבועי של הספר, 7 ימים מראשון עד שבת.
// רשומה ישנה (ימי עבודה ושעות אחידות לכולם) מתורגמת לסדר שבועי עם אותן שעות בכל יום
function weeklyOf(sp) {
  if (sp.weeklySchedule && sp.weeklySchedule.length === 7) {
    return sp.weeklySchedule.map((d) => ({
      day: d.day, active: d.active, startHour: d.startHour, endHour: d.endHour
    }));
  }
  if (sp.workDays && sp.workDays.length > 0) {
    return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      active: sp.workDays.includes(day),
      startHour: sp.startHour || "09:00",
      endHour: sp.endHour || "19:00"
    }));
  }
  return defaultWeek();
}

// שעות העבודה של הספר בתאריך מסוים. שינוי לתאריך קודם לסדר השבועי.
// מחזיר null כשהספר לא עובד באותו יום
function hoursForDate(sp, date) {
  const slotMinutes = sp.slotMinutes || 30;
  const exception = (sp.exceptions || []).find((e) => e.date === date);
  if (exception) {
    if (exception.off) return null;
    return { startHour: exception.startHour, endHour: exception.endHour, slotMinutes };
  }
  const day = weeklyOf(sp).find((d) => d.day === dayOfWeek(date));
  if (!day || !day.active) return null;
  return { startHour: day.startHour, endHour: day.endHour, slotMinutes };
}

module.exports = { defaultWeek, weeklyOf, hoursForDate };
