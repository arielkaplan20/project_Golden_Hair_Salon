// שליחת הודעות דואר אלקטרוני ללקוחות, דרך חשבון Gmail של העסק
const nodemailer = require("nodemailer");

// אם לא הוגדרו פרטי דואר בקובץ .env, המערכת ממשיכה לעבוד בלי לשלוח מיילים
function getTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS.replace(/\s/g, ""),   // הסיסמה מגוגל מגיעה עם רווחים
    },
  });
}

// מעטפת HTML אחידה לכל המיילים של המערכת
function wrap(title, body) {
  return `
  <div dir="rtl" style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
      <div style="background:#ca8a04; color:#ffffff; padding:16px; text-align:center;">
        <h1 style="margin:0; font-size:20px;">GOLDEN HAIR SALON</h1>
      </div>
      <div style="padding:24px; color:#333333; line-height:1.6;">
        <h2 style="margin-top:0; font-size:18px;">${title}</h2>
        ${body}
      </div>
    </div>
  </div>`;
}

// שליחה בפועל. נכשלת בשקט כדי ששגיאת דואר לא תפיל פעולה שכבר הצליחה
async function sendMail(to, subject, title, body) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("דילוג על שליחת מייל (לא הוגדרו MAIL_USER ו-MAIL_PASS):", subject);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"GOLDEN HAIR SALON" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: wrap(title, body),
    });
    console.log("נשלח מייל אל", to, "-", subject);
    return true;
  } catch (err) {
    console.error("שליחת המייל נכשלה:", err.message);
    return false;
  }
}

// מייל אישור על קביעת תור - SUC-3 צעד 5
function sendAppointmentConfirmation(user, barberName, date, time) {
  return sendMail(user.email, "אישור הזמנת תור - GOLDEN HAIR SALON", `שלום ${user.firstName},`, `
    <p>התור שלך נקבע בהצלחה. אלה הפרטים:</p>
    <table style="border-collapse:collapse; margin:16px 0;">
      <tr><td style="padding:6px 14px 6px 0;"><b>תאריך</b></td><td>${date}</td></tr>
      <tr><td style="padding:6px 14px 6px 0;"><b>שעה</b></td><td>${time}</td></tr>
      <tr><td style="padding:6px 14px 6px 0;"><b>ספר</b></td><td>${barberName}</td></tr>
    </table>
    <p>אם לא תוכל להגיע, אפשר לשנות או לבטל את התור דרך האפליקציה, והמועד יתפנה ללקוחות אחרים.</p>
    <p>נתראה,<br>צוות GOLDEN HAIR SALON</p>`);
}

// מייל שחזור סיסמה - סעיף 6.1.2 בספר
function sendPasswordReset(user, link) {
  return sendMail(user.email, "שחזור סיסמה - GOLDEN HAIR SALON", `שלום ${user.firstName},`, `
    <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחיצה על הכפתור תעביר אותך לדף שבו תוכל לבחור סיסמה חדשה:</p>
    <p style="text-align:center; margin:24px 0;">
      <a href="${link}" style="background:#ca8a04; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; display:inline-block;">
        בחירת סיסמה חדשה
      </a>
    </p>
    <p>הקישור תקף למשך שעה אחת בלבד.</p>
    <p>אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם מההודעה הזו והסיסמה הקיימת תישאר ללא שינוי.</p>`);
}

module.exports = { sendMail, sendAppointmentConfirmation, sendPasswordReset };
