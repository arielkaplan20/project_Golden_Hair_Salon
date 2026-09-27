// בדיקות יחידה לסדר העבודה של הספר (SUC-9): סדר שבועי, שינויים לתאריכים
// ובדיקת התנגשות עם תורים שכבר נקבעו. נבדק במנותק מהשרת וממסד הנתונים.
const test = require("node:test");
const assert = require("node:assert");
const { weeklyOf, hoursForDate } = require("../src/utils/workSchedule");
const { findConflicts } = require("../src/controllers/scheduleController");

// ראשון עד חמישי 09:00-19:00, שישי 08:00-13:00, שבת חופש
const week = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  active: day !== 6,
  startHour: day === 5 ? "08:00" : "09:00",
  endHour: day === 5 ? "13:00" : "19:00"
}));
const barber = { weeklySchedule: week, exceptions: [], slotMinutes: 30 };

// 2026-10-04 הוא יום ראשון, 2026-10-09 יום שישי, 2026-10-10 שבת
test("יום עבודה רגיל מקבל את השעות של אותו יום בסדר השבועי", () => {
  assert.deepStrictEqual(hoursForDate(barber, "2026-10-04"), { startHour: "09:00", endHour: "19:00", slotMinutes: 30 });
  assert.deepStrictEqual(hoursForDate(barber, "2026-10-09"), { startHour: "08:00", endHour: "13:00", slotMinutes: 30 });
});

test("יום שאינו יום עבודה מחזיר null", () => {
  assert.strictEqual(hoursForDate(barber, "2026-10-10"), null);
});

test("שינוי לתאריך קודם לסדר השבועי", () => {
  const sp = { ...barber, exceptions: [
    { date: "2026-10-04", off: true },
    { date: "2026-10-05", off: false, startHour: "12:00", endHour: "16:00" },
    { date: "2026-10-10", off: false, startHour: "10:00", endHour: "12:00" }
  ] };
  assert.strictEqual(hoursForDate(sp, "2026-10-04"), null);
  assert.deepStrictEqual(hoursForDate(sp, "2026-10-05"), { startHour: "12:00", endHour: "16:00", slotMinutes: 30 });
  assert.deepStrictEqual(hoursForDate(sp, "2026-10-10"), { startHour: "10:00", endHour: "12:00", slotMinutes: 30 });
  assert.deepStrictEqual(hoursForDate(sp, "2026-10-06"), { startHour: "09:00", endHour: "19:00", slotMinutes: 30 });
});

test("רשומה במבנה הקודם מתורגמת לסדר שבועי עם שעות אחידות", () => {
  const old = { workDays: [0, 1, 2, 3, 4], startHour: "10:00", endHour: "18:00", slotMinutes: 30 };
  const w = weeklyOf(old);
  assert.strictEqual(w.length, 7);
  assert.deepStrictEqual(w.filter((d) => d.active).map((d) => d.day), [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(hoursForDate(old, "2026-10-04"), { startHour: "10:00", endHour: "18:00", slotMinutes: 30 });
  assert.strictEqual(hoursForDate(old, "2026-10-09"), null);
});

test("ספר בלי סדר עבודה מקבל את ברירת המחדל: ראשון עד חמישי", () => {
  const w = weeklyOf({ slotMinutes: 30 });
  assert.deepStrictEqual(w.filter((d) => d.active).map((d) => d.day), [0, 1, 2, 3, 4]);
});

test("תור בתוך השעות החדשות אינו מתנגש", () => {
  const appts = [{ date: "2026-10-04", time: "10:00" }, { date: "2026-10-09", time: "12:30" }];
  assert.deepStrictEqual(findConflicts(barber, appts), []);
});

test("יום חופש בתאריך שיש בו תור מחזיר את התור כהתנגשות", () => {
  const appts = [{ date: "2026-10-04", time: "10:00" }, { date: "2026-10-05", time: "10:00" }];
  const sp = { ...barber, exceptions: [{ date: "2026-10-04", off: true }] };
  assert.deepStrictEqual(findConflicts(sp, appts), [appts[0]]);
});

test("קיצור שעות היום מחזיר רק את התורים שמחוץ לשעות החדשות", () => {
  const appts = [{ date: "2026-10-09", time: "08:00" }, { date: "2026-10-09", time: "12:30" }];
  const shorter = week.map((d) => (d.day === 5 ? { ...d, endHour: "12:00" } : d));
  const sp = { ...barber, weeklySchedule: shorter };
  assert.deepStrictEqual(findConflicts(sp, appts), [appts[1]]);   // 12:30 כבר מחוץ לשעות
});

test("ביטול יום עבודה בסדר השבועי מחזיר את כל התורים של אותו יום", () => {
  const appts = [{ date: "2026-10-09", time: "08:00" }, { date: "2026-10-16", time: "09:00" }];
  const noFriday = week.map((d) => (d.day === 5 ? { ...d, active: false } : d));
  assert.strictEqual(findConflicts({ ...barber, weeklySchedule: noFriday }, appts).length, 2);
});

test("הזזת שעת ההתחלה כך שהתור כבר אינו על אחד התורים ביום נחשבת התנגשות", () => {
  const appts = [{ date: "2026-10-04", time: "10:00" }];
  const shifted = week.map((d) => (d.day === 0 ? { ...d, startHour: "09:15" } : d));
  assert.deepStrictEqual(findConflicts({ ...barber, weeklySchedule: shifted }, appts), appts);
});
