// התאריך של היום בתבנית "YYYY-MM-DD" לפי השעון המקומי.
// toISOString מחזיר את התאריך לפי UTC, ובישראל זה תאריך אחר בשעות הלילה.
export function todayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}
