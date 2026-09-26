// בדיקות יחידה לאלגוריתם חישוב התורים הפנויים (סעיף 10 בספר).
// הפונקציה נבדקת במנותק מהשרת וממסד הנתונים: נכנס לוח עבודה ורשימת
// תורים תפוסים, יוצאת רשימת השעות הפנויות.
const test = require("node:test");
const assert = require("node:assert");
const { calcFreeSlots } = require("../src/controllers/appointmentController");

const fullDay = { startHour: "09:00", endHour: "19:00", slotMinutes: 30 };

test("יום עבודה מלא ללא תורים תפוסים מחזיר 20 תורים", () => {
  const slots = calcFreeSlots(fullDay, []);
  assert.strictEqual(slots.length, 20);
  assert.strictEqual(slots[0], "09:00");
  assert.strictEqual(slots[slots.length - 1], "18:30");
});

test("תור תפוס אינו מופיע ברשימת התורים הפנויים", () => {
  const slots = calcFreeSlots(fullDay, ["10:00", "14:30"]);
  assert.strictEqual(slots.length, 18);
  assert.ok(!slots.includes("10:00"));
  assert.ok(!slots.includes("14:30"));
  assert.ok(slots.includes("10:30"));
});

test("שעה שאינה נכנסת במלואה לפני שעת הסגירה אינה מוצעת", () => {
  const slots = calcFreeSlots({ startHour: "09:00", endHour: "10:00", slotMinutes: 45 }, []);
  assert.deepStrictEqual(slots, ["09:00"]);   // 09:45 היה נגמר ב-10:30, אחרי הסגירה
});

test("כשכל השעות תפוסות מוחזרת רשימה ריקה", () => {
  const all = calcFreeSlots(fullDay, []);
  assert.deepStrictEqual(calcFreeSlots(fullDay, all), []);
});

test("אורך תור של שעה מחזיר מחצית מהתורים", () => {
  const slots = calcFreeSlots({ startHour: "09:00", endHour: "19:00", slotMinutes: 60 }, []);
  assert.strictEqual(slots.length, 10);
  assert.strictEqual(slots[1], "10:00");
});

test("יום עבודה קצר מחשב נכון גם בחצאי שעות", () => {
  const slots = calcFreeSlots({ startHour: "08:30", endHour: "11:00", slotMinutes: 30 }, ["09:30"]);
  assert.deepStrictEqual(slots, ["08:30", "09:00", "10:00", "10:30"]);
});
