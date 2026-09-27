// שדה תאריך. בשדה תאריך רגיל הדפדפן מציג את התבנית לפי השפה שלו, ובדפדפן בעברית יוצא
// "dd/מ״מ/YYYY". לכן התאריך מוצג כאן כטקסט ("15/10/2026", או "יום/חודש/שנה" כשהשדה ריק),
// ולחיצה על השדה פותחת את לוח השנה של הדפדפן. הערך עצמו נשאר "YYYY-MM-DD" כמו בשדה רגיל.
import { useRef } from "react";

// "2026-10-15" -> "15/10/2026"
function show(value) {
  const [y, m, d] = value.split("-");
  return d + "/" + m + "/" + y;
}

export default function DateInput({ value, onChange, name, min, max, className = "" }) {
  const picker = useRef(null);

  function open() {
    try {
      picker.current.showPicker();
    } catch {
      picker.current.focus();   // דפדפן ישן בלי showPicker
    }
  }

  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }

  return (
    <div className={"relative " + className}>
      <input type="text" readOnly value={value ? show(value) : ""} placeholder="יום/חודש/שנה"
             onClick={open} onKeyDown={onKey}
             className="w-full border rounded p-2 pl-9 bg-white cursor-pointer" />
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
           width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
      {/* השדה של הדפדפן: מוסתר, ומשמש רק ללוח השנה ולשמירת הערך */}
      <input ref={picker} type="date" name={name} value={value} min={min} max={max} onChange={onChange}
             tabIndex={-1} aria-hidden="true" className="absolute inset-0 opacity-0 pointer-events-none" />
    </div>
  );
}
