// עבודה עם תאריכים לפי השעון המקומי.
// toISOString מחזיר את התאריך לפי UTC, ובישראל זה תאריך אחר בשעות הלילה.

// התאריך של היום בתבנית "YYYY-MM-DD" לפי השעון המקומי
function todayString() {
  return toDateString(new Date());
}

function toDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// היום בשבוע (0 = ראשון) של תאריך בתבנית "YYYY-MM-DD"
function dayOfWeek(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

module.exports = { todayString, toDateString, dayOfWeek };
